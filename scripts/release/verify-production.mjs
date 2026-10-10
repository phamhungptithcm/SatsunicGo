import { execFileSync } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { setTimeout } from 'node:timers';
/* global fetch, AbortSignal */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, verify } from './artifact.mjs';

const projection = 'json(name,state,buildConfig.source,serviceConfig.revision,serviceConfig.environmentVariables,labels,eventTrigger.retryPolicy)';
function inventory() {
  return JSON.parse(execFileSync('gcloud', ['functions', 'list', '--v2', '--project=satsunicgo', '--regions=asia-southeast1', `--format=${projection}`], {
    encoding: 'utf8', timeout: 120_000,
  })).filter(f => f.labels?.['firebase-functions-codebase'] === 'satsunicgo');
}
export function checkInventory(manifest, deployed, allowMissing) {
  const names = new Set(manifest.inventory.map(f => f.name));
  if (!names.size || manifest.inventory.some(f => f.region !== 'asia-southeast1' || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(f.name))) throw Error('UNSAFE_FUNCTION_INVENTORY');
  const actual = new Set();
  for (const fn of deployed) {
    const id = fn.name.split('/').at(-1);
    if (!names.has(id) || actual.has(id)) throw Error('FUNCTION_REMOVAL_OR_DUPLICATE_BLOCKED');
    actual.add(id);
    if (!allowMissing && (fn.state !== 'ACTIVE' || !fn.serviceConfig?.revision || !fn.buildConfig?.source?.storageSource)) throw Error('FUNCTION_NOT_ACTIVE_OR_SOURCE_UNAVAILABLE');
  }
  if (!allowMissing && actual.size !== names.size) throw Error('MISSING_DEPLOYED_FUNCTION');
}
export function verifyRuntimeEnvironment(manifest, deployed) {
  const expected = manifest.runtimeEnvironment;
  if (!expected) return;
  if (JSON.stringify(expected) !== JSON.stringify({ PURCHASE_PRODUCTION_TEST_ARTIFACT: 'v1', PURCHASE_SEPAY_SANDBOX_ENABLED: 'true' })) throw Error('UNSAFE_RUNTIME_ENVIRONMENT');
  for (const fn of deployed) {
    const environment = fn.serviceConfig?.environmentVariables;
    if (!environment || Object.entries(expected).some(([key, value]) => environment[key] !== value) || Object.keys(environment).some(key => /EMULATOR/.test(key))) throw Error('DEPLOYED_RUNTIME_ENVIRONMENT_MISMATCH');
  }
}
export function verifyRetryReadback(manifest, deployed, admission) {
  if (admission?.schemaVersion !== 1 || admission.sha !== manifest.sha || admission.tag !== manifest.tag || admission.project !== 'satsunicgo' || !Array.isArray(admission.retryEndpoints) || !Array.isArray(admission.newRetries)) throw Error('RETRY_ADMISSION_BINDING_MISMATCH');
  const names = new Set(manifest.inventory.map(row => row.name));
  const expected = new Set(admission.retryEndpoints);
  if (expected.size !== admission.retryEndpoints.length || admission.retryEndpoints.some(name => !names.has(name)) || admission.newRetries.some(name => !expected.has(name))) throw Error('RETRY_ADMISSION_BINDING_MISMATCH');
  const actual = new Set(deployed.filter(row => row.eventTrigger?.retryPolicy === 'RETRY_POLICY_RETRY').map(row => row.name.split('/').at(-1)));
  if (actual.size !== expected.size || [...expected].some(name => !actual.has(name))) throw Error('DEPLOYED_RETRY_POLICY_MISMATCH');
  return [...expected].sort();
}
export async function waitForActiveInventory(manifest, read = inventory, pause = () => new Promise(done => setTimeout(done, 10_000))) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = read();
    try { checkInventory(manifest, current, false); return current; }
    catch (error) {
      const transient = ['FUNCTION_NOT_ACTIVE_OR_SOURCE_UNAVAILABLE', 'MISSING_DEPLOYED_FUNCTION'].includes(error.message);
      if (!transient || current.some(fn => !['ACTIVE', 'DEPLOYING'].includes(fn.state)) || attempt === 5) throw error;
      await pause();
    }
  }
}
async function fetchBytes(url, headers = {}) {
  const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw Error('PROVIDER_HTTP_FAILURE');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 32 * 1024 * 1024) throw Error('PROVIDER_RESPONSE_BUDGET_EXCEEDED');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export async function verifyHosting(manifest, read = fetchBytes) {
  const origin = 'https://satsunicgo.web.app';
  const metadata = JSON.parse((await read(`${origin}/release-version.json?sha=${manifest.sha}`, { 'Cache-Control': 'no-cache' })).toString());
  if (metadata.tag !== manifest.tag || metadata.sha !== manifest.sha || metadata.project !== 'satsunicgo') throw Error('DEPLOYED_HOSTING_VERSION_MISMATCH');
  const prefix = 'deployment/dist/';
  const entries = Object.entries(manifest.files).filter(([name]) => name.startsWith(prefix) && !name.slice(prefix.length).split('/').some(p => p.startsWith('.')));
  if (!entries.some(([name]) => name === `${prefix}index.html`)) throw Error('MISSING_HOSTING_INDEX');
  for (let i = 0; i < entries.length; i += 4) {
    await Promise.all(entries.slice(i, i + 4).map(async ([name, hash]) => {
      const bytes = await read(`${origin}/${name.slice(prefix.length)}?sha=${manifest.sha}`, { 'Cache-Control': 'no-cache' });
      if (digest(bytes) !== hash) throw Error('DEPLOYED_HOSTING_FILE_MISMATCH');
    }));
  }
  return { origin, verifiedFiles: entries.length };
}
export function assertStableHostingRelease(previous, current) {
  for (const release of [previous, current]) {
    if (release?.type !== 'DEPLOY' || !release.version?.name || release.version.status !== 'FINALIZED' || !release.name || !release.releaseTime) throw Error('HOSTING_RELEASE_NOT_FINALIZED');
  }
  if (previous.name !== current.name || previous.version.name !== current.version.name || previous.releaseTime !== current.releaseTime) throw Error('HOSTING_CHANGED_DURING_VERIFICATION');
}
export async function readHostingRelease(token, read = fetchBytes) {
  const releases = JSON.parse((await read('https://firebasehosting.googleapis.com/v1beta1/sites/satsunicgo/releases?pageSize=1', { Authorization: `Bearer ${token}`, 'x-goog-user-project': 'satsunicgo' })).toString());
  return releases.releases?.[0];
}
export async function readFunctionSource(source, token, read = fetchBytes) {
  if (!/^[a-z0-9._-]+$/.test(source.bucket) || !/^[\w./-]+$/.test(source.object) || source.object.split('/').includes('..') || !/^\d+$/.test(source.generation ?? '')) throw Error('INVALID_PROVIDER_SOURCE_REFERENCE');
  return read(`https://storage.googleapis.com/storage/v1/b/${source.bucket}/o/${encodeURIComponent(source.object)}?alt=media&generation=${source.generation}`, {
    Authorization: `Bearer ${token}`, 'x-goog-user-project': 'satsunicgo',
  });
}
export async function verifyProduction() {
  const manifest = verify(resolve('release-stage'), process.env.GITHUB_SHA, process.env.RELEASE_TAG);
  const bundleSha256 = readFileSync('bundle.sha256', 'utf8').split(/\s/)[0];
  if (!/^[a-f0-9]{64}$/.test(bundleSha256) || digest(readFileSync(`release-${manifest.tag}.tar.gz`)) !== bundleSha256) throw Error('BUNDLE_CHECKSUM_MISMATCH');
  // Token stays in memory; bind edge and source checks to one finalized Hosting release.
  const token = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', timeout: 30_000 }).trim();
  const initialHostingRelease = await readHostingRelease(token);
  assertStableHostingRelease(initialHostingRelease, initialHostingRelease);
  // Static edge propagation is bounded; content mismatch never becomes success by ignoring it.
  let hosting;
  for (let attempt = 0; attempt < 6; attempt++) {
    try { hosting = await verifyHosting(manifest); break; }
    catch (error) {
      if (attempt === 5) throw error;
      await new Promise(resolveWait => setTimeout(resolveWait, 10_000));
    }
  }
  const deployed = await waitForActiveInventory(manifest);
  verifyRuntimeEnvironment(manifest, deployed);
  const retryPolicies = verifyRetryReadback(manifest, deployed, JSON.parse(readFileSync('retry-policy-admission.json', 'utf8')));
  const directory = mkdtempSync(join(tmpdir(), 'release-source-'));
  const sources = new Set(), functions = [];
  try {
    for (const fn of deployed) {
      const source = fn.buildConfig.source.storageSource;
      if (!/^[a-z0-9._-]+$/.test(source.bucket) || !/^[\w./-]+$/.test(source.object) || source.object.split('/').includes('..') || !/^\d+$/.test(source.generation ?? '')) throw Error('INVALID_PROVIDER_SOURCE_REFERENCE');
      const uri = `gs://${source.bucket}/${source.object}#${source.generation}`;
      if (!sources.has(uri)) {
        const file = join(directory, `source-${sources.size}.zip`);
        writeFileSync(file, await readFunctionSource(source, token));
        execFileSync('python3', ['scripts/release/verify-source.py', file, 'release-stage/manifest.json'], { timeout: 60_000, stdio: 'pipe' });
        sources.add(uri);
      }
      functions.push({ name: fn.name, revision: fn.serviceConfig.revision, sourceGeneration: source.generation });
    }
  } finally { rmSync(directory, { recursive: true, force: true }); }
  const after = inventory();
  checkInventory(manifest, after, false);
  verifyRuntimeEnvironment(manifest, after);
  verifyRetryReadback(manifest, after, JSON.parse(readFileSync('retry-policy-admission.json', 'utf8')));
  if (deployed.some(fn => {
    const current = after.find(f => f.name === fn.name);
    return current.serviceConfig.revision !== fn.serviceConfig.revision || JSON.stringify(current.buildConfig.source) !== JSON.stringify(fn.buildConfig.source);
  })) throw Error('FUNCTION_CHANGED_DURING_VERIFICATION');
  const latest = await readHostingRelease(token);
  assertStableHostingRelease(initialHostingRelease, latest);
  writeFileSync('deployment.json', JSON.stringify({ schemaVersion: 1, status: 'VERIFIED', project: 'satsunicgo',
    tag: manifest.tag, sha: manifest.sha, bundleSha256, verifiedAt: new Date().toISOString(),
    hosting: { ...hosting, version: latest.version.name, releaseTime: latest.releaseTime }, functions, retryPolicies }, null, 2) + '\n');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === 'before') checkInventory(verify(resolve('release-stage'), process.env.GITHUB_SHA, process.env.RELEASE_TAG), inventory(), true);
    else if (process.argv[2] === 'after') await verifyProduction();
    else throw Error('INVALID_VERIFICATION_OPERATION');
  } catch (error) {
    const code = /^[A-Z][A-Z_]{2,79}$/.test(error.message ?? '') ? error.message : 'PROVIDER_COMMAND_OR_REQUEST_FAILED';
    console.error(`Verification code: ${code}`);
    // External commands may contain provider details. Keep this log free of opaque responses.
    console.error('PRODUCTION_VERIFICATION_FAILED: inspect workflow step and provider state; release remains a draft.');
    process.exitCode = 1;
  }
}
