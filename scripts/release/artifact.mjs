import { createHash } from 'node:crypto';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMVER, SHA } from './release.mjs';
import { preflight, exactDemoCondition, assertDemoBindings, assertOnlyDemoReferences } from './preflight.mjs';
import ts from 'typescript';
import { retentionMetadata, assertRetentionSourceIndexes, verifyRetentionArtifact, RETENTION_FILE } from './feedback-retention.mjs';
import { assertCompiledProductionTestExports, verifyProductionTestEnvironment, PRODUCTION_TEST_ENV_FILE, PRODUCTION_TEST_ENVIRONMENT, PRODUCTION_TEST_ENV_BYTES } from './production-test.mjs';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const REQUIRED_FUNCTION_ASSETS = Object.freeze(['NotoSans-Regular.ttf', 'NotoSans-LICENSE.txt', 'purchase-vn-regions.json']);
export function copyFunctionAssets(root, deploymentFunctions) {
  // Fixed allowlist; reject symlinked parents before reading any asset bytes.
  for (const directory of ['functions', 'functions/assets']) {
    const stat = lstatSync(join(root, directory));
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw Error('UNSAFE_FUNCTION_ASSET');
  }
  mkdirSync(join(deploymentFunctions, 'assets'), { recursive: true });
  for (const name of REQUIRED_FUNCTION_ASSETS) {
    const source = join(root, 'functions/assets', name), stat = lstatSync(source);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size < 1 || stat.size > 1024 * 1024) throw Error('UNSAFE_FUNCTION_ASSET');
    cpSync(source, join(deploymentFunctions, 'assets', name), { errorOnExist: true, force: false });
  }
}
const emulatorExportMetadata=new Map([
  ['purchaseDemoPayment',{kind:'onCall',from:'./purchase-checkout'}],
  ['purchaseDemoWebhook',{kind:'onRequest',from:'./purchase-demo-gateway'}],
  ['purchaseSePayPayment',{kind:'onCall',from:'./purchase-sepay',guard:'localSePay'}],
  ['purchaseSePayIpn',{kind:'onRequest',from:'./purchase-sepay',guard:'localSePay'}],
  ['purchaseSePayInboxWorker',{kind:'onDocumentCreated',from:'./purchase-sepay',guard:'localSePay'}],
]);
function exactSePayCompiledCondition(node) {
  if(!ts.isBinaryExpression(node)||node.operatorToken.kind!==ts.SyntaxKind.AmpersandAmpersandToken||!exactDemoCondition(node.left))return false;
  const project=node.right;
  return ts.isBinaryExpression(project)&&project.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken&&
    ts.isStringLiteral(project.right)&&project.right.text==='demo-satsunicgo'&&
    ts.isPropertyAccessExpression(project.left)&&!project.left.questionDotToken&&project.left.name.text==='GCLOUD_PROJECT'&&
    ts.isPropertyAccessExpression(project.left.expression)&&!project.left.expression.questionDotToken&&project.left.expression.name.text==='env'&&
    ts.isIdentifier(project.left.expression.expression)&&project.left.expression.expression.text==='process';
}
function assertCompiledDemoEnvironment(ast) {
  function visit(node) {
    if(ts.isIdentifier(node)&&node.text==='process'){
      const env=node.parent,property=env?.parent,comparison=property?.parent;
      if(!env||!ts.isPropertyAccessExpression(env)||env.expression!==node||env.questionDotToken||env.name.text!=='env'||
        !property||!ts.isPropertyAccessExpression(property)||property.expression!==env||property.questionDotToken||
        !comparison||!ts.isBinaryExpression(comparison)||comparison.left!==property||
        ![ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(comparison.operatorToken.kind)||
        !ts.isStringLiteral(comparison.right)||
        !(property.name.text==='FUNCTIONS_EMULATOR'&&comparison.right.text==='true'||property.name.text==='GCLOUD_PROJECT'&&comparison.right.text==='demo-satsunicgo'))throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
}
/** Source-bound exact exceptions. Remove demo bindings even under a mistaken emulator env. */
export function excludeEmulatorOnlyExports(compiled, exclusions = [], productionTestExports = []) {
  const retainedProductionTest = assertCompiledProductionTestExports(compiled, productionTestExports);
  const activeMetadata = new Map([...emulatorExportMetadata].filter(([name])=>!retainedProductionTest.has(name)));
  if(!Array.isArray(exclusions)||exclusions.length>activeMetadata.size)throw Error('EMULATOR_EXPORT_METADATA');
  const expected=new Map();
  for(const row of exclusions){
    if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).sort().join(',')!=='kind,name,region,source')throw Error('EMULATOR_EXPORT_METADATA');
    const spec=activeMetadata.get(row.name);
    if(!spec||expected.has(row.name)||row.kind!==spec.kind||row.region!=='asia-southeast1'||row.source!=='functions/src/'+spec.from.slice(2)+'.ts')throw Error('EMULATOR_EXPORT_METADATA');
    expected.set(row.name,spec);
  }
  const ast = ts.createSourceFile('index.js', compiled, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if(ast.parseDiagnostics.length)throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
  const allowed = new Set(), assignments = [];
  function visit(node) {
    if (ts.isIdentifier(node) && activeMetadata.has(node.text) && ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
      const member = node.parent, assignment = member.parent;
      if (ts.isIdentifier(member.expression) && member.expression.text === 'exports' && ts.isBinaryExpression(assignment) && assignment.left === member && assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        let value = assignment.right;
        while (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.EqualsToken) value = value.right;
        if (ts.isVoidExpression(value) && ts.isNumericLiteral(value.expression) && value.expression.text === '0') allowed.add(node);
        else if (ts.isConditionalExpression(assignment.right) && ts.isExpressionStatement(assignment.parent) && assignment.parent.parent === ast) {
          assignments.push(assignment); allowed.add(node);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (assignments.length !== exclusions.length) throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
  const spans=new Map(),aliases=new Map(),seen=new Set(),guardReferences=new Set();
  const remove=statement=>spans.set(statement.getStart(ast)+':'+statement.end,[statement.getStart(ast),statement.end]);
  const declarations=ast.statements.filter(ts.isVariableStatement).flatMap(node=>node.declarationList.declarations);
  for (const assignment of assignments) {
    const name=assignment.left.name.text,spec=expected.get(name),conditional=assignment.right;
    if(!spec||seen.has(name)||!(spec.guard?ts.isIdentifier(conditional.condition)&&conditional.condition.text===spec.guard:exactDemoCondition(conditional.condition))||!ts.isIdentifier(conditional.whenFalse)||conditional.whenFalse.text!=='undefined'||!ts.isPropertyAccessExpression(conditional.whenTrue)||conditional.whenTrue.questionDotToken||conditional.whenTrue.name.text!==name||!ts.isIdentifier(conditional.whenTrue.expression))throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
    seen.add(name);
    const alias = conditional.whenTrue.expression;
    if (['process', 'undefined', 'require', 'exports', 'module', 'localSePay'].includes(alias.text)) throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
    const matches=declarations.filter(node=>ts.isIdentifier(node.name)&&node.name.text===alias.text),binding=matches[0],call=binding?.initializer;
    if(matches.length!==1||!(binding.parent.flags&ts.NodeFlags.Const)||binding.parent.declarations.length!==1||!call||!ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||call.expression.text!=='require'||call.arguments.length!==1||!ts.isStringLiteral(call.arguments[0])||call.arguments[0].text!==spec.from)throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
    if(!aliases.has(alias.text))aliases.set(alias.text,{binding,references:new Set([binding.name])});
    aliases.get(alias.text).references.add(alias);
    if(spec.guard)guardReferences.add(conditional.condition);
    allowed.add(conditional.whenTrue.name);
    remove(assignment.parent);remove(binding.parent.parent);
  }
  if(assignments.length){
    const names=new Set(['process','undefined','require','exports','module',...aliases.keys()]),bindings=new Set([...aliases.values()].map(alias=>alias.binding.name));
    if(guardReferences.size){
      const matches=declarations.filter(node=>ts.isIdentifier(node.name)&&node.name.text==='localSePay'),binding=matches[0];
      if(matches.length!==1||!(binding.parent.flags&ts.NodeFlags.Const)||binding.parent.declarations.length!==1||!binding.initializer||!exactSePayCompiledCondition(binding.initializer))throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
      names.add('localSePay');bindings.add(binding.name);guardReferences.add(binding.name);
      assertOnlyDemoReferences(ast,'localSePay',guardReferences);
      remove(binding.parent.parent);
    }
    assertDemoBindings(ast,names,bindings,new Set(['exports']));
    assertCompiledDemoEnvironment(ast);
    for(const [name,alias] of aliases)assertOnlyDemoReferences(ast,name,alias.references);
  }
  function rejectUnknown(node) {
    if ((ts.isIdentifier(node) || ts.isStringLiteralLike(node)) && activeMetadata.has(node.text) && !allowed.has(node)) throw Error('EMULATOR_EXPORT_COMPILED_SHAPE');
    ts.forEachChild(node, rejectUnknown);
  }
  rejectUnknown(ast);
  for (const [start, end] of [...spans.values()].sort((a, b) => b[0] - a[0])) compiled = compiled.slice(0, start) + compiled.slice(end);
  return { compiled, emulatorOnlyExports: exclusions.map(row => row.name) };
}
export function files(root, prefix = '') {
  const result = {};
  for (const name of readdirSync(join(root, prefix)).sort()) {
    const file = prefix ? `${prefix}/${name}` : name;
    if (!/^[\w./-]+$/.test(file) || name.startsWith('.') && file !== 'deployment/dist/.vite') {
      // Vite's generated manifest is the sole allowed hidden directory.
      if (!file.startsWith('deployment/dist/.vite/') && file !== PRODUCTION_TEST_ENV_FILE) throw Error('UNSAFE_ARTIFACT_PATH');
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
  const pkg = JSON.parse(readFileSync(join(root, 'deployment/functions/package.json'), 'utf8'));
  if (!/^lib\/[\w./-]+\.js$/.test(pkg.main) || pkg.main.split('/').includes('..')) throw Error('UNSAFE_FUNCTION_ENTRY');
  // Verification of an already stripped artifact accepts only harmless void0 declarations.
  verifyProductionTestEnvironment(root, manifest);
  verifyRetentionArtifact(root, manifest);
  excludeEmulatorOnlyExports(readFileSync(join(root, 'deployment/functions', pkg.main), 'utf8'), [], manifest.productionTestExports ?? []);
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
// Preserve legacy holds; v1 cleanup is packaged with an independent default-inactive gate.
const BASE_HELD_EXPORTS = Object.freeze(['askWorkflow', 'currentAskConversation', 'maintenance', 'createPaymentLink', 'payosWebhook', 'reconcilePayments']);
export const HELD_EXPORTS = Object.freeze([...BASE_HELD_EXPORTS, 'askFeedbackCleanup']);
export function applyProductionHolds(compiled, inventory, productionTest = false) {
  const retained = new Set(productionTest ? ['askWorkflow', 'currentAskConversation', 'askFeedbackCleanup'] : []);
  const held = new Set(inventory.filter(item => HELD_EXPORTS.includes(item.name) && !retained.has(item.name)).map(item => item.name));
  const baseHeld = new Set(inventory.filter(item => BASE_HELD_EXPORTS.includes(item.name)).map(item => item.name));
  if (baseHeld.size && baseHeld.size !== BASE_HELD_EXPORTS.length) throw Error('PRODUCTION_HOLD_INVENTORY_DRIFT');
  const ast = ts.createSourceFile('index.js', compiled, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  // The compiler's void-0 export declarations cannot expose a Function. Other
  // direct cleanup export shapes are unsupported and must never bypass holds.
  const unwrap = node => {
    while (node && ts.isParenthesizedExpression(node)) node = node.expression;
    return node;
  };
  const literalText = node => {
    node = unwrap(node);
    return node && ts.isStringLiteralLike(node) ? node.text : undefined;
  };
  const staticName = node => {
    node = unwrap(node);
    if (!node) return undefined;
    if (ts.isIdentifier(node)) return node.text;
    if (ts.isPropertyAccessExpression(node)) {
      const receiver = staticName(node.expression);
      return receiver === undefined ? undefined : `${receiver}.${node.name.text}`;
    }
    if (ts.isElementAccessExpression(node) && literalText(node.argumentExpression) !== undefined) {
      const receiver = staticName(node.expression);
      return receiver === undefined ? undefined : `${receiver}.${literalText(node.argumentExpression)}`;
    }
    return undefined;
  };
  const exportObject = node => ['exports', 'module.exports'].includes(staticName(node));
  const cleanupMember = node => ['exports.askFeedbackCleanup', 'module.exports.askFeedbackCleanup'].includes(staticName(node));
  const cleanupProperties = node => {
    node = unwrap(node);
    return node && ts.isObjectLiteralExpression(node) && node.properties.some(property => {
      if (ts.isSpreadAssignment(property)) return cleanupProperties(property.expression);
      const name = property.name;
      return name && ((ts.isIdentifier(name) && name.text === 'askFeedbackCleanup') || literalText(name) === 'askFeedbackCleanup' || ts.isComputedPropertyName(name) && literalText(name.expression) === 'askFeedbackCleanup');
    });
  };
  const emptyDeclaration = node => {
    node = unwrap(node);
    while (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) node = unwrap(node.right);
    const operand = ts.isVoidExpression(node) ? unwrap(node.expression) : undefined;
    return operand && ts.isNumericLiteral(operand) && operand.text === '0';
  };
  const inspectCleanupShape = node => {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      if (cleanupMember(node.left) && !(node.operatorToken.kind === ts.SyntaxKind.EqualsToken && emptyDeclaration(node.right))) throw Error('PRODUCTION_HOLD_COMPILED_SHAPE');
      if (staticName(node.left) === 'module.exports' && cleanupProperties(node.right)) throw Error('PRODUCTION_HOLD_COMPILED_SHAPE');
    }
    if (ts.isCallExpression(node)) {
      const name = staticName(node.expression);
      if (name === 'Object.defineProperty' && exportObject(node.arguments[0]) && literalText(node.arguments[1]) === 'askFeedbackCleanup') {
        const statement = node.parent;
        if (node.expression.getText(ast) !== 'Object.defineProperty' || node.arguments[0].getText(ast) !== 'exports' || !ts.isStringLiteral(node.arguments[1]) || !ts.isExpressionStatement(statement) || statement.expression !== node || !ts.isSourceFile(statement.parent)) throw Error('PRODUCTION_HOLD_COMPILED_SHAPE');
      }
      if ((name === 'Object.assign' || name === 'Object.defineProperties') && exportObject(node.arguments[0]) && node.arguments.slice(1).some(cleanupProperties)) throw Error('PRODUCTION_HOLD_COMPILED_SHAPE');
    }
    ts.forEachChild(node, inspectCleanupShape);
  };
  inspectCleanupShape(ast);
  const removed = new Set(), imports = new Set(), retainedSeen = new Set();
  const blockedModules = new Set(baseHeld.size ? [...(productionTest ? [] : ['./ai/ask-workflow']), './payments/payos'] : []);
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
      if (call.expression.getText(ast) === 'Object.defineProperty' && call.arguments[0]?.getText(ast) === 'exports' && ts.isStringLiteral(call.arguments[1])) {
        const name = call.arguments[1].text;
        if (name === 'askFeedbackCleanup' && !held.has(name)) {
          if (!retained.has(name) || !inventory.some(row => row.name === name)) throw Error('PRODUCTION_HOLD_INVENTORY_DRIFT');
          if (retainedSeen.has(name)) throw Error('PRODUCTION_HOLD_DUPLICATE');
          retainedSeen.add(name);
        }
        if (!held.has(name)) continue;
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
  copyFunctionAssets(root, join(stage, 'deployment/functions'));
  const packagePath = join(stage, 'deployment/functions/package.json');
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const entryPath = join(stage, 'deployment/functions', pkg.main);
  if (!/^lib\/[\w./-]+\.js$/.test(pkg.main) || pkg.main.split('/').includes('..')) throw Error('UNSAFE_FUNCTION_ENTRY');
  const productionTestExports = check.productionTestExports ?? [];
  const emulator = excludeEmulatorOnlyExports(readFileSync(entryPath, 'utf8'), check.emulatorOnlyExports, productionTestExports);
  if (productionTestExports.length) writeFileSync(join(stage, PRODUCTION_TEST_ENV_FILE), PRODUCTION_TEST_ENV_BYTES);
  const promotion = applyProductionHolds(emulator.compiled, check.inventory, productionTestExports.length > 0);
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
  const feedbackRetention = productionTestExports.length ? retentionMetadata(metadata) : undefined;
  if (feedbackRetention) {
    assertRetentionSourceIndexes(JSON.parse(readFileSync(join(root, 'firestore.indexes.json'), 'utf8')));
    writeFileSync(join(stage, RETENTION_FILE), JSON.stringify(feedbackRetention, null, 2) + '\n');
  }
  const config = deploymentConfig(JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8')));
  writeFileSync(join(stage, 'deployment/firebase.json'), JSON.stringify(config, null, 2) + '\n');
  cpSync(candidatePath, join(stage, 'candidate.json'));
  cpSync(notesPath, join(stage, 'release-notes.md'));
  const manifest = { schemaVersion: 1, ...metadata, region: 'asia-southeast1', inventory: promotion.inventory, heldExports: promotion.heldExports, emulatorOnlyExports: emulator.emulatorOnlyExports, productionTestExports, ...(productionTestExports.length ? { runtimeEnvironment: PRODUCTION_TEST_ENVIRONMENT, feedbackRetention } : {}),
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
