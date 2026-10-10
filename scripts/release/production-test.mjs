import ts from 'typescript';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertDemoBindings, assertOnlyDemoReferences } from './preflight.mjs';
export const PRODUCTION_TEST_ENVIRONMENT = Object.freeze({ PURCHASE_PRODUCTION_TEST_ARTIFACT: 'v1', PURCHASE_SEPAY_SANDBOX_ENABLED: 'true' });
export const PRODUCTION_TEST_ENV_FILE = 'deployment/functions/.env.satsunicgo';
export const PRODUCTION_TEST_ENV_BYTES = 'PURCHASE_PRODUCTION_TEST_ARTIFACT=v1\nPURCHASE_SEPAY_SANDBOX_ENABLED=true\n';
export const PRODUCTION_TEST_NAMES = Object.freeze(['purchaseSePayPayment', 'purchaseSePayIpn', 'purchaseSePayInboxWorker']);
const kinds = new Map([['purchaseSePayPayment','onCall'],['purchaseSePayIpn','onRequest'],['purchaseSePayInboxWorker','onDocumentCreated']]);
export function productionTestMetadata(rows = []) {
  if (!Array.isArray(rows) || rows.length !== 0 && rows.length !== PRODUCTION_TEST_NAMES.length) throw Error('PRODUCTION_TEST_EXPORT_SET');
  const names = new Set();
  for (const row of rows) {
    if (!row || Object.keys(row).sort().join(',') !== 'kind,name,region,source' || names.has(row.name) || kinds.get(row.name) !== row.kind || row.region !== 'asia-southeast1' || row.source !== 'functions/src/purchase-sepay.ts') throw Error('PRODUCTION_TEST_EXPORT_METADATA');
    names.add(row.name);
  }
  return names;
}
/** Only exact compiler bindings may retain production-test conditional exports. */
export function assertCompiledProductionTestExports(compiled, rows = []) {
  const names = productionTestMetadata(rows);
  if (!names.size) return names;
  const ast = ts.createSourceFile('index.js', compiled, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const declarations = ast.statements.filter(ts.isVariableStatement).flatMap(node=>node.declarationList.declarations);
  const binding = (name, from) => {
    const matches=declarations.filter(node=>ts.isIdentifier(node.name)&&node.name.text===name), declaration=matches[0], call=declaration?.initializer;
    if(matches.length!==1||!(declaration.parent.flags&ts.NodeFlags.Const)||declaration.parent.declarations.length!==1||!call||!ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||call.expression.text!=='require'||call.arguments.length!==1||!ts.isStringLiteral(call.arguments[0])||call.arguments[0].text!==from)throw Error('PRODUCTION_TEST_COMPILED_SHAPE');
    return declaration;
  };
  const guard=declarations.find(node=>ts.isIdentifier(node.name)&&node.name.text==='productionSePay'),call=guard?.initializer;
  if(!guard||!(guard.parent.flags&ts.NodeFlags.Const)||guard.parent.declarations.length!==1||!call||!ts.isCallExpression(call)||call.arguments.length)throw Error('PRODUCTION_TEST_COMPILED_SHAPE');
  let expression=call.expression;while(ts.isParenthesizedExpression(expression))expression=expression.expression;
  if(ts.isBinaryExpression(expression)&&expression.operatorToken.kind===ts.SyntaxKind.CommaToken&&ts.isNumericLiteral(expression.left)&&expression.left.text==='0')expression=expression.right;
  if(!ts.isPropertyAccessExpression(expression)||!ts.isIdentifier(expression.expression)||expression.name.text!=='sepayArtifactEnvironment')throw Error('PRODUCTION_TEST_COMPILED_SHAPE');
  const policy=binding(expression.expression.text,'./production-test-policy');
  const policyReferences=new Set([policy.name,expression.expression]),guardReferences=new Set([guard.name]);
  const allowed=new Set(),modules=new Map(),found=new Set();
  const harmlessDeclaration = node => {
    let value=node;while(ts.isBinaryExpression(value)&&value.operatorToken.kind===ts.SyntaxKind.EqualsToken)value=value.right;
    return ts.isVoidExpression(value)&&ts.isNumericLiteral(value.expression)&&value.expression.text==='0';
  };
  for(const statement of ast.statements){
    if(!ts.isExpressionStatement(statement)||!ts.isBinaryExpression(statement.expression)||statement.expression.operatorToken.kind!==ts.SyntaxKind.EqualsToken)continue;
    const assignment=statement.expression,member=assignment.left;
    if(!ts.isPropertyAccessExpression(member)||!ts.isIdentifier(member.expression)||member.expression.text!=='exports'||!names.has(member.name.text))continue;
    if(harmlessDeclaration(assignment.right))continue;
    const conditional=assignment.right;
    if(found.has(member.name.text)||!ts.isConditionalExpression(conditional)||!ts.isIdentifier(conditional.condition)||conditional.condition.text!=='productionSePay'||!ts.isIdentifier(conditional.whenFalse)||conditional.whenFalse.text!=='undefined'||!ts.isPropertyAccessExpression(conditional.whenTrue)||!ts.isIdentifier(conditional.whenTrue.expression)||conditional.whenTrue.name.text!==member.name.text)throw Error('PRODUCTION_TEST_COMPILED_SHAPE');
    const imported=binding(conditional.whenTrue.expression.text,'./purchase-sepay');
    if(!modules.has(imported.name.text))modules.set(imported.name.text,{declaration:imported,references:new Set([imported.name])});
    modules.get(imported.name.text).references.add(conditional.whenTrue.expression);
    guardReferences.add(conditional.condition);allowed.add(member.name);allowed.add(conditional.whenTrue.name);found.add(member.name.text);
  }
  if(found.size!==names.size)throw Error('PRODUCTION_TEST_COMPILED_SHAPE');
  function visit(node){
    if(ts.isIdentifier(node)&&names.has(node.text)&&!allowed.has(node)){
      const member=node.parent,assignment=member?.parent;
      if(!(ts.isPropertyAccessExpression(member)&&member.name===node&&ts.isIdentifier(member.expression)&&member.expression.text==='exports'&&ts.isBinaryExpression(assignment)&&assignment.left===member&&assignment.operatorToken.kind===ts.SyntaxKind.EqualsToken&&harmlessDeclaration(assignment.right)))throw Error('PRODUCTION_TEST_BINDING_ESCAPES');
    }
    if(ts.isStringLiteralLike(node)&&names.has(node.text))throw Error('PRODUCTION_TEST_BINDING_ESCAPES');
    ts.forEachChild(node,visit);
  }
  visit(ast);
  const protectedNames=new Set(['process','undefined','require','exports','module','productionSePay',policy.name.text,...modules.keys()]), allowedBindings=new Set([guard.name,policy.name,...[...modules.values()].map(value=>value.declaration.name)]);
  assertDemoBindings(ast,protectedNames,allowedBindings,new Set(['exports']));
  assertOnlyDemoReferences(ast,'productionSePay',guardReferences);
  assertOnlyDemoReferences(ast,policy.name.text,policyReferences);
  for(const [name,module] of modules)assertOnlyDemoReferences(ast,name,module.references);
  return names;
}
export function verifyProductionTestEnvironment(root, manifest) {
  const rows=manifest.productionTestExports??[];
  const names=productionTestMetadata(rows),file=join(root,PRODUCTION_TEST_ENV_FILE);
  if(names.size){
    if(JSON.stringify(manifest.runtimeEnvironment)!==JSON.stringify(PRODUCTION_TEST_ENVIRONMENT)||!existsSync(file)||readFileSync(file,'utf8')!==PRODUCTION_TEST_ENV_BYTES)throw Error('PRODUCTION_TEST_ENVIRONMENT_MISMATCH');
  } else if(manifest.runtimeEnvironment!==undefined||existsSync(file))throw Error('UNEXPECTED_PRODUCTION_TEST_ENVIRONMENT');
  return names;
}
