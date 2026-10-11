/** QA-only generation. No server, Firebase SDK, browser automation or canonical build output. */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const output=path.join(root,'docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R2');
const service=path.join(output,'fixture-service.ts');
const digest=async file=>crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
const previousRoot=path.dirname(output);
const previousFiles=(await fs.readdir(previousRoot,{withFileTypes:true})).filter(entry=>entry.isFile()&&entry.name.startsWith('EMAIL-CONTENT-')&&!entry.name.startsWith('EMAIL-CONTENT-R2')).map(entry=>entry.name);
const preserved=await Promise.all(previousFiles.map(async name=>({path:path.relative(root,path.join(previousRoot,name)),sha256:await digest(path.join(previousRoot,name))})));
const imported=new Map();
const firestore=`import {fixture} from ${JSON.stringify(service)};
export const doc=(_db,...parts)=>({path:parts.join('/')});
export const collection=(_db,name)=>({path:name});
export const where=(field,operation,value)=>({field,operation,value});
export const limit=(count)=>({count});
export const query=(ref,...filters)=>({...ref,filters});
export const getDocs=async()=>({docs:[]});
export function onSnapshot(ref,callback){let active=true;queueMicrotask(()=>{if(active)callback(ref.path.startsWith('users/')?{data:()=>fixture.profile(ref.path.split('/')[1])}:{docs:[]});});return()=>{active=false;};}`;
const recovery=`export const readSavePointer=async()=>null;export const reserveSave=async()=>{throw Object.assign(Error('FIXTURE_PROFILE_WRITES_DISABLED'),{code:'functions/permission-denied'});};export const clearSavePointer=async()=>{};`;
const plugin={
  name:'email-content-r2-synthetic-adapters',enforce:'pre',
  resolveId(id){
    if(/shared\/firebase(?:\.ts)?$/.test(id))return service;
    if(id==='firebase/firestore')return '\0emailR2Firestore';
    if(id==='firebase/auth')return '\0emailR2Auth';
    if(id.startsWith('firebase/'))throw Error('UNDECLARED_FIREBASE_IMPORT');
    if(id==='./cart-store')return '\0emailR2Cart';
    if(id==='./save-recovery')return '\0emailR2Recovery';
    if(/app\/route-modules$/.test(id))return '\0emailR2Routes';
  },
  load(id){
    if(id==='\0emailR2Firestore')return firestore;
    if(id==='\0emailR2Recovery')return recovery;
    if(id==='\0emailR2Cart')return 'export const useCart=()=>({cart:{revision:1,items:[]},loading:false,cached:false,refresh:()=>{}});';
    if(id==='\0emailR2Routes')return 'export const preloadNavigation=()=>{};';
    if(id==='\0emailR2Auth')return `import {fixture} from ${JSON.stringify(service)};export const getAuth=()=>fixture.auth;export const onAuthStateChanged=(_auth,callback)=>{callback(fixture.user());return()=>{};};`;
  },
  async transform(_code,id){
    const file=id.split('?')[0];
    if(file.startsWith(root+path.sep)&&!file.includes('/node_modules/')&&!file.startsWith('\0')&&/\.(tsx?|css)$/.test(file)){
      if(!imported.has(file))imported.set(file,await digest(file));
    }
  },
  generateBundle(){
    for(const id of this.getModuleIds())
      if(id.includes('/node_modules/firebase/')||id.includes('/node_modules/@firebase/'))throw Error('REAL_FIREBASE_SDK_IN_FIXTURE');
  },
};
const result=await build({configFile:false,root,logLevel:'warn',plugins:[plugin,react()],define:{'process.env.NODE_ENV':'"production"'},build:{write:false,minify:true,lib:{entry:path.join(output,'entry.tsx'),formats:['es'],fileName:()=> 'components.js'},rollupOptions:{output:{codeSplitting:false}},cssCodeSplit:false}});
const generated=[];
for(const item of(Array.isArray(result)?result[0]:result).output){
  const filename=item.type==='chunk'?'components.js':item.fileName.endsWith('.css')?'components.css':null;
  if(!filename)throw Error('UNEXPECTED_FIXTURE_ASSET');
  await fs.writeFile(path.join(output,filename),item.type==='chunk'?item.code:item.source);
  generated.push(filename);
}
const shellPath='docs/reviews/NOTIFICATION-SUBSCRIPTIONS-20261009/r4-app-shell.json';
const {header,footer,styles}=JSON.parse(await fs.readFile(path.join(root,shellPath),'utf8'));
await fs.writeFile(path.join(output,'preview.html'),`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' ws://127.0.0.1:5207; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src data:; font-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'"><title>Notification state review</title>${styles}<link rel="stylesheet" href="./components.css"></head><body><div inert aria-hidden="true">${header}</div><div id="emailContentRoot"></div><div inert aria-hidden="true">${footer}</div><script type="module" src="./components.js"></script></body></html>`);
generated.push('preview.html');
const contextPaths=[shellPath,'functions/src/notification-preferences.ts','functions/src/email/provider-config.ts','functions/src/provider-release-gate.ts','package.json','package-lock.json'];
const inputs=[...imported.entries()].map(([file,sha256])=>({path:path.relative(root,file),sha256,kind:file.startsWith(output)?'fixture_source':'actual_imported_source'}));
for(const file of contextPaths)inputs.push({path:file,sha256:await digest(path.join(root,file)),kind:'declared_context'});
const drift=[];
for(const input of inputs)if(await digest(path.join(root,input.path))!==input.sha256)drift.push(input.path);
const previousDrift=[];
for(const file of preserved)if(await digest(path.join(root,file.path))!==file.sha256)previousDrift.push(file.path);
const generatorPaths=['build.mjs','SCENARIOS.json','README.md'];
for(const file of generatorPaths)inputs.push({path:path.relative(root,path.join(output,file)),sha256:await digest(path.join(output,file)),kind:'fixture_generation_or_scenario_source'});
const outputs=await Promise.all(generated.map(async file=>({path:path.relative(root,path.join(output,file)),sha256:await digest(path.join(output,file))})));
const receipt={generatedAtUTC:new Date().toISOString(),status:drift.length||previousDrift.length?'INVALID_SOURCE_DRIFT':'READY_FOR_CUA_LOCAL_VALIDATION',method:'Vite build write:false with current real React components/hook/domain/styles; synthetic adapters only',runtime:process.version,actualImportedSourceCount:inputs.filter(file=>file.kind==='actual_imported_source').length,inputs,outputs,sourceDrift:drift,previousFixtureDrift:previousDrift,preservedPreviousFixtures:preserved,adapters:{firebase:'in-memory callable/Auth/db',firestore:'synthetic snapshots and empty address rows',cart:'unused declared empty in-memory stub',profileRecovery:'in-memory null read; profile persistence deliberately denied',navigation:'MemoryRouter; historical r4 header/footer are inert'},limitations:['Historical r4 shell is disclosed and excluded from current shell acceptance','CheckoutNotificationChoices uses a synthetic frame; full checkout/payment/cart work is excluded','Local source-bound proxy only; no authenticated/backend/provider/SMS/real inbox/CRM/production performance proof','No browser interaction or screenshot was performed by this generator'],providerIO:false,accountWrites:false,browserValidation:'NOT_RUN; root owns CUA',tokenUsage:'Unavailable',actualBilledCost:'Unavailable'};
await fs.writeFile(path.join(output,'SOURCE-MANIFEST.json'),JSON.stringify(receipt,null,2)+'\n');
if(drift.length||previousDrift.length)throw Error('FIXTURE_SOURCE_OR_PRESERVATION_DRIFT');
console.log(JSON.stringify({status:receipt.status,actualImportedSourceCount:receipt.actualImportedSourceCount,outputs,sourceDrift:drift,previousFixtureDrift:previousDrift}));
