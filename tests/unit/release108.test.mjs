import test from 'node:test';
import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';
import process from 'node:process';
import { URL } from 'node:url';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, chmodSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { nextVersion, chooseCandidate, commitNotes, compareVersions, validateDeployIdentity } from '../../scripts/release/release.mjs';
import { create, verify, digest, deploymentConfig, deploymentLockSeed, assertLockedVersions, applyProductionHolds, HELD_EXPORTS, prepareWorkspace, REQUIRED_FUNCTION_ASSETS, excludeEmulatorOnlyExports } from '../../scripts/release/artifact.mjs';
import { checkInventory, verifyHosting, assertStableHostingRelease, readHostingRelease, readFunctionSource, waitForActiveInventory, verifyRetryReadback, verifyRuntimeEnvironment } from '../../scripts/release/verify-production.mjs';
import { retryAdmission, installReviewedRetryPrompt, deploymentArguments } from '../../scripts/release/reviewed-retries.mjs';
import { assertCompiledProductionTestExports, PRODUCTION_TEST_ENVIRONMENT, PRODUCTION_TEST_ENV_BYTES, PRODUCTION_TEST_ENV_FILE } from '../../scripts/release/production-test.mjs';
import { assetDecision } from '../../scripts/release/assets.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const sha = 'a'.repeat(40);
function temporary(t) {
  const path = mkdtempSync(join(tmpdir(), 'release108-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}
function put(root, file, content) {
  const path = join(root, file);
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content));
}
function builtFixture(t, beforeCreate = () => {}) {
  const root = temporary(t);
  const config = JSON.parse(readFileSync(join(repositoryRoot, 'firebase.json'), 'utf8'));
  put(root, 'firebase.json', config);
  put(root, 'firestore.rules', 'fixture');
  put(root, 'firestore.indexes.json', {});
  put(root, 'storage.rules', 'fixture');
  const csp = config.hosting.headers.find(h => h.source === '**').headers.find(h => h.key === 'Content-Security-Policy').value;
  put(root, 'dist/.vite/manifest.json', { 'index.html': { isEntry: true, file: 'assets/app.js', css: ['assets/app.css'] } });
  put(root, 'dist/index.html', '<html><head><link rel="stylesheet" href="/assets/app.css"></head><body><script type="module" src="/assets/app.js"></script></body></html>');
  put(root, 'dist/assets/app.js', 'fixture app');
  put(root, 'dist/assets/app.css', 'fixture styles');
  put(root, 'functions/generated/public-assets.json', { entry: '/assets/app.js', css: ['/assets/app.css'], csp });
  put(root, 'functions/package.json', { name: 'fixture', version: '0.1.0', engines: { node: '22' }, scripts: { build: 'tsc' }, main: 'lib/functions/src/index.js' });
  put(root, 'functions/package-lock.json', { version: '0.1.0', packages: { '': { name: 'fixture', version: '0.1.0' } } });
  put(root, 'package.json', { overrides: {} });
  put(root, 'package-lock.json', { lockfileVersion: 3, packages: { functions: { name: 'fixture', version: '0.1.0' } } });
  put(root, 'functions/lib/functions/src/index.js', '/* fixture precompiled */');
  put(root, 'functions/src/index.ts', `import { onRequest } from 'firebase-functions/v2/https';\n${['campaignBannersPublic', 'publicDiscovery', 'publicImage', 'publicPage'].map(name => `export const ${name} = onRequest({ region: 'asia-southeast1' }, () => {});`).join('\n')}`);
  put(root, 'candidate.json', { tag: 'v1.2.3', sha, repository: 'owner/repo' });
  put(root, 'release-notes.md', 'Fixture release notes');
  mkdirSync(join(root,'functions/assets'),{recursive:true});
  for(const name of REQUIRED_FUNCTION_ASSETS)copyFileSync(join(repositoryRoot,'functions/assets',name),join(root,'functions/assets',name));
  beforeCreate(root);
  const stage = join(root, 'stage');
  const manifest = create(root, stage, join(root, 'candidate.json'));
  return { root, stage, manifest };
}

test('first ordinary release is patch, feature is minor, breaking change is major', () => {
  assert.equal(nextVersion([], ['ordinary merge']), 'v0.0.1');
  assert.equal(nextVersion([], ['feat: catalog']), 'v0.1.0');
  assert.equal(nextVersion(['v1.2.3'], ['fix: error']), 'v1.2.4');
  assert.equal(nextVersion(['v1.2.3'], ['merge\n\nfeat(cart): catalog']), 'v1.3.0');
  assert.equal(nextVersion(['v1.2.3'], ['feat(api)!: compatibility']), 'v2.0.0');
  assert.equal(nextVersion(['v1.2.3'], ['update\n\nBREAKING CHANGE: migration']), 'v2.0.0');
});
test('authentication requires the exact production project/provider and same-project service account', () => {
  const provider = 'projects/278913913091/locations/global/workloadIdentityPools/github-release/providers/satsunicgo-main';
  assert.doesNotThrow(() => validateDeployIdentity(provider, 'github-release@satsunicgo.iam.gserviceaccount.com'));
  assert.throws(() => validateDeployIdentity(provider.replace('278913913091', '123456'), 'github-release@satsunicgo.iam.gserviceaccount.com'), /INVALID_PRODUCTION_AUTH/);
  assert.throws(() => validateDeployIdentity(provider, 'github-release@other.iam.gserviceaccount.com'), /INVALID_PRODUCTION_AUTH/);
  assert.throws(() => validateDeployIdentity('', ''), /INVALID_PRODUCTION_AUTH/);
});
test('version allocation includes reserved versions and rejects leading zero aliases', () => {
  assert.equal(nextVersion(['v1.9.0', 'v1.10.0', 'v01.12.0', 'v2.0.0-beta.1'], ['fix: issue']), 'v1.10.1');
  assert.equal(compareVersions('v9007199254740993.0.0', 'v9007199254740992.0.0'), 1);
  assert.throws(() => compareVersions('bad', 'v1.0.0'), /INVALID_RELEASE_TAG/);
});
test('same source reuses a draft and skips a verified published release', () => {
  const tags = [{ tag: 'v1.2.3', sha }];
  assert.equal(chooseCandidate({ tags, sha, releases: [{ tag_name: 'v1.2.3', draft: true, id: 1 }], messages: [] }).existing, true);
  assert.equal(chooseCandidate({ tags, sha, releases: [{ tag_name: 'v1.2.3', draft: false, body: '<!-- satsunicgo-production-verified -->' }], messages: [] }).published, true);
});
test('orphan tags require original-artifact recovery; manual publication and ambiguous identities fail closed', () => {
  const input = { tags: [{ tag: 'v1.2.3', sha }], sha, releases: [], messages: [] };
  assert.equal(chooseCandidate(input).releaseMissing, true);
  assert.throws(() => chooseCandidate({ ...input, releases: [{ tag_name: 'v1.2.3', draft: false }] }), /NOT_PRODUCTION_VERIFIED/);
  assert.throws(() => chooseCandidate({ ...input, tags: [...input.tags, { tag: 'v1.2.4', sha }] }), /AMBIGUOUS/);
  assert.throws(() => chooseCandidate({ ...input, sha: 'main' }), /INVALID_SOURCE_SHA/);
});
test('notes include every commit, migration context and uncategorized changes without executable markup', () => {
  const notes = commitNotes([
    { sha, subject: 'feat: customer catalog', body: '' },
    { sha: 'b'.repeat(40), subject: 'fix!: new contract', body: 'BREAKING CHANGE: migrate clients\nsecond line' },
    { sha: 'c'.repeat(40), subject: 'ordinary <script> @all `$(date)`', body: '' },
  ], 'owner/repo');
  assert.match(notes, /Features/);
  assert.match(notes, /Migration context: migrate clients second line/);
  assert.match(notes, /Maintenance and other changes/);
  assert.equal(notes.includes('<script>'), false);
  assert.equal(notes.includes('@all'), false);
  assert.equal((notes.match(/\/commit\//g) ?? []).length, 3);
});
test('deploy configuration strips compile hooks, rules and indexes', () => {
  const config = JSON.parse(readFileSync(join(repositoryRoot, 'firebase.json'), 'utf8'));
  const generated = deploymentConfig(config);
  assert.deepEqual(generated.functions[0].predeploy, []);
  assert.equal(generated.firestore, undefined);
  assert.equal(generated.storage, undefined);
  assert.ok(generated.functions[0].ignore.includes('.env*'));
  assert.throws(() => deploymentConfig({ ...config, functions: [{ ...config.functions[0], source: 'other' }] }), /UNEXPECTED/);
});
test('artifact binds frontend/backend version, asset manifest, inventory and dependencies', t => {
  const { stage, manifest } = builtFixture(t);
  assert.equal(manifest.inventory.length, 4);
  assert.equal(verify(stage, sha, 'v1.2.3').tag, 'v1.2.3');
  const pkg = JSON.parse(readFileSync(join(stage, 'deployment/functions/package.json'), 'utf8'));
  assert.equal(pkg.version, '1.2.3');
  assert.equal(pkg.scripts, undefined);
  assert.equal(JSON.parse(readFileSync(join(stage, 'deployment/functions/package-lock.json'), 'utf8')).packages[''].version, '1.2.3');
  assert.equal(Object.keys(manifest.files).some(f => f.includes('/src/index.ts')), false);
  for(const name of REQUIRED_FUNCTION_ASSETS)assert.equal(manifest.files[`deployment/functions/assets/${name}`],digest(readFileSync(join(repositoryRoot,'functions/assets',name))));
});

const demoMetadata=[{name:'purchaseDemoPayment',kind:'onCall',region:'asia-southeast1',source:'functions/src/purchase-checkout.ts'}];
const demoCompiled=`exports.purchaseDemoPayment = exports.purchaseCheckout = void 0;
const purchase_checkout_2 = require('./purchase-checkout');
exports.purchaseDemoPayment = process.env.FUNCTIONS_EMULATOR === 'true' ? purchase_checkout_2.purchaseDemoPayment : undefined;
const purchase_checkout_1 = require('./purchase-checkout');
Object.defineProperty(exports,'purchaseCheckout',{enumerable:true,get:function(){return purchase_checkout_1.purchaseCheckout;}});`;
test('compiled demo exclusion is deterministic even with emulator env and preserves public getter',()=>{
  const result=excludeEmulatorOnlyExports(demoCompiled,demoMetadata), exports={},loads=[];
  const checkout=()=>{},demo=()=>{throw Error('MUST_NOT_EXPOSE_DEMO');};
  runInNewContext(result.compiled,{exports,process:{env:{FUNCTIONS_EMULATOR:'true'}},require:name=>{loads.push(name);return {purchaseCheckout:checkout,purchaseDemoPayment:demo};}});
  assert.equal(exports.purchaseDemoPayment,undefined);
  assert.equal(exports.purchaseCheckout,checkout);
  assert.equal(loads.length,1);
  assert.deepEqual(result.emulatorOnlyExports,['purchaseDemoPayment']);
  assert.deepEqual(HELD_EXPORTS,['askWorkflow','currentAskConversation','maintenance','createPaymentLink','payosWebhook','reconcilePayments','askFeedbackCleanup']);
  assert.doesNotThrow(()=>excludeEmulatorOnlyExports(result.compiled));
});
for(const [label,compiled] of [
  ['loose comparison',demoCompiled.replace('===','==')],
  ['inverted comparison',demoCompiled.replace('===','!==')],
  ['changed condition',demoCompiled.replace('FUNCTIONS_EMULATOR','ENABLE_DEMO')],
  ['computed condition',demoCompiled.replace('.FUNCTIONS_EMULATOR',"['FUNCTIONS_EMULATOR']")],
  ['false branch callable',demoCompiled.replace(': undefined',': purchase_checkout_2.purchaseDemoPayment')],
  ['void branch',demoCompiled.replace(': undefined',': void 0')],
  ['mutable module alias',demoCompiled.replace('const purchase_checkout_2','let purchase_checkout_2')],
  ['changed target module',demoCompiled.replace("require('./purchase-checkout')","require('./other')")],
  ['wrong target member',demoCompiled.replace('? purchase_checkout_2.purchaseDemoPayment','? purchase_checkout_2.purchaseCheckout')],
  ['escaped alias',`${demoCompiled}\nconst leaked=purchase_checkout_2;`],
  ['shadowed process',`const process={env:{FUNCTIONS_EMULATOR:'true'}};${demoCompiled}`],
  ['shadowed undefined',`const undefined=()=>{};${demoCompiled}`],
  ['shadowed require',`const require=()=>({});${demoCompiled}`],
  ['shadowed exports',`const exports={};${demoCompiled}`],
  ['environment mutation',`process.env.FUNCTIONS_EMULATOR='true';${demoCompiled}`],
  ['duplicated assignment',`${demoCompiled}\nexports.purchaseDemoPayment = process.env.FUNCTIONS_EMULATOR === 'true' ? purchase_checkout_2.purchaseDemoPayment : undefined;`],
  ['direct getter',`${demoCompiled}\nObject.defineProperty(exports,'purchaseDemoPayment',{get:()=>purchase_checkout_1.purchaseDemoPayment});`],
  ['computed export',demoCompiled.replace('exports.purchaseDemoPayment = process',"exports['purchaseDemoPayment'] = process")],
  ['module exports variant',demoCompiled.replace('exports.purchaseDemoPayment = process','module.exports.purchaseDemoPayment = process')],
  ['object assignment',`${demoCompiled}\nObject.assign(exports,{purchaseDemoPayment:()=>{}});`],
])test(`compiled emulator export fails closed: ${label}`,()=>assert.throws(()=>excludeEmulatorOnlyExports(compiled,demoMetadata),/EMULATOR_/));
test('source/compiled emulator disagreement and altered metadata fail closed',()=>{
  assert.throws(()=>excludeEmulatorOnlyExports(demoCompiled),/COMPILED_SHAPE/);
  assert.throws(()=>excludeEmulatorOnlyExports('exports.purchaseDemoPayment = void 0;',demoMetadata),/COMPILED_SHAPE/);
  for(const row of [{...demoMetadata[0],region:'us-central1'},{...demoMetadata[0],kind:'onRequest'},{...demoMetadata[0],source:'functions/src/other.ts'}, {...demoMetadata[0],name:'other'}])assert.throws(()=>excludeEmulatorOnlyExports(demoCompiled,[row]),/METADATA/);
  assert.throws(()=>excludeEmulatorOnlyExports(demoCompiled,[...demoMetadata,...demoMetadata]),/METADATA/);
});
test('artifact source and compiled demo exception remain excluded and separately documented',t=>{
  const {stage,manifest}=builtFixture(t,root=>{
    const original=readFileSync(join(root,'functions/src/index.ts'),'utf8');
    put(root,'functions/src/index.ts',`${original}\nimport {purchaseDemoPayment as guardedPurchaseDemoPayment} from './purchase-checkout';export const purchaseDemoPayment=process.env.FUNCTIONS_EMULATOR === 'true' ? guardedPurchaseDemoPayment : undefined;`);
    put(root,'functions/src/purchase-checkout.ts',`import {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});`);
    put(root,'functions/lib/functions/src/index.js',demoCompiled);
  });
  assert.equal(manifest.inventory.length,4);
  assert.deepEqual(manifest.emulatorOnlyExports,['purchaseDemoPayment']);
  assert.deepEqual(manifest.heldExports,[]);
  assert.equal(readFileSync(join(stage,'deployment/functions/lib/functions/src/index.js'),'utf8').includes('FUNCTIONS_EMULATOR'),false);
  assert.equal(verify(stage,sha,'v1.2.3').tag,'v1.2.3');
});
const allDemoMetadata=[...demoMetadata,
  {name:'purchaseDemoWebhook',kind:'onRequest',region:'asia-southeast1',source:'functions/src/purchase-demo-gateway.ts'},
  {name:'purchaseSePayPayment',kind:'onCall',region:'asia-southeast1',source:'functions/src/purchase-sepay.ts'},
  {name:'purchaseSePayIpn',kind:'onRequest',region:'asia-southeast1',source:'functions/src/purchase-sepay.ts'},
  {name:'purchaseSePayInboxWorker',kind:'onDocumentCreated',region:'asia-southeast1',source:'functions/src/purchase-sepay.ts'},
];
const allDemoCompiled=`${demoCompiled}
exports.purchaseDemoWebhook = exports.purchaseSePayPayment = exports.purchaseSePayIpn = exports.purchaseSePayInboxWorker = void 0;
const purchase_demo_gateway_1 = require('./purchase-demo-gateway');
exports.purchaseDemoWebhook = process.env.FUNCTIONS_EMULATOR === 'true' ? purchase_demo_gateway_1.purchaseDemoWebhook : undefined;
const purchase_sepay_1 = require('./purchase-sepay');
const localSePay = process.env.FUNCTIONS_EMULATOR === 'true' && process.env.GCLOUD_PROJECT === 'demo-satsunicgo';
exports.purchaseSePayPayment = localSePay ? purchase_sepay_1.purchaseSePayPayment : undefined;
exports.purchaseSePayIpn = localSePay ? purchase_sepay_1.purchaseSePayIpn : undefined;
exports.purchaseSePayInboxWorker = localSePay ? purchase_sepay_1.purchaseSePayInboxWorker : undefined;`;
function addAllDemoSource(root){
  const original=readFileSync(join(root,'functions/src/index.ts'),'utf8');
  put(root,'functions/src/index.ts',`${original}
import {purchaseDemoPayment as guardedPurchaseDemoPayment} from './purchase-checkout';
export const purchaseDemoPayment=process.env.FUNCTIONS_EMULATOR === 'true' ? guardedPurchaseDemoPayment : undefined;
import {purchaseDemoWebhook as guardedPurchaseDemoWebhook} from './purchase-demo-gateway';
export const purchaseDemoWebhook=process.env.FUNCTIONS_EMULATOR === 'true' ? guardedPurchaseDemoWebhook : undefined;
import {purchaseSePayPayment as sandboxSePayPayment,purchaseSePayIpn as sandboxSePayIpn,purchaseSePayInboxWorker as sandboxSePayInboxWorker} from './purchase-sepay';
const localSePay=process.env.FUNCTIONS_EMULATOR === 'true' && process.env.GCLOUD_PROJECT === 'demo-satsunicgo';
export const purchaseSePayPayment=localSePay ? sandboxSePayPayment : undefined;
export const purchaseSePayIpn=localSePay ? sandboxSePayIpn : undefined;
export const purchaseSePayInboxWorker=localSePay ? sandboxSePayInboxWorker : undefined;`);
  put(root,'functions/src/purchase-checkout.ts',`import {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});`);
  put(root,'functions/src/purchase-demo-gateway.ts',`import {onRequest} from 'firebase-functions/v2/https';export const purchaseDemoWebhook=onRequest({region:'asia-southeast1'},()=>{});`);
  put(root,'functions/src/purchase-sepay.ts',`import {onCall,onRequest} from 'firebase-functions/v2/https';import {onDocumentCreated} from 'firebase-functions/v2/firestore';const options={region:'asia-southeast1'};export const purchaseSePayPayment=onCall(options,()=>{});export const purchaseSePayIpn=onRequest(options,()=>{});export const purchaseSePayInboxWorker=onDocumentCreated({...options,document:'purchaseSePayInbox/{id}'},()=>{});`);
}
test('all five demo exports and their shared imports are stripped once with production getters preserved',()=>{
  const result=excludeEmulatorOnlyExports(allDemoCompiled,allDemoMetadata),exports={},loads=[];
  const checkout=()=>{},forbidden=()=>{throw Error('DEMO_MUST_NOT_LOAD');};
  runInNewContext(result.compiled,{exports,process:{env:{FUNCTIONS_EMULATOR:'true',GCLOUD_PROJECT:'demo-satsunicgo'}},require:name=>{loads.push(name);assert.equal(name,'./purchase-checkout');return {purchaseCheckout:checkout,purchaseDemoPayment:forbidden};}});
  for(const {name} of allDemoMetadata)assert.equal(exports[name],undefined);
  assert.equal(exports.purchaseCheckout,checkout);
  assert.deepEqual(loads,['./purchase-checkout']);
  assert.deepEqual(result.emulatorOnlyExports,allDemoMetadata.map(row=>row.name));
  assert.equal(result.compiled.includes('localSePay'),false);
  assert.equal(result.compiled.includes('purchase-sepay'),false);
  assert.equal(result.compiled.includes('purchase-demo-gateway'),false);
  assert.doesNotThrow(()=>excludeEmulatorOnlyExports(result.compiled));
});
for(const [label,compiled] of [
  ['missing project fence',allDemoCompiled.replace(" && process.env.GCLOUD_PROJECT === 'demo-satsunicgo'",'')],
  ['production project fence',allDemoCompiled.replace('demo-satsunicgo','satsunicgo')],
  ['or project fence',allDemoCompiled.replace('&&','||')],
  ['mutable project guard',allDemoCompiled.replace('const localSePay','let localSePay')],
  ['mutated project guard',`${allDemoCompiled}\nlocalSePay=true;`],
  ['escaped project guard',`${allDemoCompiled}\nconst escaped=localSePay;`],
  ['missing project guard',allDemoCompiled.replace(/const localSePay[^;]*;/,'')],
  ['mutable shared SDK import',allDemoCompiled.replace('const purchase_sepay_1','let purchase_sepay_1')],
  ['escaped shared SDK import',`${allDemoCompiled}\nconst escaped=purchase_sepay_1;`],
  ['shared import reused by production export',`${allDemoCompiled}\nObject.defineProperty(exports,'production',{get:()=>purchase_sepay_1.production});`],
  ['duplicate shared SDK import',`${allDemoCompiled}\nconst purchase_sepay_1=require('./purchase-sepay');`],
  ['wrong shared SDK module',allDemoCompiled.replace("require('./purchase-sepay')","require('./other-sepay')")],
  ['wrong SePay target',allDemoCompiled.replace('? purchase_sepay_1.purchaseSePayIpn','? purchase_sepay_1.purchaseSePayPayment')],
  ['unsafe SePay false branch',allDemoCompiled.replace('purchase_sepay_1.purchaseSePayIpn : undefined','purchase_sepay_1.purchaseSePayIpn : purchase_sepay_1.purchaseSePayIpn')],
  ['computed SePay export',allDemoCompiled.replace('exports.purchaseSePayIpn = localSePay',"exports['purchaseSePayIpn'] = localSePay")],
  ['computed webhook export',allDemoCompiled.replace('exports.purchaseDemoWebhook = process',"exports['purchaseDemoWebhook'] = process")],
  ['duplicated SePay assignment',`${allDemoCompiled}\nexports.purchaseSePayIpn=localSePay ? purchase_sepay_1.purchaseSePayIpn : undefined;`],
  ['missing SePay assignment',allDemoCompiled.replace('exports.purchaseSePayIpn = localSePay ? purchase_sepay_1.purchaseSePayIpn : undefined;','')],
  ['environment alias',`const env=process.env;env.FUNCTIONS_EMULATOR='true';${allDemoCompiled}`],
  ['environment mutator',`Object.assign(process.env,{GCLOUD_PROJECT:'demo-satsunicgo'});${allDemoCompiled}`],
  ['malformed compiled syntax',`${allDemoCompiled}\nconst broken=;`],
])test(`five-demo compiled exclusion rejects ${label}`,()=>assert.throws(()=>excludeEmulatorOnlyExports(compiled,allDemoMetadata),/EMULATOR_(?:EXPORT_COMPILED_SHAPE|BINDING_(?:ESCAPES|SHADOWED|MUTATED))/));
test('five-demo metadata cannot invent, duplicate, omit or replace source evidence',()=>{
  for(const row of allDemoMetadata){
    for(const changed of [{...row,region:'us-central1'},{...row,kind:'onSchedule'},{...row,source:'functions/src/other.ts'},{...row,unexpected:true}])
      assert.throws(()=>excludeEmulatorOnlyExports(allDemoCompiled,allDemoMetadata.map(value=>value.name===row.name?changed:value)),/EMULATOR_EXPORT_METADATA/);
  }
  for(const rows of [null,{},[null],[[]],[{name:'unapprovedDemo'}],[...allDemoMetadata,allDemoMetadata[0]],[...allDemoMetadata.slice(0,-1),allDemoMetadata[0]]])assert.throws(()=>excludeEmulatorOnlyExports(allDemoCompiled,rows),/EMULATOR_EXPORT_METADATA/);
  const inherited=Object.assign(Object.create(allDemoMetadata[0]),{a:1,b:2,c:3,d:4});
  assert.throws(()=>excludeEmulatorOnlyExports(demoCompiled,[inherited]),/EMULATOR_EXPORT_METADATA/);
  assert.throws(()=>excludeEmulatorOnlyExports(allDemoCompiled,allDemoMetadata.slice(0,-1)),/EMULATOR_EXPORT_COMPILED_SHAPE/);
  assert.throws(()=>excludeEmulatorOnlyExports('exports.purchaseDemoPayment=void 0;',allDemoMetadata),/EMULATOR_EXPORT_COMPILED_SHAPE/);
  const replaced=allDemoCompiled.replace('exports.purchaseSePayIpn = localSePay ? purchase_sepay_1.purchaseSePayIpn : undefined;','exports.purchaseSePayPayment = localSePay ? purchase_sepay_1.purchaseSePayPayment : undefined;');
  assert.throws(()=>excludeEmulatorOnlyExports(replaced,allDemoMetadata),/EMULATOR_EXPORT_COMPILED_SHAPE/);
});
test('stripped package verification rejects reintroduced demo bindings even if file hashes are recomputed',t=>{
  for(const {name} of allDemoMetadata){
    const {stage}=builtFixture(t,root=>{addAllDemoSource(root);put(root,'functions/lib/functions/src/index.js',allDemoCompiled);});
    const relative='deployment/functions/lib/functions/src/index.js',entry=readFileSync(join(stage,relative),'utf8')+`\nObject.defineProperty(exports,'${name}',{get:()=>()=>{}});`;
    put(stage,relative,entry);
    const manifest=JSON.parse(readFileSync(join(stage,'manifest.json'),'utf8'));
    manifest.files[relative]=digest(entry);put(stage,'manifest.json',manifest);
    assert.throws(()=>verify(stage,sha,'v1.2.3'),/EMULATOR_EXPORT_COMPILED_SHAPE/);
  }
});
test('source preflight and compiled five-demo shape must agree before artifact creation',t=>{
  assert.throws(()=>builtFixture(t,root=>{
    addAllDemoSource(root);
    put(root,'functions/lib/functions/src/index.js',allDemoCompiled.replace('exports.purchaseSePayIpn = localSePay ? purchase_sepay_1.purchaseSePayIpn : undefined;',''));
  }),/EMULATOR_EXPORT_COMPILED_SHAPE/);
  assert.throws(()=>builtFixture(t,root=>{
    addAllDemoSource(root);
    put(root,'functions/src/index.ts',readFileSync(join(root,'functions/src/index.ts'),'utf8').replace("process.env.GCLOUD_PROJECT === 'demo-satsunicgo'","process.env.GCLOUD_PROJECT === 'satsunicgo'"));
    put(root,'functions/lib/functions/src/index.js',allDemoCompiled);
  }),/RELEASE_PREFLIGHT_FAILED/);
});
test('production package SDK discovery excludes all five demos even under an emulator environment',t=>{
  const publicNames=['campaignBannersPublic','publicDiscovery','publicImage','publicPage'];
  const {stage,manifest}=builtFixture(t,root=>{
    addAllDemoSource(root);
    const publicCompiled=`const {onRequest}=require('firebase-functions/v2/https');\n${publicNames.map(name=>`exports.${name}=onRequest({region:'asia-southeast1'},()=>{});`).join('\n')}`;
    put(root,'functions/lib/functions/src/index.js',allDemoCompiled.replace(/const purchase_checkout_1[^;]*;\s*Object.defineProperty\(exports,'purchaseCheckout'[^\n]*\);/,'')+'\n'+publicCompiled);
  });
  assert.equal(manifest.inventory.length,publicNames.length);
  assert.deepEqual(manifest.emulatorOnlyExports,allDemoMetadata.map(row=>row.name));
  const discovery=spawnSync(process.execPath,['-e',`require(process.argv[1]).loadStack(process.argv[2]).then(stack=>console.log(JSON.stringify(Object.keys(stack.endpoints).sort()))).catch(()=>{process.exitCode=1;});`,join(repositoryRoot,'node_modules/firebase-functions/lib/runtime/loader.js'),join(stage,'deployment/functions')],{
    env:{PATH:process.env.PATH,NODE_PATH:join(repositoryRoot,'node_modules'),FUNCTIONS_EMULATOR:'true',GCLOUD_PROJECT:'demo-satsunicgo',GOOGLE_CLOUD_PROJECT:'demo-satsunicgo',FIREBASE_CONFIG:JSON.stringify({projectId:'demo-satsunicgo'})},encoding:'utf8',timeout:15000,
  });
  assert.equal(discovery.status,0,discovery.stderr);
  assert.deepEqual(JSON.parse(discovery.stdout.trim()),publicNames.sort());
  const compiled=readFileSync(join(stage,'deployment/functions/lib/functions/src/index.js'),'utf8');
  assert.equal(compiled.includes('localSePay'),false);
  assert.equal(manifest.files['deployment/functions/lib/functions/src/index.js'],digest(compiled));
  assert.equal(verify(stage,sha,'v1.2.3').tag,'v1.2.3');
});
test('production package SDK discovery retains both email schedules and excludes every remaining hold and demo',t=>{
  const publicNames=['campaignBannersPublic','publicDiscovery','publicImage','publicPage'];
  const emailNames=['deliverEmail','deliverSubscriptionEmail'];
  const {stage,manifest}=builtFixture(t,root=>{
    addAllDemoSource(root);
    const original=readFileSync(join(root,'functions/src/index.ts'),'utf8');
    put(root,'functions/src/index.ts',`${original}\nexport {${HELD_EXPORTS.join(',')}} from './jobs';\nexport {deliverEmail} from './email';\nexport {deliverSubscriptionEmail} from './subscription-email';`);
    const scheduleSource=names=>`import {onSchedule} from 'firebase-functions/v2/scheduler';\n${names.map(name=>`export const ${name}=onSchedule({region:'asia-southeast1',schedule:'every 5 minutes'},()=>{});`).join('\n')}`;
    const scheduleCompiled=names=>`const {onSchedule}=require('firebase-functions/v2/scheduler');\n${names.map(name=>`exports.${name}=onSchedule({region:'asia-southeast1',schedule:'every 5 minutes'},()=>{});`).join('\n')}`;
    put(root,'functions/src/jobs.ts',scheduleSource(HELD_EXPORTS));
    for(const [module,name] of [['email','deliverEmail'],['subscription-email','deliverSubscriptionEmail']]){
      put(root,`functions/src/${module}.ts`,scheduleSource([name]));
      put(root,`functions/lib/functions/src/${module}.js`,scheduleCompiled([name]));
    }
    put(root,'functions/lib/functions/src/jobs.js',scheduleCompiled(HELD_EXPORTS));
    const compiled=[
      allDemoCompiled.replace(/const purchase_checkout_1[^;]*;\s*Object.defineProperty\(exports,'purchaseCheckout'[^\n]*\);/,''),
      'var workflow=require("./ai/ask-workflow");',
      'var payments=require("./payments/payos");',
      'var jobs=require("./jobs");',
      ...HELD_EXPORTS.map(name=>`Object.defineProperty(exports,"${name}",{enumerable:true,get:function(){return jobs.${name};}});`),
      'var email=require("./email");',
      'Object.defineProperty(exports,"deliverEmail",{enumerable:true,get:function(){return email.deliverEmail;}});',
      'var subscription=require("./subscription-email");',
      'Object.defineProperty(exports,"deliverSubscriptionEmail",{enumerable:true,get:function(){return subscription.deliverSubscriptionEmail;}});',
      "const {onRequest}=require('firebase-functions/v2/https');",
      ...publicNames.map(name=>`exports.${name}=onRequest({region:'asia-southeast1'},()=>{});`),
    ].join('\n');
    put(root,'functions/lib/functions/src/index.js',compiled);
  });
  const expected=[...publicNames,...emailNames].sort();
  assert.deepEqual(manifest.inventory.map(row=>row.name).sort(),expected);
  assert.deepEqual(manifest.heldExports,[...HELD_EXPORTS].sort());
  assert.deepEqual(manifest.emulatorOnlyExports,allDemoMetadata.map(row=>row.name));
  const script=`const net=require('node:net'),tls=require('node:tls');let attempts=0;const deny=()=>{attempts++;throw Error('NETWORK_DISABLED_FOR_DISCOVERY');};net.connect=net.createConnection=net.Socket.prototype.connect=tls.connect=deny;globalThis.fetch=async()=>deny();require(process.argv[1]).loadStack(process.argv[2]).then(stack=>console.log(JSON.stringify({endpoints:stack.endpoints,networkAttempts:attempts}))).catch(error=>{console.error(error.message);process.exitCode=1;});`;
  const discovery=spawnSync(process.execPath,['-e',script,join(repositoryRoot,'node_modules/firebase-functions/lib/runtime/loader.js'),join(stage,'deployment/functions')],{
    env:{PATH:process.env.PATH,NODE_PATH:join(repositoryRoot,'node_modules'),FUNCTIONS_EMULATOR:'true',GCLOUD_PROJECT:'demo-satsunicgo',GOOGLE_CLOUD_PROJECT:'demo-satsunicgo',FIREBASE_CONFIG:JSON.stringify({projectId:'demo-satsunicgo'})},encoding:'utf8',timeout:15000,
  });
  assert.equal(discovery.status,0,discovery.stderr);
  const {endpoints,networkAttempts}=JSON.parse(discovery.stdout.trim());
  assert.equal(networkAttempts,0);
  assert.deepEqual(Object.keys(endpoints).sort(),expected);
  for(const name of emailNames){
    assert.equal(endpoints[name].scheduleTrigger.schedule,'every 5 minutes');
    assert.deepEqual(endpoints[name].region,['asia-southeast1']);
  }
  for(const name of [...HELD_EXPORTS,...allDemoMetadata.map(row=>row.name)])assert.equal(endpoints[name],undefined);
  const entry=readFileSync(join(stage,'deployment/functions/lib/functions/src/index.js'),'utf8');
  assert.match(entry,/require\("\.\/email"\)/);
  assert.match(entry,/"deliverEmail"/);
  assert.equal(manifest.files['deployment/functions/lib/functions/src/index.js'],digest(entry));
  assert.equal(verify(stage,sha,'v1.2.3').tag,'v1.2.3');
});
test('already stripped rollback package with the prior email hold verifies and copies without rewriting files',t=>{
  const {root,stage,manifest}=builtFixture(t);
  const historical={...manifest,heldExports:[...HELD_EXPORTS,'deliverEmail'].sort()};
  put(stage,'manifest.json',historical);
  assert.equal(historical.inventory.some(row=>row.name==='deliverEmail'),false);
  assert.deepEqual(verify(stage,sha,'v1.2.3'),historical);
  const target=join(root,'rollback-workspace');
  const copied=prepareWorkspace(stage,target,sha,'v1.2.3');
  assert.deepEqual(copied,historical);
  assert.deepEqual(copied.files,manifest.files);
  assert.deepEqual(readFileSync(join(target,'deployment/functions/lib/functions/src/index.js')),readFileSync(join(stage,'deployment/functions/lib/functions/src/index.js')));
});
test('mandatory runtime assets fail packaging when absent or symlinked',t=>{
  for(const name of REQUIRED_FUNCTION_ASSETS){
    assert.throws(()=>builtFixture(t,root=>rmSync(join(root,'functions/assets',name))),/ENOENT/);
    assert.throws(()=>builtFixture(t,root=>{rmSync(join(root,'functions/assets',name));symlinkSync(join(repositoryRoot,'functions/assets',name),join(root,'functions/assets',name));}),/UNSAFE_FUNCTION_ASSET/);
  }
  assert.throws(()=>builtFixture(t,root=>{rmSync(join(root,'functions/assets'),{recursive:true});symlinkSync(join(repositoryRoot,'functions/assets'),join(root,'functions/assets'));}),/UNSAFE_FUNCTION_ASSET/);
  assert.throws(()=>builtFixture(t,root=>writeFileSync(join(root,'functions/assets/NotoSans-Regular.ttf'),'')),/UNSAFE_FUNCTION_ASSET/);
  assert.throws(()=>builtFixture(t,root=>writeFileSync(join(root,'functions/assets/purchase-vn-regions.json'),Buffer.alloc(1024*1024+1))),/UNSAFE_FUNCTION_ASSET/);
  assert.throws(()=>builtFixture(t,root=>{const p=join(root,'functions/assets/NotoSans-LICENSE.txt');rmSync(p);mkdirSync(p);}),/UNSAFE_FUNCTION_ASSET/);
});
test('packaged font, license and region bytes are immutable and no extra assets enter',t=>{
  const {stage,manifest}=builtFixture(t,root=>put(root,'functions/assets/unapproved.txt','fixture'));
  assert.equal(manifest.files['deployment/functions/assets/unapproved.txt'],undefined);
  for(const name of REQUIRED_FUNCTION_ASSETS){
    const file=join(stage,'deployment/functions/assets',name), original=readFileSync(file);
    writeFileSync(file,'tampered');
    assert.throws(()=>verify(stage,sha,'v1.2.3'),/HASH/);
    writeFileSync(file,original);
  }
  assert.match(readFileSync(join(stage,'deployment/functions/assets/NotoSans-LICENSE.txt'),'utf8'),/SIL OPEN FONT LICENSE/);
});
test('compiled artifact-only PDF renders Unicode without shared source or font fallback',t=>{
  const ts=createRequire(import.meta.url)('typescript');
  const {root,stage}=builtFixture(t,root=>{
    const source=readFileSync(join(repositoryRoot,'functions/src/purchase-pdf.ts'),'utf8');
    const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
    put(root,'functions/lib/functions/src/purchase-pdf.js',compiled);
    for (const name of readdirSync(join(repositoryRoot,'packages/domain')).filter(name=>name.endsWith('.ts'))) {
      const domain = readFileSync(join(repositoryRoot,'packages/domain',name),'utf8');
      put(root,'functions/lib/packages/domain/'+name.replace(/\.ts$/,'.js'),ts.transpileModule(domain,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText);
    }
  });
  rmSync(join(root,'functions'),{recursive:true});
  assert.equal(existsSync(join(stage,'deployment/functions/src')),false);
  const renderer=join(stage,'deployment/functions/lib/functions/src/purchase-pdf.js');
  const script=join(root,'render.cjs');
  put(root,'render.cjs',`const assert=require('node:assert/strict');const {renderPurchaseReceipt}=require(process.argv[2]);const receipt={id:'synthetic',ownerId:'synthetic',lines:[{kind:'listed',name:'Cà phê Việt Nam',variant:'Trắng',quantity:1,goods:100000,service:0,total:100000}],total:100000,provider:'demo',reference:'DEMO-SYNTHETIC',paidAt:Date.UTC(2026,9,8),purpose:'initial',previouslyPaid:0,snapshotHash:'synthetic',shipping:{state:'uncollected'}};const a=renderPurchaseReceipt(receipt),b=renderPurchaseReceipt(receipt);assert.equal(a.subarray(0,8).toString(),'%PDF-1.7');assert.ok(a.equals(b));assert.ok(a.length<3000000);const source=a.toString('binary');assert.match(source,/FontFile2/);assert.match(source,/ToUnicode/);const mapping=new Map();for(const [,key,hex] of source.matchAll(/<([0-9a-f]{4})> <([0-9a-f]+)>/g)){const bytes=Buffer.from(hex,'hex');if(bytes.length%2===0)mapping.set(key,bytes.swap16().toString('utf16le'));}const rows=[...source.matchAll(/Tm <([0-9a-f]+)> Tj ET/g)].map(([,hex])=>(hex.match(/.{4}/g)??[]).map(key=>mapping.get(key)??'').join('')).join(' ');assert.ok(rows.includes('Cà phê Việt Nam'));assert.ok(rows.includes('Trắng'));console.log(JSON.stringify({rendered:true,unicode:true,deterministic:true,bytes:a.length}));`);
  const run=()=>spawnSync(process.execPath,[script,renderer],{cwd:stage,encoding:'utf8',env:{...process.env,NODE_PATH:join(repositoryRoot,'node_modules')}});
  const result=run();assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).rendered,true);
  rmSync(join(stage,'deployment/functions/assets/NotoSans-Regular.ttf'));
  assert.notEqual(run().status,0,'missing bundled font must fail, never find shared fallback');
});
test('standalone deployment retains tested workspace resolutions and rejects new dependency versions', () => {
  const rootLock = { lockfileVersion: 3, packages: {
    functions: { dependencies: { dep: '1.0.0' } },
    'node_modules/dep': { version: '1.0.0', integrity: 'fixture-root' },
    'functions/node_modules/dep': { version: '1.0.0', integrity: 'fixture-workspace' },
    'node_modules/workspace': { link: true },
  } };
  const seed = deploymentLockSeed(rootLock, { name: 'fixture', version: '1.2.3', dependencies: { dep: '1.0.0' } });
  assert.equal(seed.packages['node_modules/dep'].integrity, 'fixture-workspace');
  assert.equal(seed.packages['node_modules/workspace'], undefined);
  assert.doesNotThrow(() => assertLockedVersions(seed, seed));
  assert.throws(() => assertLockedVersions(seed, { packages: { 'node_modules/dep': { version: '2.0.0' } } }), /DEPENDENCY_DRIFT/);
  assert.throws(() => deploymentLockSeed(rootLock, { dependencies: { dep: '2.0.0' } }), /WORKSPACE_DEPENDENCY/);
});
test('artifact rejects wrong SHA/tag, changed, added and missing files', t => {
  const { stage } = builtFixture(t);
  assert.throws(() => verify(stage, 'b'.repeat(40), 'v1.2.3'), /IDENTITY/);
  assert.throws(() => verify(stage, sha, 'v1.2.4'), /IDENTITY/);
  put(stage, 'deployment/dist/assets/app.js', 'tampered');
  assert.throws(() => verify(stage, sha, 'v1.2.3'), /HASH/);
  put(stage, 'deployment/dist/assets/app.js', 'fixture app');
  put(stage, 'deployment/functions/unexpected.json', '{}');
  assert.throws(() => verify(stage, sha, 'v1.2.3'), /HASH/);
  rmSync(join(stage, 'deployment/functions/unexpected.json'));
  rmSync(join(stage, 'deployment/dist/assets/app.js'));
  assert.throws(() => verify(stage, sha, 'v1.2.3'), /HASH/);
});
test('artifact rejects symlinks and dotenv without reading their content', t => {
  const { stage } = builtFixture(t);
  symlinkSync('/outside/fixture', join(stage, 'deployment/functions/link'));
  assert.throws(() => verify(stage, sha, 'v1.2.3'), /SYMLINK/);
  rmSync(join(stage, 'deployment/functions/link'));
  put(stage, 'deployment/functions/.env', 'fixture-only');
  assert.throws(() => verify(stage, sha, 'v1.2.3'), /UNSAFE_ARTIFACT_PATH/);
});
test('asset retries reuse identical files and reject overwrite of conflicting data', () => {
  const hash = digest('fixture');
  assert.equal(assetDecision(undefined, hash), 'upload');
  assert.equal(assetDecision(hash, hash), 'reuse');
  assert.throws(() => assetDecision(digest('other'), hash), /CONFLICT/);
});
test('pre-deploy inventory forbids removal; post-deploy requires all ACTIVE functions and revisions', t => {
  const { manifest } = builtFixture(t);
  const deployed = manifest.inventory.map(f => ({ name: `projects/satsunicgo/locations/asia-southeast1/functions/${f.name}`, state: 'ACTIVE', serviceConfig: { revision: 'r1' }, buildConfig: { source: { storageSource: {} } } }));
  assert.doesNotThrow(() => checkInventory(manifest, [], true));
  assert.doesNotThrow(() => checkInventory(manifest, deployed, false));
  assert.throws(() => checkInventory(manifest, [...deployed, { name: 'functions/removedFunction' }], true), /REMOVAL/);
  assert.throws(() => checkInventory(manifest, deployed.slice(1), false), /MISSING/);
  assert.throws(() => checkInventory(manifest, [{ ...deployed[0], state: 'FAILED' }, ...deployed.slice(1)], false), /NOT_ACTIVE/);
  assert.throws(() => checkInventory(manifest, [...deployed, deployed[0]], false), /DUPLICATE/);
});
test('Hosting verification compares actual bytes and rejects stale metadata/content and HTTP failures', async t => {
  const { stage, manifest } = builtFixture(t);
  const read = async url => readFileSync(join(stage, 'deployment/dist', new URL(url).pathname));
  assert.equal((await verifyHosting(manifest, read)).verifiedFiles, 4);
  await assert.rejects(() => verifyHosting({ ...manifest, tag: 'v2.0.0' }, read), /VERSION_MISMATCH/);
  put(stage, 'deployment/dist/assets/app.js', 'wrong deployed bytes');
  await assert.rejects(() => verifyHosting(manifest, read), /FILE_MISMATCH/);
  await assert.rejects(() => verifyHosting(manifest, async () => { throw Error('HTTP_FAILURE'); }), /HTTP_FAILURE/);
});
test('provider ZIP source verification detects tampering, extra dotenv files and missing members', t => {
  const { root, stage } = builtFixture(t);
  const zip = join(root, 'source.zip');
  const generate = extra => execFileSync('python3', ['-c', `import pathlib, zipfile, sys\nroot=pathlib.Path(sys.argv[1])\nwith zipfile.ZipFile(sys.argv[2], 'w') as z:\n for file in root.rglob('*'):\n  if file.is_file(): z.write(file, str(file.relative_to(root)))\n if sys.argv[3]: z.writestr('.env', 'fixture')`, join(stage, 'deployment/functions'), zip, extra ? 'yes' : '']);
  const check = () => spawnSync('python3', [join(repositoryRoot, 'scripts/release/verify-source.py'), zip, join(stage, 'manifest.json')]);
  generate(false);
  assert.equal(check().status, 0);
  generate(true);
  assert.notEqual(check().status, 0);
  put(stage, 'deployment/functions/lib/functions/src/index.js', 'tampered');
  generate(false);
  assert.notEqual(check().status, 0);
  rmSync(join(stage, 'deployment/functions/release.json'));
  generate(false);
  assert.notEqual(check().status, 0);
});
test('bundle unpack rejects path traversal and links and round-trips an actual release package', t => {
  const { root, stage } = builtFixture(t);
  const archive = join(root, 'bundle.tar.gz');
  execFileSync('tar', ['-czf', archive, '-C', stage, 'deployment', 'manifest.json', 'candidate.json', 'release-notes.md'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
  const target = join(root, 'unpacked');
  const unpack = path => spawnSync('python3', [join(repositoryRoot, 'scripts/release/unpack.py'), archive, path]);
  const unpacked = unpack(target);
  assert.equal(unpacked.status, 0, unpacked.stderr.toString());
  assert.equal(verify(target, sha, 'v1.2.3').sha, sha);
  assert.notEqual(unpack(target).status, 0);
  for (const name of ['../escape', '/absolute', 'deployment/link']) {
    execFileSync('python3', ['-c', `import tarfile, sys\nwith tarfile.open(sys.argv[1], 'w:gz') as t:\n e=tarfile.TarInfo(sys.argv[2]); e.type=tarfile.SYMTYPE; e.linkname='../escape'; t.addfile(e)`, archive, name]);
    assert.notEqual(unpack(join(root, 'unsafe')).status, 0);
  }
});

function mockRemote(t, { superseded = false, mode = 'new' } = {}) {
  const root = temporary(t);
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'user.name', 'Fixture');
  put(root, 'fixture.txt', 'fixture');
  git('add', 'fixture.txt');
  git('commit', '-m', 'feat: fixture release', '-m', 'Full fixture commit body');
  const source = git('rev-parse', 'HEAD');
  put(root, 'bin/gh', `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2), path = args[1];
const input = args.includes('--input') ? fs.readFileSync(0, 'utf8') : '';
fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({path,input})+'\\n');
let result;
if(path.endsWith('/git/ref/heads/main')) result={object:{sha:process.env.FIXTURE_HEAD}};
else if(path.includes('/releases?')) result=process.env.FIXTURE_MODE==='existing' ? [{id:1,tag_name:'v0.1.0',draft:true,assets:[{name:'release-v0.1.0.tar.gz'},{name:'bundle.sha256'}]}] : [];
else if(path.endsWith('/generate-notes')) result={body:'Fixture PR notes'};
else if(path.includes('/git/matching-refs/')) result=['existing','orphan','no-artifact'].includes(process.env.FIXTURE_MODE) ? [{ref:'refs/tags/v0.1.0',object:{sha:process.env.FIXTURE_TAG_SHA}}] : [];
else if(path.includes('/git/ref/tags/')) result={object:{sha:process.env.FIXTURE_TAG_SHA}};
else if(path.includes('/actions/artifacts?')) result={artifacts:['orphan','built-no-tag'].includes(process.env.FIXTURE_MODE) ? [{id:88,name:'release-v0.1.0-1-1',expired:false,workflow_run:{id:99,head_sha:process.env.GITHUB_SHA,head_branch:'main'}}] : []};
else if(path.includes('/actions/runs/')) result={path:'.github/workflows/release.yml',event:'push',head_sha:process.env.GITHUB_SHA};
else result={id:1};
process.stdout.write(JSON.stringify(result));
`);
  chmodSync(join(root, 'bin/gh'), 0o755);
  if (['existing', 'orphan', 'no-artifact'].includes(mode)) git('tag', 'v0.1.0');
  const env = { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, GITHUB_REPOSITORY: 'owner/repo', GITHUB_REF: 'refs/heads/main', GITHUB_SHA: source, GITHUB_OUTPUT: join(root, 'output'), FIXTURE_LOG: join(root, 'requests'), FIXTURE_HEAD: superseded ? 'b'.repeat(40) : source, FIXTURE_MODE: mode, FIXTURE_TAG_SHA: source };
  const run = (operation, extra = {}) => spawnSync(process.execPath, [join(repositoryRoot, 'scripts/release/release.mjs'), operation], { cwd: root, env: { ...env, ...extra }, encoding: 'utf8' });
  return { root, source, run };
}
test('prepare invokes real git history and structured GitHub notes, with no tag/release mutations', t => {
  const { root, source, run } = mockRemote(t);
  assert.equal(run('prepare').status, 0);
  const candidate = JSON.parse(readFileSync(join(root, 'candidate.json'), 'utf8'));
  assert.equal(candidate.tag, 'v0.1.0');
  assert.equal(candidate.sha, source);
  assert.match(readFileSync(join(root, 'release-notes.md'), 'utf8'), /Fixture PR notes/);
  const requests = readFileSync(join(root, 'requests'), 'utf8');
  assert.equal(requests.includes('git/refs'), false);
  assert.match(requests, /generate-notes/);
});
test('superseded candidate is rejected before release writes', t => {
  const { root, run } = mockRemote(t, { superseded: true });
  assert.notEqual(run('prepare').status, 0);
  assert.equal(readFileSync(join(root, 'requests'), 'utf8').includes('releases'), false);
});
test('draft retry does not regenerate notes; tag conflicts and absent verification block publication', t => {
  const { root, run } = mockRemote(t, { mode: 'existing' });
  assert.equal(run('prepare').status, 0);
  assert.equal(readFileSync(join(root, 'requests'), 'utf8').includes('generate-notes'), false);
  assert.notEqual(run('reserve', { FIXTURE_TAG_SHA: 'c'.repeat(40) }).status, 0);
  put(root, 'deployment.json', { status: 'FAILED' });
  assert.notEqual(run('publish').status, 0);
  assert.equal(readFileSync(join(root, 'requests'), 'utf8').includes('"draft":false'), false);
});
test('interrupted tag creation recovers the original workflow artifact and creates only the missing draft', t => {
  const { root, run } = mockRemote(t, { mode: 'orphan' });
  assert.equal(run('prepare').status, 0);
  assert.match(readFileSync(join(root, 'output'), 'utf8'), /recovery-artifact-id=88\nrecovery-run-id=99/);
  put(root, 'release-notes.md', 'Original artifact notes');
  assert.equal(run('reserve').status, 0);
  const requests = readFileSync(join(root, 'requests'), 'utf8');
  assert.equal(requests.includes('"path":"repos/owner/repo/git/refs"'), false);
  assert.match(requests, /Original artifact notes/);
});
test('missing original artifact blocks retry rather than rebuilding the same release version', t => {
  const { run } = mockRemote(t, { mode: 'no-artifact' });
  const result = run('prepare');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ORIGINAL_ARTIFACT_UNAVAILABLE_NO_REBUILD_ALLOWED/);
});
test('completed build before tag reservation is reused and first reservation writes an exact tag/draft', t => {
  const { root, run } = mockRemote(t, { mode: 'built-no-tag' });
  assert.equal(run('prepare').status, 0);
  assert.match(readFileSync(join(root, 'output'), 'utf8'), /existing=true/);
  put(root, 'release-notes.md', 'Original artifact notes');
  assert.equal(run('reserve').status, 0);
  const requests = readFileSync(join(root, 'requests'), 'utf8');
  assert.match(requests, /"path":"repos\/owner\/repo\/git\/refs"/);
  assert.match(requests, /Original artifact notes/);
});
test('publication uses verified identity/checksum and changes draft wording only after a valid receipt', t => {
  const { root, source, run } = mockRemote(t, { mode: 'existing' });
  put(root, 'candidate.json', { tag: 'v0.1.0', sha: source, repository: 'owner/repo' });
  put(root, 'release-notes.md', '## Deployment\n\nPending production verification. This draft must not be treated as deployed.');
  put(root, 'bundle.sha256', 'd'.repeat(64) + '  release-v0.1.0.tar.gz\n');
  put(root, 'deployment.json', { status: 'VERIFIED', sha: source, tag: 'v0.1.0', bundleSha256: 'd'.repeat(64), functions: [{ name: 'fixture', revision: 'r1' }] });
  assert.equal(run('publish', { GITHUB_RUN_ID: '42', GITHUB_RUN_ATTEMPT: '1' }).status, 0);
  const mutation = readFileSync(join(root, 'requests'), 'utf8').trim().split('\n').map(JSON.parse).filter(r => r.input).map(r => JSON.parse(r.input)).find(r => r.draft === false);
  assert.ok(mutation);
  assert.match(mutation.body, /satsunicgo-production-verified/);
  assert.match(mutation.body, /deployment-42-1.json/);
  assert.equal(mutation.body.includes('Pending production verification'), false);
});
test('mismatched receipt checksum or source cannot publish success', t => {
  const { root, source, run } = mockRemote(t, { mode: 'existing' });
  put(root, 'candidate.json', { tag: 'v0.1.0', sha: source, repository: 'owner/repo' });
  put(root, 'bundle.sha256', 'd'.repeat(64) + '  fixture\n');
  for (const receipt of [
    { status: 'VERIFIED', sha: 'e'.repeat(40), tag: 'v0.1.0' },
    { status: 'VERIFIED', sha: source, tag: 'v0.1.0', bundleSha256: 'e'.repeat(64) },
  ]) {
    put(root, 'deployment.json', receipt);
    assert.notEqual(run('publish').status, 0);
  }
});

test('production holds remove only held bindings/imports and reject compiler/inventory drift', () => {
  const retained = [{name:'readNotification'}, {name:'deliverEmail'}, {name:'deliverSubscriptionEmail'}];
  const inventory = [...HELD_EXPORTS.map(name => ({name})), ...retained];
  const emailBinding = 'Object.defineProperty(exports, "deliverEmail", {get: function(){return email.deliverEmail;}});';
  const compiled = ['var workflow = require("./ai/ask-workflow");', 'var payments = require("./payments/payos");', 'var email = require("./email");', 'var jobs = require("./jobs");', ...HELD_EXPORTS.map(name => `Object.defineProperty(exports, "${name}", {get: function(){return jobs.${name};}});`), 'Object.defineProperty(exports, "readNotification", {get: function(){return jobs.readNotification;}});', emailBinding, 'Object.defineProperty(exports, "deliverSubscriptionEmail", {get: function(){return jobs.deliverSubscriptionEmail;}});'].join('\n');
  const result = applyProductionHolds(compiled, inventory);
  assert.deepEqual(result.inventory, retained);
  assert.equal(result.heldExports.length, 7);
  assert.match(result.compiled, /require\(".\/jobs"\)/);
  assert.match(result.compiled, /require\(".\/email"\)/);
  assert.ok(result.compiled.includes(emailBinding));
  assert.match(result.compiled, /"deliverSubscriptionEmail"/);
  assert.match(result.compiled, /"readNotification"/);
  assert.equal(result.compiled.includes('payments/payos'), false);
  assert.throws(() => applyProductionHolds(compiled.replace('"maintenance"','"wrong"'), inventory), /COMPILED_SHAPE/);
  assert.throws(() => applyProductionHolds(compiled, inventory.slice(1)), /INVENTORY_DRIFT/);
});

test('provider receipt refuses changed, replaced or unfinished Hosting releases during source verification', () => {
  const release = {name:'sites/satsunicgo/releases/one',type:'DEPLOY',releaseTime:'2026-10-07T00:00:00Z',version:{name:'sites/satsunicgo/versions/one',status:'FINALIZED'}};
  assertStableHostingRelease(release, globalThis.structuredClone(release));
  for (const replacement of [ {...release,name:'sites/satsunicgo/releases/two'}, {...release,releaseTime:'2026-10-07T00:01:00Z'}, {...release,version:{...release.version,name:'sites/satsunicgo/versions/two'}}, {...release,type:'SITE_DISABLE'}, {...release,version:{...release.version,status:'CREATED'}} ]) assert.throws(() => assertStableHostingRelease(release,replacement), /HOSTING/);
});

test('Hosting metadata charges the authorized production project, never the OAuth client project', async () => {
  const expected = {name: 'sites/satsunicgo/releases/one'};
  const result = await readHostingRelease('test-token', async (url, headers) => {
    assert.equal(new URL(url).hostname, 'firebasehosting.googleapis.com');
    assert.equal(headers['x-goog-user-project'], 'satsunicgo');
    assert.equal(headers.Authorization, 'Bearer test-token');
    return Buffer.from(JSON.stringify({releases: [expected]}));
  });
  assert.deepEqual(result, expected);
});

test('real Firebase Hosting cache writes cannot contaminate the immutable promotion artifact', t => {
  const {root, stage} = builtFixture(t);
  const work = join(root, 'release-work');
  const original = verify(stage, sha, 'v1.2.3');
  assert.deepEqual(prepareWorkspace(stage, work, sha, 'v1.2.3'), original);
  const cache = createRequire(import.meta.url)(join(repositoryRoot, 'node_modules/firebase-tools/lib/deploy/hosting/hashcache.js'));
  cache.dump(join(work, 'deployment'), 'fixture', new Map([['index.html', {mtime: 1, hash: 'fixture'}]]));
  assert.deepEqual(verify(stage, sha, 'v1.2.3'), original);
  assert.throws(() => verify(work, sha, 'v1.2.3'), /UNSAFE_ARTIFACT_PATH/);
  assert.throws(() => prepareWorkspace(stage, work, sha, 'v1.2.3'), /UNSAFE_DEPLOYMENT_WORKSPACE/);
  assert.throws(() => prepareWorkspace(stage, join(stage, 'nested'), sha, 'v1.2.3'), /UNSAFE_DEPLOYMENT_WORKSPACE/);
  put(stage, 'deployment/functions/extra.json', '{}');
  assert.throws(() => prepareWorkspace(stage, join(root, 'other'), sha, 'v1.2.3'), /HASH/);
});

test('Function source readback pins object generation and reuses the in-memory provider token', async () => {
  const source = {bucket:'gcf-v2-sources-278913913091-asia-southeast1',object:'publicPage/function-source.zip',generation:'123'};
  const bytes = Buffer.from('source-fixture');
  assert.equal(await readFunctionSource(source, 'fixture-token', async (url, headers) => {
    const parsed = new URL(url);
    assert.equal(parsed.hostname, 'storage.googleapis.com');
    assert.match(parsed.pathname, /publicPage%2Ffunction-source.zip$/);
    assert.equal(parsed.searchParams.get('generation'), '123');
    assert.equal(parsed.searchParams.get('alt'), 'media');
    assert.equal(headers.Authorization, 'Bearer fixture-token');
    assert.equal(headers['x-goog-user-project'], 'satsunicgo');
    return bytes;
  }), bytes);
  for (const invalid of [{...source,object:'../outside'}, {...source,generation:'123&other=1'}, {...source,bucket:'bucket/escape'}]) {
    await assert.rejects(() => readFunctionSource(invalid, 'fixture', async () => {throw Error('MUST_NOT_REQUEST');}), /INVALID_PROVIDER_SOURCE_REFERENCE/);
  }
  await assert.rejects(() => readFunctionSource(source, 'fixture', async () => {throw Error('HTTP_FAILURE');}), /HTTP_FAILURE/);
});

test('provider stabilization waits only for bounded transient deployment states, without ignoring final failure', async t => {
  const {manifest} = builtFixture(t);
  const active = manifest.inventory.map(f => ({name:`functions/${f.name}`,state:'ACTIVE',serviceConfig:{revision:'one'},buildConfig:{source:{storageSource:{}}}}));
  const deploying = active.map(f => ({...f,state:'DEPLOYING'}));
  let reads = 0, pauses = 0;
  assert.deepEqual(await waitForActiveInventory(manifest, () => ++reads === 1 ? deploying : active, async () => {pauses++;}), active);
  assert.equal(reads, 2); assert.equal(pauses, 1);
  reads = 0;
  await assert.rejects(() => waitForActiveInventory(manifest, () => {reads++;return deploying;}, async () => {}), /NOT_ACTIVE/);
  assert.equal(reads, 6);
  reads = 0;
  await assert.rejects(() => waitForActiveInventory(manifest, () => {reads++;return active.map(f => ({...f,state:'FAILED'}));}, async () => {throw Error('MUST_NOT_PAUSE');}), /NOT_ACTIVE/);
  assert.equal(reads, 1);
  await assert.rejects(() => waitForActiveInventory(manifest, () => [...active,{name:'functions/unexpected',state:'ACTIVE'}], async () => {throw Error('MUST_NOT_PAUSE');}), /REMOVAL/);
});


const cleanupBinding = 'Object.defineProperty(exports, "askFeedbackCleanup", {get: function(){return lifecycle.askFeedbackCleanup;}});';
const lifecycleCompiled = [
  'var lifecycle = require("./ai/feedback-lifecycle");',
  cleanupBinding,
  'Object.defineProperty(exports, "askFeedbackWithdraw", {get: function(){return lifecycle.askFeedbackWithdraw;}});',
].join('\n');
test('release holds preserve six unrelated base holds and unapproved cleanup', () => {
  assert.deepEqual(HELD_EXPORTS, ['askWorkflow', 'currentAskConversation', 'maintenance', 'createPaymentLink', 'payosWebhook', 'reconcilePayments', 'askFeedbackCleanup']);
  assert.equal(Object.isFrozen(HELD_EXPORTS), true);
});
test('cleanup-only hold preserves the lifecycle module and noncleanup customer endpoints', () => {
  const result = applyProductionHolds(lifecycleCompiled, [{name:'askFeedbackCleanup'}, {name:'askFeedbackWithdraw'}]);
  assert.deepEqual(result.inventory, [{name:'askFeedbackWithdraw'}]);
  assert.deepEqual(result.heldExports, ['askFeedbackCleanup']);
  assert.equal(result.compiled.includes(cleanupBinding), false);
  assert.match(result.compiled, /require\("\.\/ai\/feedback-lifecycle"\)/);
  assert.match(result.compiled, /"askFeedbackWithdraw"/);
});
test('six base holds remain valid without a cleanup export', () => {
  const legacy = HELD_EXPORTS.filter(name => name !== 'askFeedbackCleanup');
  const compiled = ['var workflow = require("./ai/ask-workflow");', 'var payments = require("./payments/payos");', 'var email = require("./email");', 'var jobs = require("./jobs");', ...legacy.map(name => `Object.defineProperty(exports, "${name}", {get: function(){return jobs.${name};}});`)].join('\n');
  assert.equal(legacy.length, 6);
  assert.deepEqual(applyProductionHolds(compiled, legacy.map(name => ({name}))).heldExports, [...legacy].sort());
  assert.throws(() => applyProductionHolds(compiled, legacy.slice(1).map(name => ({name}))), /INVENTORY_DRIFT/);
});
test('cleanup inventory mismatch never silently admits its compiled binding', () => {
  assert.throws(() => applyProductionHolds(lifecycleCompiled, [{name:'askFeedbackWithdraw'}]), /INVENTORY_DRIFT/);
  assert.throws(() => applyProductionHolds(lifecycleCompiled.replace(cleanupBinding, ''), [{name:'askFeedbackCleanup'}, {name:'askFeedbackWithdraw'}]), /COMPILED_SHAPE/);
});
test('duplicate cleanup compiled bindings fail closed', () => {
  assert.throws(() => applyProductionHolds(lifecycleCompiled + '\n' + cleanupBinding, [{name:'askFeedbackCleanup'}, {name:'askFeedbackWithdraw'}]), /DUPLICATE/);
});
test('artifact creation omits cleanup inventory and binding while preserving remaining feedback endpoints', t => {
  const {root} = builtFixture(t);
  const currentSource = readFileSync(join(root, 'functions/src/index.ts'), 'utf8');
  put(root, 'functions/src/index.ts', currentSource + `\nimport { onSchedule } from 'firebase-functions/v2/scheduler';\nexport const askFeedbackCleanup = onSchedule({region:'asia-southeast1', schedule:'every 60 minutes'}, () => {});\nexport const askFeedbackWithdraw = onRequest({region:'asia-southeast1'}, () => {});`);
  put(root, 'functions/lib/functions/src/index.js', lifecycleCompiled);
  const stage = join(root, 'feedback-held-stage');
  const manifest = create(root, stage, join(root, 'candidate.json'));
  assert.deepEqual(manifest.heldExports, ['askFeedbackCleanup']);
  assert.equal(manifest.inventory.some(item => item.name === 'askFeedbackCleanup'), false);
  assert.equal(manifest.inventory.some(item => item.name === 'askFeedbackWithdraw'), true);
  const packaged = readFileSync(join(stage, 'deployment/functions/lib/functions/src/index.js'), 'utf8');
  assert.equal(packaged.includes(cleanupBinding), false);
  assert.match(packaged, /"askFeedbackWithdraw"/);
  assert.deepEqual(verify(stage, sha, 'v1.2.3'), manifest);
});


test('unsupported direct cleanup export shapes fail closed even with an empty source inventory', () => {
  const shapes = [
    'exports.askFeedbackCleanup = lifecycle.askFeedbackCleanup;',
    'exports["askFeedbackCleanup"] = lifecycle.askFeedbackCleanup;',
    'module.exports.askFeedbackCleanup = lifecycle.askFeedbackCleanup;',
    'Object.defineProperty(module.exports, "askFeedbackCleanup", {get: function(){return lifecycle.askFeedbackCleanup;}});',
    'module.exports = {askFeedbackCleanup: lifecycle.askFeedbackCleanup};',
    'Object.assign(exports, {askFeedbackCleanup: lifecycle.askFeedbackCleanup});',
    'Object.defineProperties(exports, {askFeedbackCleanup: {get: function(){return lifecycle.askFeedbackCleanup;}}});',
    'exports.askFeedbackCleanup = void lifecycle.sideEffect();',
  ];
  for (const compiled of shapes) {
    assert.throws(() => applyProductionHolds(compiled, []), /COMPILED_SHAPE/, compiled);
    assert.throws(() => applyProductionHolds(compiled, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/, compiled);
  }
});
test('compiler void-zero declarations remain safe and canonical cleanup getter is still withheld', () => {
  const declaration = 'exports.askFeedbackWithdraw = exports.askFeedbackCleanup = void 0;';
  assert.deepEqual(applyProductionHolds(declaration, []), {compiled:declaration,inventory:[],heldExports:[]});
  const result = applyProductionHolds(declaration + '\n' + lifecycleCompiled, [{name:'askFeedbackCleanup'}, {name:'askFeedbackWithdraw'}]);
  assert.equal(result.compiled.includes(cleanupBinding), false);
  assert.match(result.compiled, /"askFeedbackWithdraw"/);
  assert.deepEqual(result.heldExports, ['askFeedbackCleanup']);
});


test('nested canonical cleanup getters cannot survive an empty inventory or reported hold', () => {
  for (const nested of [`{ ${cleanupBinding} }`, `function install(){ ${cleanupBinding} }`, `if (true) { ${cleanupBinding} }`]) {
    assert.throws(() => applyProductionHolds(nested, []), /COMPILED_SHAPE/);
    assert.throws(() => applyProductionHolds(cleanupBinding + '\n' + nested, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/);
  }
});
test('canonical cleanup getter template-literal key is an unsupported compiler shape', () => {
  const compiled = 'Object.defineProperty(exports, `askFeedbackCleanup`, {get: function(){return lifecycle.askFeedbackCleanup;}});';
  assert.throws(() => applyProductionHolds(compiled, []), /COMPILED_SHAPE/);
  assert.throws(() => applyProductionHolds(compiled, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/);
});


test('template-literal cleanup member and computed object keys reject before packaging', () => {
  const shapes = ['exports[`askFeedbackCleanup`] = lifecycle.askFeedbackCleanup;', 'Object.assign(exports, {[`askFeedbackCleanup`]: lifecycle.askFeedbackCleanup});', 'module.exports = {[`askFeedbackCleanup`]: lifecycle.askFeedbackCleanup};'];
  for (const compiled of shapes) {
    assert.throws(() => applyProductionHolds(compiled, []), /COMPILED_SHAPE/);
    assert.throws(() => applyProductionHolds(cleanupBinding + '\n' + compiled, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/);
  }
});
test('literal bracket or parenthesized cleanup export receivers and methods cannot bypass guards', () => {
  const shapes = [
    'Object["defineProperty"](exports, "askFeedbackCleanup", {get: function(){return lifecycle.askFeedbackCleanup;}});',
    'Object[`assign`](exports, {askFeedbackCleanup: lifecycle.askFeedbackCleanup});',
    'module["exports"].askFeedbackCleanup = lifecycle.askFeedbackCleanup;',
    '(exports).askFeedbackCleanup = lifecycle.askFeedbackCleanup;',
    'Object.defineProperty((exports), "askFeedbackCleanup", {get: function(){return lifecycle.askFeedbackCleanup;}});',
  ];
  for (const compiled of shapes) {
    assert.throws(() => applyProductionHolds(compiled, []), /COMPILED_SHAPE/);
    assert.throws(() => applyProductionHolds(cleanupBinding + '\n' + compiled, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/);
  }
});


test('transparent parentheses on cleanup object keys, descriptors and direct export keys cannot bypass holds', () => {
  const shapes = [
    'Object.assign(exports, ({askFeedbackCleanup: lifecycle.askFeedbackCleanup}));',
    'module.exports = ({askFeedbackCleanup: lifecycle.askFeedbackCleanup});',
    'Object.assign(exports, {[(`askFeedbackCleanup`)]: lifecycle.askFeedbackCleanup});',
    'Object.defineProperties(exports, ({askFeedbackCleanup: {get: function(){return lifecycle.askFeedbackCleanup;}}}));',
    'exports[("askFeedbackCleanup")] = lifecycle.askFeedbackCleanup;',
    'Object.defineProperty(exports, ("askFeedbackCleanup"), {get: function(){return lifecycle.askFeedbackCleanup;}});',
  ];
  for (const compiled of shapes) {
    assert.throws(() => applyProductionHolds(compiled, []), /COMPILED_SHAPE/);
    assert.throws(() => applyProductionHolds(cleanupBinding + '\n' + compiled, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/);
  }
});
test('transparent parentheses preserve only harmless void-zero cleanup declarations', () => {
  const declaration = 'exports[("askFeedbackCleanup")] = (exports.keep = void (0));';
  assert.deepEqual(applyProductionHolds(declaration, []), {compiled:declaration,inventory:[],heldExports:[]});
  assert.throws(() => applyProductionHolds('exports.askFeedbackCleanup = (void lifecycle.sideEffect());', []), /COMPILED_SHAPE/);
});


test('literal object spreads containing cleanup are rejected across export object mutation shapes', () => {
  for (const compiled of [
    'Object.assign(exports,{...{askFeedbackCleanup:lifecycle.askFeedbackCleanup}});',
    'module.exports = {...({...{askFeedbackCleanup:lifecycle.askFeedbackCleanup}})};',
    'Object.defineProperties(exports,{...{askFeedbackCleanup:{get: function(){return lifecycle.askFeedbackCleanup;}}}});',
  ]) {
    assert.throws(() => applyProductionHolds(compiled, []), /COMPILED_SHAPE/);
    assert.throws(() => applyProductionHolds(cleanupBinding + '\n' + compiled, [{name:'askFeedbackCleanup'}]), /COMPILED_SHAPE/);
  }
});


// Real pinned CLI policy tests: approval is confined to the retry prompt.
const firebaseRequire = createRequire(import.meta.url);
const retryBackend = firebaseRequire('firebase-tools/lib/deploy/functions/backend.js');
const retryPrompts = firebaseRequire('firebase-tools/lib/deploy/functions/prompts.js');
const retryRow = {name:'customerNotificationCreated',kind:'onDocumentCreated',region:'asia-southeast1',source:'functions/src/customer-notification-delivery.ts'};
const retryManifest = {sha,tag:'v1.2.3',project:'satsunicgo',inventory:[retryRow]};
const retryEndpoint = {id:retryRow.name,region:'asia-southeast1',project:'satsunicgo',codebase:'satsunicgo',platform:'gcfv2',eventTrigger:{retry:true,eventType:'google.cloud.firestore.document.v1.created',eventFilterPathPatterns:{document:'outboxJobs/{jobId}'}}};
const backendOf = endpoint => retryBackend.of(endpoint);
test('reviewed retry confirmation approves only its copied options and preserves the real deletion rejection',async()=>{
  const options={nonInteractive:true,force:false};
  const untouchedDeletion=retryPrompts.promptForFunctionDeletion;
  let record;
  const restore=installReviewedRetryPrompt(retryPrompts,retryBackend,retryManifest,value=>{record=value;});
  try{
    await retryPrompts.promptForFailurePolicies(options,backendOf(retryEndpoint),retryBackend.empty());
    assert.deepEqual(options,{nonInteractive:true,force:false});
    assert.deepEqual(record.newRetries,['customerNotificationCreated']);
    assert.equal(retryPrompts.promptForFunctionDeletion,untouchedDeletion);
    await assert.rejects(()=>retryPrompts.promptForFunctionDeletion([retryEndpoint],options),/deletion cannot proceed/);
  }finally{restore();}
});
test('reviewed retry cannot approve a new unreviewed consumer or changed document binding',()=>{
  for(const endpoint of [{...retryEndpoint,id:'unreviewed'}, {...retryEndpoint,eventTrigger:{...retryEndpoint.eventTrigger,eventFilterPathPatterns:{document:'users/{id}'}}}]){
    const manifest={...retryManifest,inventory:[{...retryRow,name:endpoint.id}]};
    assert.throws(()=>retryAdmission(manifest,backendOf(endpoint),retryBackend.empty(),retryBackend),/UNREVIEWED/);
  }
});
test('retry admission rejects source, inventory, project, region and codebase drift',()=>{
  assert.throws(()=>retryAdmission({...retryManifest,inventory:[{...retryRow,source:'functions/src/other.ts'}]},backendOf(retryEndpoint),retryBackend.empty(),retryBackend),/UNREVIEWED/);
  assert.throws(()=>retryAdmission({...retryManifest,inventory:[]},backendOf(retryEndpoint),retryBackend.empty(),retryBackend),/INVENTORY/);
  for(const patch of [{project:'other'},{region:'us-central1'},{codebase:'default'},{platform:'gcfv1'}])assert.throws(()=>retryAdmission(retryManifest,backendOf({...retryEndpoint,...patch}),retryBackend.empty(),retryBackend),/ENDPOINT/);
});
test('an existing retry policy does not request newly enabled authority',()=>{
  assert.deepEqual(retryAdmission(retryManifest,backendOf(retryEndpoint),backendOf(retryEndpoint),retryBackend).newRetries,[]);
});
test('unsafe deployment options are rejected before any CLI retry prompt',async()=>{
  let calls=0;const prompts={promptForFailurePolicies:async()=>{calls++;}};
  const restore=installReviewedRetryPrompt(prompts,retryBackend,retryManifest);
  try{for(const options of [{force:true,nonInteractive:true},{force:false,nonInteractive:false}])await assert.rejects(()=>prompts.promptForFailurePolicies(options,backendOf(retryEndpoint),retryBackend.empty()),/UNSAFE/);}
  finally{restore();}
  assert.equal(calls,0);
});
test('deployment arguments use manifest-only selectors and never global force',()=>{
  const args=deploymentArguments(retryManifest,sha,'v1.2.3');
  assert.equal(args.includes('--force'),false);
  assert.equal(args[args.indexOf('--only')+1],'functions:satsunicgo:customerNotificationCreated,hosting');
  assert.equal(args.includes('--non-interactive'),true);
  assert.throws(()=>deploymentArguments({...retryManifest,inventory:[{name:'name-unsafe'}]},sha,'v1.2.3'),/UNSAFE/);
  assert.throws(()=>deploymentArguments(retryManifest,'b'.repeat(40),'v1.2.3'),/IDENTITY/);
});
test('provider readback binds retry configuration to the same artifact and exact enabled endpoint set',()=>{
  const admission=retryAdmission(retryManifest,backendOf(retryEndpoint),retryBackend.empty(),retryBackend);
  const deployed=[{name:'functions/customerNotificationCreated',eventTrigger:{retryPolicy:'RETRY_POLICY_RETRY'}}];
  assert.deepEqual(verifyRetryReadback(retryManifest,deployed,admission),['customerNotificationCreated']);
  assert.throws(()=>verifyRetryReadback(retryManifest,[{...deployed[0],eventTrigger:{retryPolicy:'RETRY_POLICY_DO_NOT_RETRY'}}],admission),/POLICY_MISMATCH/);
  assert.throws(()=>verifyRetryReadback(retryManifest,[...deployed,{name:'functions/unexpected',eventTrigger:{retryPolicy:'RETRY_POLICY_RETRY'}}],admission),/POLICY_MISMATCH/);
  assert.throws(()=>verifyRetryReadback(retryManifest,deployed,{...admission,sha:'b'.repeat(40)}),/BINDING/);
});

const productionTestRows = allDemoMetadata.filter(row=>row.name.startsWith('purchaseSePay'));
const productionTestCompiled = allDemoCompiled.replace(/const purchase_checkout_1[^;]*;\s*Object.defineProperty\(exports,'purchaseCheckout'[^\n]*\);/,'').replace("const localSePay = process.env.FUNCTIONS_EMULATOR === 'true' && process.env.GCLOUD_PROJECT === 'demo-satsunicgo';", "const production_test_policy_1=require('./production-test-policy');const productionSePay=(0,production_test_policy_1.sepayArtifactEnvironment)();").replace(/localSePay \?/g,'productionSePay ?');
function addProductionTestFixture(root) {
  addAllDemoSource(root);
  let source=readFileSync(join(root,'functions/src/index.ts'),'utf8');
  source=source.replace("const localSePay=process.env.FUNCTIONS_EMULATOR === 'true' && process.env.GCLOUD_PROJECT === 'demo-satsunicgo';", "import {sepayArtifactEnvironment} from './production-test-policy';const productionSePay=sepayArtifactEnvironment();").replace(/localSePay \?/g,'productionSePay ?');
  put(root,'functions/src/index.ts',source);
  put(root,'functions/src/production-test-policy.ts',readFileSync(join(repositoryRoot,'functions/src/production-test-policy.ts'),'utf8'));
  const ts=firebaseRequire('typescript');
  const compile=(source,target)=>put(root,target,ts.transpileModule(readFileSync(join(repositoryRoot,source),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText);
  compile('functions/src/production-test-policy.ts','functions/lib/functions/src/production-test-policy.js');
  compile('functions/src/purchase-environment.ts','functions/lib/functions/src/purchase-environment.js');
  for (const name of readdirSync(join(repositoryRoot,'packages/domain')).filter(name=>name.endsWith('.ts'))) compile('packages/domain/'+name,'functions/lib/packages/domain/'+name.replace(/\.ts$/,'.js'));
  put(root,'functions/lib/functions/src/purchase-sepay.js',`const {onCall,onRequest}=require('firebase-functions/v2/https');const {onDocumentCreated}=require('firebase-functions/v2/firestore');const options={region:'asia-southeast1'};exports.purchaseSePayPayment=onCall(options,()=>{});exports.purchaseSePayIpn=onRequest(options,()=>{});exports.purchaseSePayInboxWorker=onDocumentCreated({...options,document:'purchaseSePayInbox/{id}',retry:true},()=>{});`);
  const names=['campaignBannersPublic','publicDiscovery','publicImage','publicPage'];
  put(root,'functions/lib/functions/src/index.js',productionTestCompiled+`\nconst {onRequest}=require('firebase-functions/v2/https');\n`+names.map(name=>`exports.${name}=onRequest({region:'asia-southeast1'},()=>{});`).join('\n'));
}
test('approved production-test artifact retains authentic handlers, always strips client-outcome demos and binds public runtime env',t=>{
  const {stage,manifest}=builtFixture(t,addProductionTestFixture);
  assert.equal(manifest.inventory.length,7);
  assert.deepEqual(manifest.productionTestExports,productionTestRows);
  assert.deepEqual(manifest.emulatorOnlyExports,['purchaseDemoPayment','purchaseDemoWebhook']);
  assert.deepEqual(manifest.runtimeEnvironment,PRODUCTION_TEST_ENVIRONMENT);
  assert.equal(readFileSync(join(stage,PRODUCTION_TEST_ENV_FILE),'utf8'),PRODUCTION_TEST_ENV_BYTES);
  const script=`const net=require('node:net'),tls=require('node:tls');let calls=0;const deny=()=>{calls++;throw Error('NETWORK_FORBIDDEN');};net.connect=net.createConnection=net.Socket.prototype.connect=tls.connect=deny;globalThis.fetch=async()=>deny();require(process.argv[1]).loadStack(process.argv[2]).then(stack=>console.log(JSON.stringify({names:Object.keys(stack.endpoints).sort(),calls}))).catch(()=>{process.exitCode=1;});`;
  const publicNames=['campaignBannersPublic','publicDiscovery','publicImage','publicPage'];
  for (const [environment,expected] of [[{GCLOUD_PROJECT:'satsunicgo',FIREBASE_CONFIG:JSON.stringify({projectId:'satsunicgo'}),...PRODUCTION_TEST_ENVIRONMENT},[...publicNames,...productionTestRows.map(row=>row.name)]],[{GCLOUD_PROJECT:'satsunicgo',FIREBASE_CONFIG:JSON.stringify({projectId:'satsunicgo'})},publicNames],[{GCLOUD_PROJECT:'demo-satsunicgo',FUNCTIONS_EMULATOR:'true',FIREBASE_CONFIG:JSON.stringify({projectId:'demo-satsunicgo'})},[...publicNames,...productionTestRows.map(row=>row.name)]]]){
    const result=spawnSync(process.execPath,['-e',script,join(repositoryRoot,'node_modules/firebase-functions/lib/runtime/loader.js'),join(stage,'deployment/functions')],{env:{PATH:process.env.PATH,NODE_PATH:join(repositoryRoot,'node_modules'),...environment},encoding:'utf8',timeout:15000});
    assert.equal(result.status,0,result.stderr);const response=JSON.parse(result.stdout.trim());assert.equal(response.calls,0);assert.deepEqual(response.names,expected.sort());
  }
  assert.equal(verify(stage,sha,'v1.2.3').sha,sha);
});
test('public runtime dotenv permits only the exact code-owned nonsecret bytes and rejects arbitrary dotenv additions',t=>{
  const {stage,manifest}=builtFixture(t,addProductionTestFixture);
  put(stage,PRODUCTION_TEST_ENV_FILE,PRODUCTION_TEST_ENV_BYTES+'SECRET_KEY=forbidden\n');
  manifest.files[PRODUCTION_TEST_ENV_FILE]=digest(readFileSync(join(stage,PRODUCTION_TEST_ENV_FILE)));put(stage,'manifest.json',manifest);
  assert.throws(()=>verify(stage,sha,'v1.2.3'),/ENVIRONMENT_MISMATCH/);
  put(stage,PRODUCTION_TEST_ENV_FILE,PRODUCTION_TEST_ENV_BYTES);put(stage,'deployment/functions/.env.other','OTHER=true');
  assert.throws(()=>verify(stage,sha,'v1.2.3'),/UNSAFE_ARTIFACT_PATH/);
});
for(const [label,compiled] of [
  ['unguarded true',productionTestCompiled.replace('(0,production_test_policy_1.sepayArtifactEnvironment)()','true')],
  ['foreign policy module',productionTestCompiled.replace("require('./production-test-policy')","require('./other')")],
  ['mutable guard',productionTestCompiled.replace('const productionSePay','let productionSePay')],
  ['escaped guard',productionTestCompiled+'\nconst leaked=productionSePay;'],
  ['false branch callable',productionTestCompiled.replace(': undefined',': purchase_checkout_2.purchaseDemoPayment')],
  ['escaped target alias',productionTestCompiled+'\nconst leaked=purchase_sepay_1;'],
  ['duplicate export',productionTestCompiled+'\nexports.purchaseSePayPayment=productionSePay ? purchase_sepay_1.purchaseSePayPayment : undefined;'],
  ['computed export',productionTestCompiled.replace('exports.purchaseSePayPayment = productionSePay',"exports['purchaseSePayPayment'] = productionSePay")],
])test(`production-test compiler contract rejects ${label}`,()=>assert.throws(()=>excludeEmulatorOnlyExports(compiled,allDemoMetadata.slice(0,2),productionTestRows),/PRODUCTION_TEST_|EMULATOR_/));
test('production-test metadata cannot partially admit handlers or change source/kind',()=>{
  assert.throws(()=>assertCompiledProductionTestExports(productionTestCompiled,productionTestRows.slice(0,2)),/EXPORT_SET/);
  assert.throws(()=>assertCompiledProductionTestExports(productionTestCompiled,productionTestRows.map(row=>({...row,source:'functions/src/other.ts'}))),/METADATA/);
});
test('production-test Ask exports are retained while PayOS, mixed maintenance and cleanup stay held',()=>{
  const compiled=['var workflow=require("./ai/ask-workflow");','var payments=require("./payments/payos");','var jobs=require("./jobs");',...HELD_EXPORTS.map(name=>`Object.defineProperty(exports,"${name}",{get:function(){return jobs.${name};}});`)].join('\n');
  const result=applyProductionHolds(compiled,HELD_EXPORTS.map(name=>({name})),true);
  assert.deepEqual(result.inventory.map(row=>row.name),['askWorkflow','currentAskConversation']);
  assert.deepEqual(result.heldExports,['askFeedbackCleanup','createPaymentLink','maintenance','payosWebhook','reconcilePayments']);
  assert.match(result.compiled,/require\(".\/ai\/ask-workflow"\)/);assert.equal(result.compiled.includes('require("./payments/payos")'),false);
});
test('runtime provider readback requires exact public artifact flags and rejects all emulator contamination',()=>{
  const manifest={runtimeEnvironment:PRODUCTION_TEST_ENVIRONMENT};
  assert.doesNotThrow(()=>verifyRuntimeEnvironment(manifest,[{serviceConfig:{environmentVariables:PRODUCTION_TEST_ENVIRONMENT}}]));
  assert.throws(()=>verifyRuntimeEnvironment(manifest,[{serviceConfig:{environmentVariables:{...PRODUCTION_TEST_ENVIRONMENT,PURCHASE_PRODUCTION_TEST_ARTIFACT:'wrong'}}}]),/MISMATCH/);
  assert.throws(()=>verifyRuntimeEnvironment(manifest,[{serviceConfig:{environmentVariables:{...PRODUCTION_TEST_ENVIRONMENT,FIRESTORE_EMULATOR_HOST:'127.0.0.1:18207'}}}]),/MISMATCH/);
});

for(const [label,mutation] of [
  ['missing policy helper import',source=>source.replace("import {sepayArtifactEnvironment} from './production-test-policy';",'')],
  ['true guard',source=>source.replace('productionSePay=sepayArtifactEnvironment()','productionSePay=true')],
  ['partial production set',source=>source.replace('purchaseSePayPayment=productionSePay ?','purchaseSePayPayment=process.env.FUNCTIONS_EMULATOR === \'true\' ?')],
  ['foreign policy helper',source=>source.replace("from './production-test-policy'","from './other-policy'")],
])test(`production-test source preflight rejects ${label}`,t=>assert.throws(()=>builtFixture(t,root=>{addProductionTestFixture(root);put(root,'functions/src/index.ts',mutation(readFileSync(join(root,'functions/src/index.ts'),'utf8')));}),/RELEASE_PREFLIGHT_FAILED/));
test('provider source ZIP ignores only fixed public runtime dotenv, with digest and env contract bound',t=>{
  const {stage,manifest}=builtFixture(t,addProductionTestFixture);
  const archive=join(stage,'source.zip');
  const script=`import json,zipfile,sys,pathlib\nroot=pathlib.Path(sys.argv[1]);manifest=json.load(open(root/'manifest.json'));prefix='deployment/functions/'\nwith zipfile.ZipFile(sys.argv[2],'w') as z:\n for name in manifest['files']:\n  if name.startswith(prefix) and name!=prefix+'.env.satsunicgo':z.write(root/name,name[len(prefix):])`;
  execFileSync('python3',['-c',script,stage,archive]);
  // ZIP is outside the immutable function package and verified without extraction.
  execFileSync('python3',[join(repositoryRoot,'scripts/release/verify-source.py'),archive,join(stage,'manifest.json')]);
  const altered={...manifest,files:{...manifest.files,[PRODUCTION_TEST_ENV_FILE]:digest('ARBITRARY=true\n')}};put(stage,'altered-manifest.json',altered);
  assert.notEqual(spawnSync('python3',[join(repositoryRoot,'scripts/release/verify-source.py'),archive,join(stage,'altered-manifest.json')]).status,0);
});
