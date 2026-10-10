import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import { setTimeout } from 'node:timers/promises';
/* global fetch, AbortSignal */

export const RETENTION_INDEXES = Object.freeze(['askFeedback','askFeedbackReviewOperations','askFeedbackQuota'].map(collectionGroup => ({ collectionGroup, queryScope: 'COLLECTION', fields: [{ fieldPath: 'retentionClass', order: 'ASCENDING' }, { fieldPath: 'expiresAt', order: 'ASCENDING' }] })));
export const RETENTION_INDEX_DIGEST = createHash('sha256').update(JSON.stringify(RETENTION_INDEXES)).digest('hex');
export const RETENTION_FILE = 'deployment/functions/feedback-retention.json';
export const RETENTION_SCHEDULER = 'projects/satsunicgo/locations/asia-southeast1/jobs/firebase-schedule-askFeedbackCleanup-asia-southeast1';
const parent = group => `projects/satsunicgo/databases/(default)/collectionGroups/${group}`;
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export function retentionMetadata(manifest) {
  if (!/^[a-f0-9]{40}$/.test(manifest.sha ?? '') || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.tag ?? '') || manifest.project !== 'satsunicgo') throw Error('RETENTION_ARTIFACT_IDENTITY_MISMATCH');
  return { schemaVersion: 1, project: 'satsunicgo', database: '(default)', artifactSha: manifest.sha, artifactTag: manifest.tag, indexDigest: RETENTION_INDEX_DIGEST, indexes: RETENTION_INDEXES };
}
export function assertRetentionSourceIndexes(config) {
  for (const spec of RETENTION_INDEXES) {
    const matches = config.indexes?.filter(row => row.collectionGroup === spec.collectionGroup && same(row.fields, spec.fields)) ?? [];
    if (matches.length !== 1 || !same(matches[0], spec)) throw Error('RETENTION_SOURCE_INDEX_MISMATCH');
    if (config.fieldOverrides?.some(row => row.collectionGroup === spec.collectionGroup && row.ttl)) throw Error('RETENTION_TTL_OUT_OF_SCOPE');
  }
}
export function verifyRetentionArtifact(root, manifest) {
  const admitted = (manifest.productionTestExports?.length ?? 0) > 0;
  const file = join(root, RETENTION_FILE);
  if (!admitted) {
    if (manifest.feedbackRetention !== undefined || existsSync(file)) throw Error('UNEXPECTED_RETENTION_ARTIFACT');
    return null;
  }
  const expected = retentionMetadata(manifest);
  if (!same(manifest.feedbackRetention, expected) || !existsSync(file) || !same(JSON.parse(readFileSync(file,'utf8')), expected)) throw Error('RETENTION_ARTIFACT_CONTRACT_MISMATCH');
  if (!manifest.inventory.some(row => row.name === 'askFeedbackCleanup' && row.kind === 'onSchedule' && row.source === 'functions/src/ai/feedback-lifecycle.ts') || manifest.heldExports.includes('askFeedbackCleanup')) throw Error('RETENTION_EXPORT_NOT_ADMITTED');
  return expected;
}
export function assertRetentionWorkflow(env, manifest, account) {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY !== 'phamhungptithcm/SatsunicGo' || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_WORKFLOW_REF !== 'phamhungptithcm/SatsunicGo/.github/workflows/release.yml@refs/heads/main' || env.GITHUB_SHA !== manifest.sha || env.RELEASE_TAG !== manifest.tag || account !== 'github-release@satsunicgo.iam.gserviceaccount.com') throw Error('RETENTION_TRUSTED_WORKFLOW_REQUIRED');
}
/** Only the reviewed GET/POST endpoints are reachable. No arbitrary API URL/method. */
export function retentionRequest(token, read = fetch) {
  if (!token || typeof token !== 'string') throw Error('RETENTION_IDENTITY_UNAVAILABLE');
  return async (method, path, body) => {
    const indexPath = /^projects\/satsunicgo\/databases\/\(default\)\/collectionGroups\/(askFeedback|askFeedbackReviewOperations|askFeedbackQuota)\/indexes(?:\?pageSize=100(?:&pageToken=[^&]+)?)?$/;
    const schedulerPath = path === RETENTION_SCHEDULER;
    if (!(method === 'GET' && (indexPath.test(path) || schedulerPath) || method === 'POST' && indexPath.test(path) && !path.includes('?') && RETENTION_INDEXES.some(spec => path === `${parent(spec.collectionGroup)}/indexes` && same(body, {queryScope: spec.queryScope, fields: spec.fields})))) throw Error('RETENTION_PROVIDER_OPERATION_OUT_OF_SCOPE');
    const origin = schedulerPath ? 'https://cloudscheduler.googleapis.com/v1/' : 'https://firestore.googleapis.com/v1/';
    const response = await read(origin+path, {method, headers: {Authorization: `Bearer ${token}`, 'x-goog-user-project': 'satsunicgo', ...(body ? {'Content-Type':'application/json'} : {})}, ...(body ? {body:JSON.stringify(body)} : {}), redirect:'error', signal:AbortSignal.timeout(30_000)});
    if (response.status === 403) throw Error(schedulerPath ? 'RETENTION_SCHEDULER_IAM_DENIED' : 'RETENTION_INDEX_IAM_DENIED');
    if (method === 'POST' && response.status === 409) return { alreadyExists: true };
    if (!response.ok) throw Error('RETENTION_PROVIDER_HTTP_FAILURE');
    const chunks=[];let size=0;
    for await (const chunk of response.body) { size+=chunk.length;if(size>1024*1024)throw Error('RETENTION_PROVIDER_RESPONSE_BUDGET');chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw Error('RETENTION_PROVIDER_RESPONSE_INVALID'); }
  };
}
function matchingIndexes(spec, rows) {
  const fields=[...spec.fields,{fieldPath:'__name__',order:'ASCENDING'}];
  return rows.filter(row => row.queryScope === spec.queryScope && (row.apiScope === undefined || row.apiScope === 'ANY_API') && (row.density === undefined || row.density === 'SPARSE_ALL') && !row.multikey && !row.unique && same(row.fields, fields));
}
async function listIndexes(spec, request) {
  const rows=[],seen=new Set();let pageToken;
  for (let page=0;page<10;page++) {
    const result=await request('GET',`${parent(spec.collectionGroup)}/indexes?pageSize=100${pageToken ? '&pageToken='+encodeURIComponent(pageToken) : ''}`);
    if (result.indexes !== undefined && !Array.isArray(result.indexes) || result.nextPageToken !== undefined && typeof result.nextPageToken !== 'string') throw Error('RETENTION_INDEX_RESPONSE_INVALID');
    for(const row of result.indexes??[]) {
      if(!row || typeof row.name!=='string' || !row.name.startsWith(`${parent(spec.collectionGroup)}/indexes/`) || !/^[A-Za-z0-9_-]+$/.test(row.name.split('/').at(-1)) || seen.has(row.name)) throw Error('RETENTION_INDEX_RESPONSE_INVALID');
      seen.add(row.name);rows.push(row);
    }
    if (!result.nextPageToken) return rows;
    if (result.nextPageToken.length>4096 || result.nextPageToken===pageToken) throw Error('RETENTION_INDEX_PAGINATION_BUDGET');
    pageToken=result.nextPageToken;
  }
  throw Error('RETENTION_INDEX_PAGINATION_BUDGET');
}
/** Three fixed, create-only additions; a racing create is resolved by exact READY readback. */
export async function ensureRetentionIndexes(metadata, request, { create = false, pause = () => setTimeout(10_000) } = {}) {
  if (!same(metadata,retentionMetadata({sha:metadata?.artifactSha,tag:metadata?.artifactTag,project:metadata?.project}))) throw Error('RETENTION_ARTIFACT_CONTRACT_MISMATCH');
  const created=[],creationAttempted=[],racingExisting=[],indexes=[];
  const deadline=Date.now()+180_000;
  const boundedRequest=async (...args)=>{if(Date.now()>deadline)throw Error('RETENTION_INDEX_TIME_BUDGET');return request(...args);};
  for (const spec of RETENTION_INDEXES) {
    let matches=matchingIndexes(spec,await listIndexes(spec,boundedRequest));
    if (matches.length>1) throw Error('RETENTION_INDEX_DUPLICATE');
    if (!matches.length && create) {
      creationAttempted.push(spec.collectionGroup);
      const result=await boundedRequest('POST',`${parent(spec.collectionGroup)}/indexes`,{queryScope:spec.queryScope,fields:spec.fields});
      (result.alreadyExists ? racingExisting : created).push(spec.collectionGroup);
    }
    for (let attempt=0;attempt<12;attempt++) {
      if (attempt || !matches.length && create) matches=matchingIndexes(spec,await listIndexes(spec,boundedRequest));
      if (matches.length>1) throw Error('RETENTION_INDEX_DUPLICATE');
      const current=matches[0];
      if (current?.state==='READY') {indexes.push({collectionGroup:spec.collectionGroup,name:current.name,state:'READY'});break;}
      if (!create || current && current.state!=='CREATING' || attempt===11) throw Error('RETENTION_INDEX_NOT_READY');
      await pause();
    }
  }
  return {indexDigest:RETENTION_INDEX_DIGEST,indexes,created,creationAttempted,racingExisting};
}
export function verifyRetentionScheduler(job, fn) {
  const service=fn?.serviceConfig,oidc=job?.httpTarget?.oidcToken;
  // ProtoJSON omits default zero scalar values; absence means effective zero.
  const retry=job?.retryConfig;
  const retryCount=retry?.retryCount===undefined ? 0 : retry.retryCount;
  const maxRetryDuration=retry?.maxRetryDuration===undefined ? '0s' : retry.maxRetryDuration;
  const zeroRetry=(retry===undefined || retry!==null && typeof retry==='object' && !Array.isArray(retry)) && retryCount===0 && typeof maxRetryDuration==='string' && /^0(?:\.0{1,9})?s$/.test(maxRetryDuration);
  const validServiceAccount = /^(278913913091-compute@developer\.gserviceaccount\.com|[a-z][a-z0-9-]*@satsunicgo\.iam\.gserviceaccount\.com)$/;
  if (fn?.name!=='projects/satsunicgo/locations/asia-southeast1/functions/askFeedbackCleanup' || fn.state!=='ACTIVE' || !service?.revision || typeof service.uri!=='string' || !/^https:\/\/(askfeedbackcleanup-[a-z0-9-]+\.a\.run\.app|asia-southeast1-satsunicgo\.cloudfunctions\.net\/askFeedbackCleanup)$/.test(service.uri) || !validServiceAccount.test(service.serviceAccountEmail??'') || job?.name!==RETENTION_SCHEDULER || job.state!=='ENABLED' || job.schedule!=='every 60 minutes' || job.timeZone!=='UTC' || job.httpTarget?.httpMethod!=='POST' || job.httpTarget.uri!==service.uri || oidc?.serviceAccountEmail!==service.serviceAccountEmail || oidc.audience!==undefined && oidc.audience!==service.uri || !zeroRetry || job.pubsubTarget!==undefined || job.appEngineHttpTarget!==undefined || job.httpTarget.oauthToken!==undefined) throw Error('RETENTION_SCHEDULER_READBACK_MISMATCH');
  return {name:job.name,state:job.state,uri:service.uri,revision:service.revision};
}
/** Match the runtime canonical field order; Firestore may reorder map keys. */
export function retentionReadinessDigest(row) {
  const payload={schemaVersion:row.schemaVersion,artifactSha:row.artifactSha,artifactTag:row.artifactTag,indexDigest:row.indexDigest,verifiedAt:row.verifiedAt,expiresAt:row.expiresAt,indexNames:row.indexNames,indexState:row.indexState,scheduler:{name:row.scheduler.name,state:row.scheduler.state,uri:row.scheduler.uri,revision:row.scheduler.revision}};
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
export async function readRetentionReadiness(metadata, deployed, request, now=Date.now()) {
  const indexes=await ensureRetentionIndexes(metadata,request);
  const scheduler=verifyRetentionScheduler(await request('GET',RETENTION_SCHEDULER),deployed.find(fn=>fn.name.split('/').at(-1)==='askFeedbackCleanup'));
  return {schemaVersion:1,artifactSha:metadata.artifactSha,artifactTag:metadata.artifactTag,indexDigest:metadata.indexDigest,verifiedAt:now,expiresAt:now+86400000,indexNames:indexes.indexes.map(row=>row.name),indexState:'READY',scheduler};
}
