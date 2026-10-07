import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const REGION='asia-southeast1';
const requiredRoutes={'/campaign-banners':'campaignBannersPublic','/campaign-banners/**':'campaignBannersPublic','/robots.txt':'publicDiscovery','/sitemap.xml':'publicDiscovery','/media/**':'publicImage','/products':'publicPage','/posts':'publicPage','/products/**':'publicPage','/posts/**':'publicPage','/how-it-works':'publicPage','/fees':'publicPage','/privacy':'publicPage','/terms':'publicPage','/restricted':'publicPage'};
export function preflight({root,project}) {
  const errors=[],hashes={},inventory=[],cache=new Map();
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
    const ast=ts.createSourceFile(relative,read(relative),ts.ScriptTarget.Latest,true),variables=new Map(),exports=new Map(),constructors=new Map();
    const data={ast,variables,exports,constructors};cache.set(relative,data);
    for(const node of ast.statements){
      const exported=node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword||m.kind===ts.SyntaxKind.DefaultKeyword);
      if(exported&&!ts.isVariableStatement(node)&&!ts.isInterfaceDeclaration(node)&&!ts.isTypeAliasDeclaration(node)){if(node.name&&ts.isIdentifier(node.name))exports.set(node.name.text,{local:node.name.text});else throw Error('UNSUPPORTED_EXPORTED_DECLARATION');}
      if(exported&&ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>!ts.isIdentifier(d.name)))throw Error('UNSUPPORTED_EXPORTED_BINDING');
      if(ts.isExportAssignment(node))throw Error('UNSUPPORTED_EXPORT_ASSIGNMENT');
      if(ts.isExpressionStatement(node)&&ts.isBinaryExpression(node.expression)&&/^(exports\.|module\.exports)/.test(node.expression.left.getText(ast)))throw Error('UNSUPPORTED_COMMONJS_EXPORT');
      if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&/^firebase-functions\/v2\/(https|scheduler)$/.test(node.moduleSpecifier.text)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings))for(const item of node.importClause.namedBindings.elements){const name=item.propertyName?.text??item.name.text;if(['onCall','onRequest','onSchedule'].includes(name))constructors.set(item.name.text,name);}
      if(ts.isVariableStatement(node))for(const item of node.declarationList.declarations)if(ts.isIdentifier(item.name)&&item.initializer){variables.set(item.name.text,item.initializer);if(node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword))exports.set(item.name.text,{local:item.name.text});}
      if(ts.isExportDeclaration(node)&&node.exportClause&&ts.isNamedExports(node.exportClause))for(const item of node.exportClause.elements)exports.set(item.name.text,{local:item.propertyName?.text??item.name.text,from:node.moduleSpecifier?.text});
      if(ts.isExportDeclaration(node)&&!node.exportClause)fail('UNSUPPORTED_STAR_EXPORT');
    }return data;
  }
  function resolve(relative,name,seen=new Set()){
    const key=relative+':'+name;if(seen.has(key))throw Error('EXPORT_CYCLE');seen.add(key);
    const m=module(relative),entry=m.exports.get(name);if(!entry)throw Error('EXPORT_UNRESOLVED');
    if(entry.from){if(!entry.from.startsWith('./')&&!entry.from.startsWith('../'))throw Error('NONRELATIVE_REEXPORT');const target=path.posix.normalize(path.posix.join(path.posix.dirname(relative),entry.from));return resolve(target+'.ts',entry.local,seen);}
    const call=m.variables.get(entry.local);if(!call||!ts.isCallExpression(call)||!ts.isIdentifier(call.expression)||!m.constructors.has(call.expression.text))throw Error('TRIGGER_UNRESOLVED');
    function regionOf(expression,visited=new Set()){
      if(expression&&ts.isIdentifier(expression)){if(visited.has(expression.text))throw Error('OPTIONS_CYCLE');visited.add(expression.text);expression=m.variables.get(expression.text);}
      while(expression&&(ts.isAsExpression(expression)||ts.isParenthesizedExpression(expression)||ts.isSatisfiesExpression(expression)))expression=expression.expression;
      if(!expression||!ts.isObjectLiteralExpression(expression))throw Error('OPTIONS_UNRESOLVED');
      let region;
      for(const property of expression.properties){
        if(!ts.isSpreadAssignment(property)&&(ts.isComputedPropertyName(property.name)||(!ts.isPropertyAssignment(property)&&property.name.getText(m.ast).replace(/['"]/g,'')==='region')))throw Error('OPTIONS_MEMBER_UNRESOLVED');
        if(ts.isSpreadAssignment(property)){const inherited=regionOf(property.expression,new Set(visited));if(inherited!==undefined)region=inherited;}
        else if(ts.isPropertyAssignment(property)&&property.name.getText(m.ast).replace(/['"]/g,'')==='region'){if(!ts.isStringLiteral(property.initializer))throw Error('REGION_UNRESOLVED');region=property.initializer.text;}
      }return region;
    }
    const region=regionOf(call.arguments[0]);if(!region)throw Error('REGION_UNRESOLVED');
    return {name,kind:m.constructors.get(call.expression.text),region,source:relative};
  }
  function attempt(code,operation){try{return operation();}catch{fail(code);return undefined;}}
  if(project!=='satsunicgo')fail('PROJECT_NOT_EXACT_PRODUCTION_TARGET');
  const config=attempt('FIREBASE_CONFIG_INVALID',()=>json('firebase.json'));
  if(config){
    const functions=Array.isArray(config.functions)?config.functions:[config.functions];
    if(functions.length!==1||functions[0]?.source!=='functions'||functions[0]?.codebase!=='satsunicgo'||functions[0]?.runtime!=='nodejs22')fail('FUNCTIONS_CONFIG_MISMATCH');
    const pkg=attempt('FUNCTIONS_PACKAGE_INVALID',()=>json('functions/package.json'));if(pkg?.engines?.node!=='22')fail('NODE_ENGINE_MISMATCH');
    for(const [name,relative]of Object.entries({firestoreRules:config.firestore?.rules,firestoreIndexes:config.firestore?.indexes,storageRules:config.storage?.rules}))attempt('MISSING_OR_UNSAFE_'+name,()=>name==='firestoreIndexes'?json(relative):read(relative));
    attempt('FUNCTION_INVENTORY_INVALID',()=>{const m=module('functions/src/index.ts');for(const name of m.exports.keys()){const trigger=resolve('functions/src/index.ts',name);inventory.push(trigger);if(trigger.region!==REGION)fail('FUNCTION_REGION_MISMATCH');}});
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
  return {status:'PREPARED_NOT_DEPLOYED',readiness:'NOT_READY',localChecks:errors.length?'FAILED':'PASSED',project:project==='satsunicgo'?'satsunicgo':'REJECTED',region:REGION,inventory,hashes,errors,compiledLibraryFreshness:'UNVERIFIED_NO_SOURCE_BUILD_MANIFEST',cloud:'NOT_CHECKED',publicConfiguration:'NOT_CHECKED',limits:['Source inventory is not deployed inventory','No runtime imports, credentials, provider, network or deployment checks','Only entry CSS/JS bindings checked; chunk graph and application configuration not fully certified']};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--project'){console.error('Usage: node scripts/release/preflight.mjs --project satsunicgo');process.exitCode=1;}else{const result=preflight({root:process.cwd(),project:args[1]});console.log(JSON.stringify(result,null,2));if(result.localChecks==='FAILED')process.exitCode=1;}
}
