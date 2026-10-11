import { createHash } from 'node:crypto';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMVER, SHA } from './release.mjs';
import { preflight } from './preflight.mjs';
import ts from 'typescript';

export const digest = value => createHash('sha256').update(value).digest('hex');
export function files(root, prefix = '') {
  const result = {};
  for (const name of readdirSync(join(root, prefix)).sort()) {
    const file = prefix ? `${prefix}/${name}` : name;
    if (!/^[\w./-]+$/.test(file) || name.startsWith('.') && file !== 'deployment/dist/.vite') {
      // Vite's generated manifest is the sole allowed hidden directory.
      if (!file.startsWith('deployment/dist/.vite/')) throw Error('UNSAFE_ARTIFACT_PATH');
    }
    const stat = lstatSync(join(root, file));
    if (stat.isSymbolicLink()) throw Error('ARTIFACT_SYMLINK');
    if (stat.isDirectory()) Object.assign(result, files(root, file));
    else if (stat.isFile()) result[file] = digest(readFileSync(join(root, file)));
    else throw Error('UNSUPPORTED_ARTIFACT_FILE');
  }
  return result;
}
export function deploymentConfig(config) {
  const fn = config.functions;
  if (!Array.isArray(fn) || fn.length !== 1 || fn[0].source !== 'functions' || fn[0].codebase !== 'satsunicgo' || fn[0].runtime !== 'nodejs22' || config.hosting?.public !== 'dist') throw Error('UNEXPECTED_DEPLOYMENT_CONFIG');
  return {
    functions: [{ source: 'functions', codebase: 'satsunicgo', runtime: 'nodejs22',
      predeploy: [], ignore: ['node_modules', '.git', '.env*', 'firebase-debug.log', 'firebase-debug.*.log'] }],
    hosting: config.hosting,
  };
}
export function deploymentLockSeed(rootLock, pkg) {
  const declarations = value => JSON.stringify(Object.entries(value ?? {}).sort());
  if (rootLock.lockfileVersion !== 3 || declarations(rootLock.packages?.functions?.dependencies) !== declarations(pkg.dependencies)) throw Error('WORKSPACE_DEPENDENCY_MISMATCH');
  const packages = {};
  for (const [key, value] of Object.entries(rootLock.packages)) {
    if (key.startsWith('node_modules/') && !value.link) packages[key] = value;
  }
  for (const [key, value] of Object.entries(rootLock.packages)) {
    if (key.startsWith('functions/node_modules/')) packages[key.slice('functions/'.length)] = value;
  }
  packages[''] = { ...rootLock.packages.functions, name: pkg.name, version: pkg.version };
  return { name: pkg.name, version: pkg.version, lockfileVersion: 3, requires: true, packages };
}
export function assertLockedVersions(seed, actual) {
  for (const [key, value] of Object.entries(actual.packages)) {
    if (key && (!seed.packages[key] || seed.packages[key].version !== value.version || seed.packages[key].integrity !== value.integrity || value.link)) throw Error('DEPLOYMENT_DEPENDENCY_DRIFT');
  }
}
export function verify(root, expectedSha, expectedTag) {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  if (!SHA.test(expectedSha) || !SEMVER.test(expectedTag) || manifest.sha !== expectedSha || manifest.tag !== expectedTag || manifest.project !== 'satsunicgo' || manifest.schemaVersion !== 1) throw Error('ARTIFACT_IDENTITY_MISMATCH');
  const actual = files(root);
  delete actual['manifest.json'];
  if (JSON.stringify(Object.entries(actual).sort()) !== JSON.stringify(Object.entries(manifest.files).sort())) throw Error('ARTIFACT_FILE_HASH_MISMATCH');
  const candidate = JSON.parse(readFileSync(join(root, 'candidate.json'), 'utf8'));
  if (candidate.sha !== expectedSha || candidate.tag !== expectedTag) throw Error('CANDIDATE_IDENTITY_MISMATCH');
  const config = JSON.parse(readFileSync(join(root, 'deployment/firebase.json'), 'utf8'));
  if (JSON.stringify(config) !== JSON.stringify(deploymentConfig(config))) throw Error('UNSAFE_PROMOTION_CONFIG');
  for (const key of ['dist/release-version.json', 'functions/release.json']) {
    const metadata = JSON.parse(readFileSync(join(root, 'deployment', key), 'utf8'));
    if (metadata.tag !== expectedTag || metadata.sha !== expectedSha) throw Error('VERSION_METADATA_MISMATCH');
  }
  return manifest;
}
export function prepareWorkspace(root, target, expectedSha, expectedTag) {
  root = resolve(root); target = resolve(target);
  if (target === root || target.startsWith(root + sep) || root.startsWith(target + sep) || existsSync(target)) throw Error('UNSAFE_DEPLOYMENT_WORKSPACE');
  verify(root, expectedSha, expectedTag);
  cpSync(root, target, { recursive: true, errorOnExist: true, force: false });
  return verify(target, expectedSha, expectedTag);
}
// Preserve the explicitly held deployment boundary from the latest production release.
export const HELD_EXPORTS = Object.freeze(['askWorkflow', 'currentAskConversation', 'maintenance', 'createPaymentLink', 'payosWebhook', 'reconcilePayments', 'deliverEmail']);
export function applyProductionHolds(compiled, inventory) {
  const held = new Set(inventory.filter(item => HELD_EXPORTS.includes(item.name)).map(item => item.name));
  if (!held.size) return { compiled, inventory, heldExports: [] };
  if (held.size !== HELD_EXPORTS.length) throw Error('PRODUCTION_HOLD_INVENTORY_DRIFT');
  const ast = ts.createSourceFile('index.js', compiled, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const removed = new Set(), imports = new Set();
  const blockedModules = new Set(['./ai/ask-workflow', './payments/payos', './email']);
  const spans = [];
  for (const node of ast.statements) {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        const call = declaration.initializer;
        if (call && ts.isCallExpression(call) && call.expression.getText(ast) === 'require' && call.arguments.length === 1 && ts.isStringLiteral(call.arguments[0]) && blockedModules.has(call.arguments[0].text)) {
          if (node.declarationList.declarations.length !== 1) throw Error('PRODUCTION_HOLD_IMPORT_SHAPE');
          imports.add(call.arguments[0].text); spans.push([node.getStart(ast), node.end]);
        }
      }
    }
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const call = node.expression;
      if (call.expression.getText(ast) === 'Object.defineProperty' && call.arguments[0]?.getText(ast) === 'exports' && ts.isStringLiteral(call.arguments[1]) && held.has(call.arguments[1].text)) {
        if (removed.has(call.arguments[1].text)) throw Error('PRODUCTION_HOLD_DUPLICATE');
        removed.add(call.arguments[1].text); spans.push([node.getStart(ast), node.end]);
      }
    }
  }
  if (removed.size !== held.size || imports.size !== blockedModules.size) throw Error('PRODUCTION_HOLD_COMPILED_SHAPE');
  for (const [start, end] of spans.sort((a,b) => b[0]-a[0])) compiled = compiled.slice(0,start) + compiled.slice(end);
  return { compiled, inventory: inventory.filter(item => !held.has(item.name)), heldExports: [...held].sort() };
}
export function create(root, stage, candidatePath, notesPath = join(root, 'release-notes.md')) {
  if (existsSync(stage)) throw Error('ARTIFACT_STAGE_ALREADY_EXISTS');
  const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));
  if (!SEMVER.test(candidate.tag) || !SHA.test(candidate.sha)) throw Error('INVALID_CANDIDATE');
  const check = preflight({ root, project: 'satsunicgo' });
  if (check.localChecks !== 'PASSED' || !check.inventory.length) throw Error('RELEASE_PREFLIGHT_FAILED');
  mkdirSync(join(stage, 'deployment/functions'), { recursive: true });
  cpSync(join(root, 'dist'), join(stage, 'deployment/dist'), { recursive: true });
  for (const path of ['lib', 'generated/public-assets.json', 'package.json', 'package-lock.json']) {
    const target = join(stage, 'deployment/functions', path);
    mkdirSync(resolve(target, '..'), { recursive: true });
    cpSync(join(root, 'functions', path), target, { recursive: true });
  }
  const packagePath = join(stage, 'deployment/functions/package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const entryPath = join(stage, 'deployment/functions', pkg.main);
  if (!/^lib\/[\w./-]+\.js$/.test(pkg.main) || pkg.main.split('/').includes('..')) throw Error('UNSAFE_FUNCTION_ENTRY');
  const promotion = applyProductionHolds(readFileSync(entryPath, 'utf8'), check.inventory);
  writeFileSync(entryPath, promotion.compiled);
  pkg.version = candidate.tag.slice(1);
  // Deployment package contains precompiled JavaScript; managed Node build must not invoke tsc.
  delete pkg.scripts;
  // Workspace installs use root overrides/lock. Preserve that tested graph when
  // deploying Functions standalone instead of silently using its older separate lock.
  pkg.overrides = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).overrides;
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  const lockPath = join(stage, 'deployment/functions/package-lock.json');
  const seed = deploymentLockSeed(JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')), pkg);
  writeFileSync(lockPath, JSON.stringify(seed, null, 2) + '\n');
  try {
    execFileSync('npm', ['install', '--package-lock-only', '--omit=dev', '--ignore-scripts', '--offline', '--no-audit', '--no-fund'], {
      cwd: join(stage, 'deployment/functions'), timeout: 60_000, stdio: 'pipe',
    });
  } catch { throw Error('DEPLOYMENT_LOCK_RESOLUTION_FAILED'); }
  assertLockedVersions(seed, JSON.parse(readFileSync(lockPath, 'utf8')));
  const metadata = { schemaVersion: 1, tag: candidate.tag, sha: candidate.sha, project: 'satsunicgo',
    runId: process.env.GITHUB_RUN_ID ?? null };
  for (const path of ['dist/release-version.json', 'functions/release.json']) writeFileSync(join(stage, 'deployment', path), JSON.stringify(metadata, null, 2) + '\n');
  const config = deploymentConfig(JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8')));
  writeFileSync(join(stage, 'deployment/firebase.json'), JSON.stringify(config, null, 2) + '\n');
  cpSync(candidatePath, join(stage, 'candidate.json'));
  cpSync(notesPath, join(stage, 'release-notes.md'));
  const manifest = { schemaVersion: 1, ...metadata, region: 'asia-southeast1', inventory: promotion.inventory, heldExports: promotion.heldExports,
    files: files(stage), sourcePolicy: 'precompiled-package-no-dotenv-no-rebuild' };
  writeFileSync(join(stage, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return verify(stage, candidate.sha, candidate.tag);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'create') create(process.cwd(), resolve('release-stage'), resolve('candidate.json'));
  else if (process.argv[2] === 'workspace') prepareWorkspace(resolve('release-stage'), resolve('release-work'), process.env.GITHUB_SHA, process.env.RELEASE_TAG);
  else if (process.argv[2] === 'verify') {
    if (!process.env.RELEASE_TAG) throw Error('MISSING_RELEASE_TAG');
    verify(resolve('release-stage'), process.env.GITHUB_SHA, process.env.RELEASE_TAG);
  } else throw Error('INVALID_ARTIFACT_OPERATION');
}
