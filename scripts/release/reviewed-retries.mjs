import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { assertRetentionWorkflow, ensureRetentionIndexes, retentionRequest } from './feedback-retention.mjs';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { verify } from './artifact.mjs';

const require = createRequire(import.meta.url);
// These are newly admitted idempotent, bounded consumers in the approved change.
const reviewedNewRetries = new Map([
  ['customerNotificationCreated', { source: 'functions/src/customer-notification-delivery.ts', document: 'outboxJobs/{jobId}' }],
  ['purchaseSePayInboxWorker', { source: 'functions/src/purchase-sepay.ts', document: 'purchaseSePayInbox/{id}' }],
]);
export function retryAdmission(manifest, want, have, backend) {
  const expected = new Map(manifest.inventory.map(row => [row.name, row]));
  const endpoints = backend.allEndpoints(want);
  if (expected.size !== manifest.inventory.length || endpoints.length !== expected.size) throw Error('RETRY_ADMISSION_INVENTORY_MISMATCH');
  const seen = new Set(), retryEndpoints = [], newRetries = [];
  for (const endpoint of endpoints) {
    const row = expected.get(endpoint.id);
    if (!row || seen.has(endpoint.id) || endpoint.project !== 'satsunicgo' || endpoint.region !== 'asia-southeast1' || endpoint.codebase !== 'satsunicgo' || endpoint.platform !== 'gcfv2') throw Error('RETRY_ADMISSION_ENDPOINT_MISMATCH');
    seen.add(endpoint.id);
    if (!backend.isEventTriggered(endpoint) || endpoint.eventTrigger.retry !== true) continue;
    retryEndpoints.push(endpoint.id);
    const previous = have.endpoints?.[endpoint.region]?.[endpoint.id];
    if (previous && backend.isEventTriggered(previous) && previous.eventTrigger.retry === true) continue;
    const reviewed = reviewedNewRetries.get(endpoint.id);
    if (!reviewed || row.kind !== 'onDocumentCreated' || row.source !== reviewed.source || endpoint.eventTrigger.eventType !== 'google.cloud.firestore.document.v1.created' || endpoint.eventTrigger.eventFilterPathPatterns?.document !== reviewed.document) throw Error('UNREVIEWED_NEW_RETRY_POLICY');
    newRetries.push(endpoint.id);
  }
  return { schemaVersion: 1, sha: manifest.sha, tag: manifest.tag, project: 'satsunicgo', retryEndpoints: retryEndpoints.sort(), newRetries: newRetries.sort() };
}
export function installReviewedRetryPrompt(prompts, backend, manifest, record = () => {}) {
  const original = prompts.promptForFailurePolicies;
  if (typeof original !== 'function') throw Error('FIREBASE_RETRY_PROMPT_CONTRACT_CHANGED');
  prompts.promptForFailurePolicies = async (options, want, have) => {
    if (options.force || options.nonInteractive !== true) throw Error('UNSAFE_DEPLOYMENT_OPTIONS');
    const admission = retryAdmission(manifest, want, have, backend);
    record(admission);
    // The copied flag is seen only by the retry confirmation, never deletion or migration.
    return original({ ...options, force: admission.newRetries.length > 0 }, want, have);
  };
  return () => { prompts.promptForFailurePolicies = original; };
}
export function deploymentArguments(manifest, sha, tag) {
  if (manifest.sha !== sha || manifest.tag !== tag || !/^[a-f0-9]{40}$/.test(sha ?? '') || !/^v\d+\.\d+\.\d+$/.test(tag ?? '')) throw Error('DEPLOYMENT_IDENTITY_MISMATCH');
  const names = manifest.inventory.map(row => row.name);
  if (!names.length || new Set(names).size !== names.length || names.some(name => !/^[A-Za-z][A-Za-z0-9]*$/.test(name))) throw Error('UNSAFE_FUNCTION_INVENTORY');
  return ['deploy', '--project', 'satsunicgo', '--config', 'firebase.json', '--only', [...names.sort().map(name => `functions:satsunicgo:${name}`), 'hosting'].join(','), '--non-interactive', '--message', `${tag} / ${sha}`];
}
export async function launchReviewedDeployment(root = process.cwd()) {
  const packageFile = require.resolve('firebase-tools/package.json');
  if (JSON.parse(readFileSync(packageFile, 'utf8')).version !== '15.32.1') throw Error('FIREBASE_RETRY_PROMPT_CONTRACT_CHANGED');
  const manifest = verify(resolve(root, 'release-work'), process.env.GITHUB_SHA, process.env.RELEASE_TAG);
  if (manifest.feedbackRetention) {
    const account = execFileSync('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], {encoding:'utf8',timeout:30_000}).trim();
    assertRetentionWorkflow(process.env, manifest, account);
    const token = execFileSync('gcloud', ['auth','print-access-token'], {encoding:'utf8',timeout:30_000}).trim();
    const indexes = await ensureRetentionIndexes(manifest.feedbackRetention, retentionRequest(token), {create:true});
    writeFileSync(resolve(root, 'retention-index-delivery.json'), JSON.stringify({schemaVersion:1,sha:manifest.sha,tag:manifest.tag,project:'satsunicgo',...indexes},null,2)+'\n');
  }
  const prompts = require('firebase-tools/lib/deploy/functions/prompts.js');
  const backend = require('firebase-tools/lib/deploy/functions/backend.js');
  installReviewedRetryPrompt(prompts, backend, manifest, admission => writeFileSync(resolve(root, 'retry-policy-admission.json'), JSON.stringify(admission, null, 2) + '\n'));
  const cli = require.resolve('firebase-tools/lib/bin/firebase.js');
  process.chdir(resolve(root, 'release-work/deployment'));
  process.argv = [process.execPath, cli, ...deploymentArguments(manifest, process.env.GITHUB_SHA, process.env.RELEASE_TAG)];
  require(cli);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await launchReviewedDeployment(); }
  catch (error) {
    const code = /^[A-Z][A-Z_]{2,79}$/.test(error.message ?? '') ? error.message : 'REVIEWED_DEPLOYMENT_ADMISSION_FAILED';
    console.error(code); process.exitCode = 1;
  }
}
