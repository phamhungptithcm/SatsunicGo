import test from 'node:test';
import process from 'node:process';
import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { nextVersion, chooseCandidate, commitNotes, compareVersions, validateDeployIdentity } from '../../scripts/release/release.mjs';
import { create, verify, digest, deploymentConfig, deploymentLockSeed, assertLockedVersions, applyProductionHolds, HELD_EXPORTS } from '../../scripts/release/artifact.mjs';
import { checkInventory, verifyHosting, assertStableHostingRelease } from '../../scripts/release/verify-production.mjs';
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
function builtFixture(t) {
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
  put(root, 'functions/lib/functions/src/index.js', 'fixture precompiled');
  put(root, 'functions/src/index.ts', `import { onRequest } from 'firebase-functions/v2/https';\n${['campaignBannersPublic', 'publicDiscovery', 'publicImage', 'publicPage'].map(name => `export const ${name} = onRequest({ region: 'asia-southeast1' }, () => {});`).join('\n')}`);
  put(root, 'candidate.json', { tag: 'v1.2.3', sha, repository: 'owner/repo' });
  put(root, 'release-notes.md', 'Fixture release notes');
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
  const inventory = [...HELD_EXPORTS.map(name => ({name})), {name:'readNotification'}];
  const compiled = ['var workflow = require("./ai/ask-workflow");', 'var payments = require("./payments/payos");', 'var email = require("./email");', 'var jobs = require("./jobs");', ...HELD_EXPORTS.map(name => `Object.defineProperty(exports, "${name}", {get: function(){return jobs.${name};}});`), 'Object.defineProperty(exports, "readNotification", {get: function(){return jobs.readNotification;}});'].join('\n');
  const result = applyProductionHolds(compiled, inventory);
  assert.deepEqual(result.inventory, [{name:'readNotification'}]);
  assert.equal(result.heldExports.length, 7);
  assert.match(result.compiled, /require\(".\/jobs"\)/);
  assert.match(result.compiled, /"readNotification"/);
  assert.equal(result.compiled.includes('payments/payos'), false);
  assert.throws(() => applyProductionHolds(compiled.replace('"deliverEmail"','"wrong"'), inventory), /COMPILED_SHAPE/);
  assert.throws(() => applyProductionHolds(compiled, inventory.slice(1)), /INVENTORY_DRIFT/);
});

test('provider receipt refuses changed, replaced or unfinished Hosting releases during source verification', () => {
  const release = {name:'sites/satsunicgo/releases/one',type:'DEPLOY',releaseTime:'2026-10-07T00:00:00Z',version:{name:'sites/satsunicgo/versions/one',status:'FINALIZED'}};
  assertStableHostingRelease(release, structuredClone(release));
  for (const replacement of [ {...release,name:'sites/satsunicgo/releases/two'}, {...release,releaseTime:'2026-10-07T00:01:00Z'}, {...release,version:{...release.version,name:'sites/satsunicgo/versions/two'}}, {...release,type:'SITE_DISABLE'}, {...release,version:{...release.version,status:'CREATED'}} ]) assert.throws(() => assertStableHostingRelease(release,replacement), /HOSTING/);
});
