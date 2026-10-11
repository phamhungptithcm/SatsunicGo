import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import console from 'node:console';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const REGION='asia-southeast1';
const triggerConstructors=new Map([['firebase-functions/v2/https',new Set(['onCall','onRequest'])],['firebase-functions/v2/scheduler',new Set(['onSchedule'])],['firebase-functions/v2/firestore',new Set(['onDocumentCreated','onDocumentWritten'])]]);
// Exact source-owned emulator exports, never a generic conditional-export parser.
const emulatorExports=new Map([
  ['purchaseDemoPayment',{binding:'guardedPurchaseDemoPayment',from:'./purchase-checkout',kind:'onCall',sdk:'firebase-functions/v2/https'}],
  ['purchaseDemoWebhook',{binding:'guardedPurchaseDemoWebhook',from:'./purchase-demo-gateway',kind:'onRequest',sdk:'firebase-functions/v2/https'}],
  ['purchaseSePayPayment',{binding:'sandboxSePayPayment',from:'./purchase-sepay',kind:'onCall',sdk:'firebase-functions/v2/https',guard:'localSePay'}],
  ['purchaseSePayIpn',{binding:'sandboxSePayIpn',from:'./purchase-sepay',kind:'onRequest',sdk:'firebase-functions/v2/https',guard:'localSePay'}],
  ['purchaseSePayInboxWorker',{binding:'sandboxSePayInboxWorker',from:'./purchase-sepay',kind:'onDocumentCreated',sdk:'firebase-functions/v2/firestore',guard:'localSePay'}],
]);
export function exactDemoCondition(node) {
  return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
    ts.isStringLiteral(node.right) && node.right.text === 'true' &&
    ts.isPropertyAccessExpression(node.left) && !node.left.questionDotToken && node.left.name.text === 'FUNCTIONS_EMULATOR' &&
    ts.isPropertyAccessExpression(node.left.expression) && !node.left.expression.questionDotToken && node.left.expression.name.text === 'env' &&
    ts.isIdentifier(node.left.expression.expression) && node.left.expression.expression.text === 'process';
}
function exactSePayCondition(node) {
  if(!ts.isBinaryExpression(node)||node.operatorToken.kind!==ts.SyntaxKind.AmpersandAmpersandToken||!exactDemoCondition(node.left))return false;
  const project=node.right;
  return ts.isBinaryExpression(project)&&project.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken&&
    ts.isStringLiteral(project.right)&&project.right.text==='demo-satsunicgo'&&
    ts.isPropertyAccessExpression(project.left)&&!project.left.questionDotToken&&project.left.name.text==='GCLOUD_PROJECT'&&
    ts.isPropertyAccessExpression(project.left.expression)&&!project.left.expression.questionDotToken&&project.left.expression.name.text==='env'&&
    ts.isIdentifier(project.left.expression.expression)&&project.left.expression.expression.text==='process';
}
function assertDemoEnvironmentReads(ast) {
  function visit(node) {
    if(ts.isIdentifier(node)&&node.text==='process'){
      const env=node.parent,property=env?.parent,comparison=property?.parent;
      // A pure comparison cannot leak an alias through which the guard's environment is changed.
      if(!env||!ts.isPropertyAccessExpression(env)||env.expression!==node||env.questionDotToken||env.name.text!=='env'||
        !property||!ts.isPropertyAccessExpression(property)||property.expression!==env||property.questionDotToken||
        !comparison||!ts.isBinaryExpression(comparison)||comparison.left!==property||
        ![ts.SyntaxKind.EqualsEqualsEqualsToken,ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(comparison.operatorToken.kind)||
        !ts.isStringLiteral(comparison.right)||
        !(property.name.text==='FUNCTIONS_EMULATOR'&&comparison.right.text==='true'||property.name.text==='GCLOUD_PROJECT'&&comparison.right.text==='demo-satsunicgo'))throw Error('EMULATOR_ENVIRONMENT_ESCAPES');
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
}
export function assertDemoBindings(ast, names, allowed = new Set(), propertyWrites = new Set()) {
  const includes = node => ts.isIdentifier(node) ? names.has(node.text) :
    (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) && node.elements.some(element => ts.isBindingElement(element) && includes(element.name));
  const rootName = node => ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node) ? rootName(node.expression) : ts.isIdentifier(node) ? node.text : undefined;
  function visit(node) {
    if ((ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node) || ts.isImportSpecifier(node) || ts.isImportClause(node) || ts.isNamespaceImport(node) || ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node) || ts.isEnumDeclaration(node) || ts.isModuleDeclaration(node)) && node.name && includes(node.name) && !allowed.has(node.name)) throw Error('EMULATOR_BINDING_SHADOWED');
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && names.has(rootName(node.left)) && !(propertyWrites.has(rootName(node.left)) && !ts.isIdentifier(node.left))) throw Error('EMULATOR_BINDING_MUTATED');
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) && names.has(rootName(node.operand))) throw Error('EMULATOR_BINDING_MUTATED');
    if (ts.isDeleteExpression(node) && names.has(rootName(node.expression))) throw Error('EMULATOR_BINDING_MUTATED');
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
export function assertOnlyDemoReferences(ast, name, allowed) {
  function visit(node) {
    if (ts.isIdentifier(node) && node.text === name && !allowed.has(node)) {
      if (!(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) throw Error('EMULATOR_BINDING_ESCAPES');
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const requiredRoutes={'/campaign-banners':'campaignBannersPublic','/campaign-banners/**':'campaignBannersPublic','/robots.txt':'publicDiscovery','/sitemap.xml':'publicDiscovery','/media/**':'publicImage','/products':'publicPage','/posts':'publicPage','/products/**':'publicPage','/posts/**':'publicPage','/how-it-works':'publicPage','/fees':'publicPage','/privacy':'publicPage','/terms':'publicPage','/restricted':'publicPage'};
export function preflight({root,project}) {
  const errors=[],hashes={},inventory=[],emulatorOnlyExports=[],productionTestExports=[],cache=new Map();
  const fail=code=>errors.push(code);
  const base=fs.realpathSync(root);
  function read(relative){
    if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||relative.split(/[\\/]/).some(s=>s==='..'||s.startsWith('.')&&s!=='.vite')||/env|secret|credential/i.test(relative))throw Error('UNSAFE_PATH');
    const full=path.resolve(base,relative),real=fs.realpathSync(full);
    if(!real.startsWith(base+path.sep)||!fs.statSync(real).isFile())throw Error('UNSAFE_PATH');
    if(fs.statSync(real).size>4*1024*1024)throw Error('FILE_BUDGET_EXCEEDED');
    const bytes=fs.readFileSync(real);hashes[relative]=crypto.createHash('sha256').update(bytes).digest('hex');return bytes.toString('utf8');
  }
  const json=relative=>JSON.parse(read(relative));
  function module(relative){
    if(cache.has(relative))return cache.get(relative);
    if(cache.size>=128)throw Error('MODULE_BUDGET_EXCEEDED');
    const ast=ts.createSourceFile(relative,read(relative),ts.ScriptTarget.Latest,true),variables=new Map(),exports=new Map(),constructors=new Map(),imports=new Map(),declarations=new Map();
    const data={relative,ast,variables,exports,constructors,imports,declarations};cache.set(relative,data);
    for(const node of ast.statements){
      if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&/^\.\.?\//.test(node.moduleSpecifier.text)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings))for(const item of node.importClause.namedBindings.elements)if(!item.isTypeOnly&&!node.importClause.isTypeOnly)imports.set(item.name.text,{from:node.moduleSpecifier.text,name:item.propertyName?.text??item.name.text});
      const exported=node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword||m.kind===ts.SyntaxKind.DefaultKeyword);
      if(exported&&!ts.isVariableStatement(node)&&!ts.isInterfaceDeclaration(node)&&!ts.isTypeAliasDeclaration(node)){if(node.name&&ts.isIdentifier(node.name))exports.set(node.name.text,{local:node.name.text});else throw Error('UNSUPPORTED_EXPORTED_DECLARATION');}
      if(exported&&ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>!ts.isIdentifier(d.name)))throw Error('UNSUPPORTED_EXPORTED_BINDING');
      if(ts.isExportAssignment(node))throw Error('UNSUPPORTED_EXPORT_ASSIGNMENT');
      if(ts.isExpressionStatement(node)&&ts.isBinaryExpression(node.expression)&&/^(exports\.|module\.exports)/.test(node.expression.left.getText(ast)))throw Error('UNSUPPORTED_COMMONJS_EXPORT');
      if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&triggerConstructors.has(node.moduleSpecifier.text)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings))for(const item of node.importClause.namedBindings.elements){const name=item.propertyName?.text??item.name.text;if(triggerConstructors.get(node.moduleSpecifier.text).has(name))constructors.set(item.name.text,name);}
      if(ts.isVariableStatement(node))for(const item of node.declarationList.declarations)if(ts.isIdentifier(item.name)&&item.initializer){variables.set(item.name.text,item.initializer);declarations.set(item.name.text,item);if(node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))exports.set(item.name.text,{local:item.name.text});}
      if(ts.isExportDeclaration(node)&&node.exportClause&&ts.isNamedExports(node.exportClause))for(const item of node.exportClause.elements)exports.set(item.name.text,{local:item.propertyName?.text??item.name.text,from:node.moduleSpecifier?.text});
      if(ts.isExportDeclaration(node)&&!node.exportClause)fail('UNSUPPORTED_STAR_EXPORT');
    }return data;
  }
  function staticBinding(scope,name,visited=new Set()){
    const key=scope.relative+':'+name;if(visited.has(key))return;visited.add(key);
    const declaration=scope.declarations.get(name);
    if(declaration&&!(declaration.parent.flags&ts.NodeFlags.Const))throw Error('OPTIONS_MUTABLE_BINDING');
    function inspect(node){
      if(ts.isIdentifier(node)&&node.text===name){
        const parent=node.parent;
        // Declaration/property/type names do not read or escape an option value.
        if((ts.isVariableDeclaration(parent)&&parent.name===node)||(ts.isImportSpecifier(parent))||(ts.isPropertyAssignment(parent)&&parent.name===node)||(ts.isPropertyAccessExpression(parent)&&parent.name===node)||ts.isExportSpecifier(parent))return;
        for(let ancestor=parent;ancestor&&!ts.isStatement(ancestor);ancestor=ancestor.parent)if(ts.isTypeNode(ancestor))return;
        let use=node;
        while(use.parent&&(ts.isAsExpression(use.parent)||ts.isParenthesizedExpression(use.parent)||ts.isSatisfiesExpression(use.parent)))use=use.parent;
        if(ts.isSpreadAssignment(use.parent)&&use.parent.expression===use){use=use.parent.parent;if(!ts.isObjectLiteralExpression(use))throw Error('OPTIONS_VALUE_ESCAPES');while(use.parent&&(ts.isAsExpression(use.parent)||ts.isParenthesizedExpression(use.parent)||ts.isSatisfiesExpression(use.parent)))use=use.parent;}
        const consumer=use.parent;
        if(ts.isVariableDeclaration(consumer)&&consumer.initializer===use&&ts.isIdentifier(consumer.name)&&scope.declarations.get(consumer.name.text)===consumer){staticBinding(scope,consumer.name.text,visited);return;}
        if(ts.isCallExpression(consumer)&&consumer.arguments[0]===use&&ts.isIdentifier(consumer.expression)&&scope.constructors.has(consumer.expression.text)&&ts.isVariableDeclaration(consumer.parent)&&ts.isIdentifier(consumer.parent.name)&&scope.declarations.get(consumer.parent.name.text)===consumer.parent&&consumer.parent.initializer===consumer)return;
        // Writes, property access, unknown calls and containers require runtime reasoning.
        throw Error('OPTIONS_VALUE_ESCAPES');
      }
      ts.forEachChild(node,inspect);
    }
    inspect(scope.ast);
  }
  function resolve(relative,name,seen=new Set()){
    const key=relative+':'+name;if(seen.has(key))throw Error('EXPORT_CYCLE');seen.add(key);
    const m=module(relative),entry=m.exports.get(name);if(!entry)throw Error('EXPORT_UNRESOLVED');
    if(entry.from){if(!entry.from.startsWith('./')&&!entry.from.startsWith('../'))throw Error('NONRELATIVE_REEXPORT');const target=path.posix.normalize(path.posix.join(path.posix.dirname(relative),entry.from));return resolve(target+'.ts',entry.local,seen);}
    const call=m.variables.get(entry.local);if(!call||!ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||!m.constructors.has(call.expression.text))throw Error('TRIGGER_UNRESOLVED');
    function regionOf(expression,visited=new Set(),scope=m){
      while(expression&&(ts.isAsExpression(expression)||ts.isParenthesizedExpression(expression)||ts.isSatisfiesExpression(expression)))expression=expression.expression;
      if(expression&&ts.isIdentifier(expression)){
        const key=scope.relative+':'+expression.text;if(visited.has(key))throw Error('OPTIONS_CYCLE');visited.add(key);
        staticBinding(scope,expression.text);
        const local=scope.variables.get(expression.text);
        if(local)return regionOf(local,visited,scope);
        const imported=scope.imports.get(expression.text);if(!imported)throw Error('OPTIONS_UNRESOLVED');
        const target=path.posix.normalize(path.posix.join(path.posix.dirname(scope.relative),imported.from))+'.ts',other=module(target),entry=other.exports.get(imported.name);
        if(!entry||entry.from||entry.local!==imported.name||!other.variables.has(imported.name))throw Error('OPTIONS_UNRESOLVED');
        staticBinding(other,imported.name);
        return regionOf(other.variables.get(imported.name),visited,other);
      }
      if(!expression||!ts.isObjectLiteralExpression(expression))throw Error('OPTIONS_UNRESOLVED');
      let region;
      for(const property of expression.properties){
        if(!ts.isSpreadAssignment(property)&&(ts.isComputedPropertyName(property.name)||(!ts.isPropertyAssignment(property)&&property.name.getText(scope.ast).replace(/['"]/g,'')==='region')))throw Error('OPTIONS_MEMBER_UNRESOLVED');
        if(ts.isSpreadAssignment(property)){const inherited=regionOf(property.expression,new Set(visited),scope);if(inherited!==undefined)region=inherited;}
        else if(ts.isPropertyAssignment(property)&&property.name.getText(scope.ast).replace(/['"]/g,'')==='region'){if(!ts.isStringLiteral(property.initializer))throw Error('REGION_UNRESOLVED');region=property.initializer.text;}
      }return region;
    }
    const region=regionOf(call.arguments[0]);if(!region)throw Error('REGION_UNRESOLVED');
    return {name,kind:m.constructors.get(call.expression.text),region,source:relative};
  }
  function demoDeclaration(m,name,spec) {
    const declaration=m.declarations.get(name),conditional=declaration?.initializer;
    if(m.relative!=='functions/src/index.ts'||!conditional||!ts.isConditionalExpression(conditional)||m.exports.get(name)?.local!==name||m.exports.get(name)?.from||
      !(declaration.parent.flags&ts.NodeFlags.Const)||declaration.parent.declarations.length!==1||!declaration.parent.parent.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword)||
      !(spec.guard?ts.isIdentifier(conditional.condition)&&conditional.condition.text===spec.guard:exactDemoCondition(conditional.condition))||
      !ts.isIdentifier(conditional.whenTrue)||conditional.whenTrue.text!==spec.binding||!ts.isIdentifier(conditional.whenFalse)||conditional.whenFalse.text!=='undefined')throw Error('EMULATOR_EXPORT_SHAPE');
    return {declaration,conditional};
  }
  function emulatorExport(m,name) {
    const spec=emulatorExports.get(name);if(!spec)return false;
    const {declaration,conditional}=demoDeclaration(m,name,spec),imported=m.imports.get(spec.binding);
    if(imported?.from!==spec.from||imported.name!==name)throw Error('EMULATOR_EXPORT_SHAPE');
    const imports=m.ast.statements.filter(node=>ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)).flatMap(node=>node.importClause.namedBindings.elements).filter(item=>item.name.text===spec.binding);
    if(imports.length!==1||m.ast.statements.filter(node=>ts.isVariableStatement(node)).flatMap(node=>node.declarationList.declarations).filter(item=>ts.isIdentifier(item.name)&&item.name.text===name).length!==1||m.ast.statements.some(node=>ts.isExportDeclaration(node)&&node.exportClause&&ts.isNamedExports(node.exportClause)&&node.exportClause.elements.some(item=>item.name.text===name)))throw Error('EMULATOR_EXPORT_DUPLICATE');
    const names=new Set(['process','undefined',spec.binding,name]),allowed=new Set([imports[0].name,declaration.name]);
    if(spec.guard){
      const guard=m.declarations.get(spec.guard);
      if(!guard||!(guard.parent.flags&ts.NodeFlags.Const)||guard.parent.declarations.length!==1||m.exports.has(spec.guard)||!guard.initializer||!exactSePayCondition(guard.initializer))throw Error('EMULATOR_GUARD_SHAPE');
      names.add(spec.guard);allowed.add(guard.name);
      const references=new Set([guard.name]);
      for(const [otherName,otherSpec] of emulatorExports)if(otherSpec.guard===spec.guard&&m.exports.has(otherName))references.add(demoDeclaration(m,otherName,otherSpec).conditional.condition);
      assertOnlyDemoReferences(m.ast,spec.guard,references);
    }
    assertDemoBindings(m.ast,names,allowed);
    assertDemoEnvironmentReads(m.ast);
    assertOnlyDemoReferences(m.ast,spec.binding,new Set([imports[0].name,conditional.whenTrue]));
    const exportReferences=new Set([declaration.name]);
    if(imports[0].propertyName)exportReferences.add(imports[0].propertyName);
    assertOnlyDemoReferences(m.ast,name,exportReferences);
    const target=module('functions/src/'+spec.from.slice(2)+'.ts'),binding=target.declarations.get(name);
    if(!binding||!(binding.parent.flags&ts.NodeFlags.Const)||binding.parent.declarations.length!==1||!binding.parent.parent.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword)||target.exports.get(name)?.local!==name||target.exports.get(name)?.from)throw Error('EMULATOR_TARGET_MUTABLE');
    assertDemoBindings(target.ast,new Set([name]),new Set([binding.name]));
    assertOnlyDemoReferences(target.ast,name,new Set([binding.name]));
    const sdk=binding.initializer?.expression;
    if(!sdk || !ts.isIdentifier(sdk))throw Error('EMULATOR_TARGET_INVALID');
    const sdkImports=target.ast.statements.filter(node=>ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&node.moduleSpecifier.text===spec.sdk&&node.importClause?.namedBindings&&!node.importClause.isTypeOnly&&ts.isNamedImports(node.importClause.namedBindings)).flatMap(node=>node.importClause.namedBindings.elements).filter(item=>item.name.text===sdk.text&&(item.propertyName?.text??item.name.text)===spec.kind&&!item.isTypeOnly);
    if(sdkImports.length!==1)throw Error('EMULATOR_TARGET_INVALID');
    assertDemoBindings(target.ast,new Set([sdk.text]),new Set([sdkImports[0].name]));
    const trigger=resolve(target.relative,name);
    if(trigger.kind!==spec.kind||trigger.region!==REGION)throw Error('EMULATOR_TARGET_INVALID');
    emulatorOnlyExports.push(trigger);
    return true;
  }
  function productionTestExport(m,name) {
    const spec=emulatorExports.get(name),declaration=m.declarations.get(name),conditional=declaration?.initializer;
    if(!spec?.guard || !conditional || !ts.isConditionalExpression(conditional) || !ts.isIdentifier(conditional.condition) || conditional.condition.text!=='productionSePay')return false;
    const guard=m.declarations.get('productionSePay'),call=guard?.initializer;
    const imported=m.imports.get('sepayArtifactEnvironment');
    if(m.relative!=='functions/src/index.ts'||!(declaration.parent.flags&ts.NodeFlags.Const)||declaration.parent.declarations.length!==1||m.exports.get(name)?.local!==name||m.exports.get(name)?.from||
      !ts.isIdentifier(conditional.whenTrue)||conditional.whenTrue.text!==spec.binding||!ts.isIdentifier(conditional.whenFalse)||conditional.whenFalse.text!=='undefined'||
      !guard||!(guard.parent.flags&ts.NodeFlags.Const)||guard.parent.declarations.length!==1||m.exports.has('productionSePay')||!call||!ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||call.expression.text!=='sepayArtifactEnvironment'||call.arguments.length||
      imported?.from!=='./production-test-policy'||imported.name!=='sepayArtifactEnvironment'||m.imports.get(spec.binding)?.from!==spec.from||m.imports.get(spec.binding)?.name!==name)throw Error('PRODUCTION_TEST_EXPORT_SHAPE');
    const guardReferences=new Set([guard.name]);
    for(const exportName of ['purchaseSePayPayment','purchaseSePayIpn','purchaseSePayInboxWorker']) {
      const other=m.declarations.get(exportName)?.initializer;
      if(!other||!ts.isConditionalExpression(other)||!ts.isIdentifier(other.condition)||other.condition.text!=='productionSePay')throw Error('PRODUCTION_TEST_EXPORT_SET');
      guardReferences.add(other.condition);
    }
    assertOnlyDemoReferences(m.ast,'productionSePay',guardReferences);
    const imports=m.ast.statements.filter(node=>ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)).flatMap(node=>node.importClause.namedBindings.elements);
    const helper=imports.filter(item=>item.name.text==='sepayArtifactEnvironment'),binding=imports.filter(item=>item.name.text===spec.binding);
    if(helper.length!==1||binding.length!==1)throw Error('PRODUCTION_TEST_EXPORT_SHAPE');
    assertDemoBindings(m.ast,new Set(['productionSePay','sepayArtifactEnvironment',spec.binding,name]),new Set([guard.name,helper[0].name,binding[0].name,declaration.name]));
    assertOnlyDemoReferences(m.ast,'sepayArtifactEnvironment',new Set([helper[0].name,call.expression]));
    assertOnlyDemoReferences(m.ast,spec.binding,new Set([binding[0].name,conditional.whenTrue]));
    const names=new Set([declaration.name]);if(binding[0].propertyName)names.add(binding[0].propertyName);
    assertOnlyDemoReferences(m.ast,name,names);
    // Bind the actual admission implementation into source hashes too.
    module('functions/src/production-test-policy.ts');
    const trigger=resolve('functions/src/'+spec.from.slice(2)+'.ts',name);
    if(trigger.kind!==spec.kind||trigger.region!==REGION)throw Error('PRODUCTION_TEST_TARGET_INVALID');
    inventory.push(trigger);productionTestExports.push(trigger);return true;
  }
  function attempt(code,operation){try{return operation();}catch{fail(code);return undefined;}}
  if(project!=='satsunicgo')fail('PROJECT_NOT_EXACT_PRODUCTION_TARGET');
  const config=attempt('FIREBASE_CONFIG_INVALID',()=>json('firebase.json'));
  if(config){
    const functions=Array.isArray(config.functions)?config.functions:[config.functions];
    if(functions.length!==1||functions[0]?.source!=='functions'||functions[0]?.codebase!=='satsunicgo'||functions[0]?.runtime!=='nodejs22')fail('FUNCTIONS_CONFIG_MISMATCH');
    const pkg=attempt('FUNCTIONS_PACKAGE_INVALID',()=>json('functions/package.json'));if(pkg?.engines?.node!=='22')fail('NODE_ENGINE_MISMATCH');
    for(const [name,relative]of Object.entries({firestoreRules:config.firestore?.rules,firestoreIndexes:config.firestore?.indexes,storageRules:config.storage?.rules}))attempt('MISSING_OR_UNSAFE_'+name,()=>name==='firestoreIndexes'?json(relative):read(relative));
    attempt('FUNCTION_INVENTORY_INVALID',()=>{const m=module('functions/src/index.ts');for(const name of m.exports.keys()){if(productionTestExport(m,name)||emulatorExport(m,name))continue;const trigger=resolve('functions/src/index.ts',name);inventory.push(trigger);if(trigger.region!==REGION)fail('FUNCTION_REGION_MISMATCH');}});
    const rewrites=config.hosting?.rewrites??[];
    const canonical=[...Object.entries(requiredRoutes).map(([source,functionId])=>({source,function:{functionId,region:REGION}})),{source:'**',destination:'/index.html'}];
    if(JSON.stringify(rewrites)!==JSON.stringify(canonical))fail('REWRITE_ORDER_OR_EXTRA_MISMATCH');
    for(const [route,target]of Object.entries(requiredRoutes)){const matches=rewrites.filter(r=>r.source===route);if(matches.length!==1||matches[0].function?.functionId!==target||matches[0].function?.region!==REGION||!inventory.some(t=>t.name===target&&t.kind==='onRequest'&&t.region===REGION))fail('REWRITE_MISMATCH:'+route);}
    if(config.hosting?.public!=='dist'||rewrites.at(-1)?.source!=='**'||rewrites.at(-1)?.destination!=='/index.html')fail('HOSTING_SPA_MISMATCH');
    attempt('PUBLIC_ASSET_BINDING_INVALID',()=>{
      const manifest=json('dist/.vite/manifest.json'),entry=manifest['index.html'],generated=json('functions/generated/public-assets.json');
      const csp=config.hosting.headers?.filter(h=>h.source==='**').flatMap(h=>h.headers??[]).filter(h=>h.key==='Content-Security-Policy');
      if(csp?.length!==1||!csp[0].value||generated.csp!==csp[0].value)throw Error('CSP_MISMATCH');
      if(!entry?.isEntry||!/^assets\/[a-zA-Z0-9._-]+\.js$/.test(entry.file)||generated.entry!=='/'+entry.file||JSON.stringify(generated.css)!==JSON.stringify((entry.css??[]).map(p=>'/'+p)))throw Error('ENTRY_MISMATCH');
      for(const asset of [entry.file,...(entry.css??[])]){if(!/^assets\/[a-zA-Z0-9._-]+\.(js|css)$/.test(asset))throw Error('ASSET_PATH_INVALID');read('dist/'+asset);}
      const html=read('dist/index.html');
      // Conservative source tokenizer: comments and inert/raw-text contents cannot supply bindings.
      const tags=[];let rest=html,templateDepth=0;
      while(rest){
        const start=rest.indexOf('<');if(start<0)break;rest=rest.slice(start);
        if(rest.startsWith('<!--')){const end=rest.indexOf('-->');if(end<0)throw Error('HTML_COMMENT_UNCLOSED');rest=rest.slice(end+3);continue;}
        if(/^<!doctype\s[^>]*>/i.test(rest)){rest=rest.slice(rest.indexOf('>')+1);continue;}
        const token=/^<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)(\s+(?:[^"'<>]|"[^"]*"|'[^']*')*|\s*)(\/?)>/.exec(rest);
        if(!token)throw Error('HTML_TOKEN_UNRESOLVED');rest=rest.slice(token[0].length);
        const name=token[2].toLowerCase();if(['xmp','plaintext','iframe','noembed','noframes'].includes(name))throw Error('HTML_UNSUPPORTED_INERT_CONTAINER');if(name==='template'){templateDepth+=token[1]?-1:1;if(templateDepth<0)throw Error('HTML_TEMPLATE_INVALID');continue;}
        if(token[1])continue;
        const attrs=new Map();let attrText=token[3].trim();if(token[0].endsWith('/>')&&attrText.endsWith('/'))attrText=attrText.slice(0,-1).trim();
        while(attrText){const attr=/^([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?\s*/.exec(attrText);if(!attr)throw Error('HTML_ATTRIBUTE_INVALID');const key=attr[1].toLowerCase();if(attrs.has(key))throw Error('HTML_ATTRIBUTE_DUPLICATE');attrs.set(key,attr[2]??attr[3]??attr[4]??'');attrText=attrText.slice(attr[0].length);}
        if(!templateDepth)tags.push({name,attrs});
        if(['script','style','textarea','title','noscript'].includes(name)){const close=new RegExp('</'+name+'\\s*>','i').exec(rest);if(!close)throw Error('HTML_RAWTEXT_UNCLOSED');rest=rest.slice(close.index+close[0].length);}
      }
      if(templateDepth!==0||tags.filter(t=>t.name==='script'&&t.attrs.get('type')==='module'&&t.attrs.get('src')==='/'+entry.file).length!==1||(entry.css??[]).some(css=>tags.filter(t=>t.name==='link'&&t.attrs.get('rel')==='stylesheet'&&t.attrs.get('href')==='/'+css).length!==1))throw Error('HTML_ASSET_MISMATCH');
    });
  }
  return {status:'PREPARED_NOT_DEPLOYED',readiness:'NOT_READY',localChecks:errors.length?'FAILED':'PASSED',project:project==='satsunicgo'?'satsunicgo':'REJECTED',region:REGION,inventory,emulatorOnlyExports,productionTestExports,hashes,errors,compiledLibraryFreshness:'UNVERIFIED_NO_SOURCE_BUILD_MANIFEST',cloud:'NOT_CHECKED',publicConfiguration:'NOT_CHECKED',limits:['Source inventory is not deployed inventory','No runtime imports, credentials, provider, network or deployment checks','Static option uses checked only in parsed modules; no whole-program side-effect or runtime proof','Only entry CSS/JS bindings checked; chunk graph and application configuration not fully certified']};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--project'){console.error('Usage: node scripts/release/preflight.mjs --project satsunicgo');process.exitCode=1;}else{const result=preflight({root:process.cwd(),project:args[1]});console.log(JSON.stringify(result,null,2));if(result.localChecks==='FAILED')process.exitCode=1;}
}
