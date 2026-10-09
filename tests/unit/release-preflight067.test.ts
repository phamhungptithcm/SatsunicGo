import { test, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const modulePath='../../scripts/release/preflight.mjs';
const { preflight }=await import(modulePath);
const routes={'/campaign-banners':'campaignBannersPublic','/campaign-banners/**':'campaignBannersPublic','/robots.txt':'publicDiscovery','/sitemap.xml':'publicDiscovery','/media/**':'publicImage','/products':'publicPage','/posts':'publicPage','/products/**':'publicPage','/posts/**':'publicPage','/how-it-works':'publicPage','/fees':'publicPage','/privacy':'publicPage','/terms':'publicPage','/restricted':'publicPage'};
type FixtureConfig={functions:Array<{source:string;codebase:string;runtime:string}>;firestore:{rules:string;indexes:string};storage:{rules:string};hosting:{public:string;rewrites:Array<{source:string;function?:{functionId:string;region:string};destination?:string}>;headers:Array<{source:string;headers:Array<{key:string;value:string}>}>}};
function fixture(run:(root:string,put:(file:string,value:unknown)=>void,config:FixtureConfig)=>void){
  const root=mkdtempSync(path.join(tmpdir(),'preflight067-'));
  const put=(file:string,value:unknown)=>{mkdirSync(path.dirname(path.join(root,file)),{recursive:true});writeFileSync(path.join(root,file),typeof value==='string'?value:JSON.stringify(value));};
  const config={functions:[{source:'functions',codebase:'satsunicgo',runtime:'nodejs22'}],firestore:{rules:'firestore.rules',indexes:'firestore.indexes.json'},storage:{rules:'storage.rules'},hosting:{public:'dist',rewrites:[...Object.entries(routes).map(([source,functionId])=>({source,function:{functionId,region:'asia-southeast1'}})),{source:'**',destination:'/index.html'}],headers:[{source:'**',headers:[{key:'Content-Security-Policy',value:"default-src 'self'"}]}]}};
  put('firebase.json',config);put('functions/package.json',{engines:{node:'22'}});put('firestore.rules','rules');put('storage.rules','rules');put('firestore.indexes.json',{});
  put('functions/src/index.ts',`export { publicPage, publicDiscovery, publicImage } from './public'; export { maintenance } from './jobs'; export { campaignBannersPublic, websiteBannerAdmin, websiteBannerCommand, websiteBannerPreview } from './campaign-banners';`);
  put('functions/src/public.ts',`import {onRequest as http} from 'firebase-functions/v2/https'; const options={region:'asia-southeast1'}; export const publicPage=http(options,()=>{}); export const publicDiscovery=http(options,()=>{}); export const publicImage=http(options,()=>{});`);
  put('functions/src/campaign-banners.ts',`import {onCall,onRequest} from 'firebase-functions/v2/https';const opts={region:'asia-southeast1'};export const campaignBannersPublic=onRequest(opts,()=>{});export const websiteBannerAdmin=onCall(opts,()=>{});export const websiteBannerCommand=onCall(opts,()=>{});export const websiteBannerPreview=onCall(opts,()=>{});`);
  put('functions/src/jobs.ts',`import {onSchedule} from 'firebase-functions/v2/scheduler';export const maintenance=onSchedule({region:'asia-southeast1',schedule:'every day'},()=>{});`);
  put('dist/.vite/manifest.json',{'index.html':{isEntry:true,file:'assets/main-abc.js',css:['assets/main-abc.css']}});put('functions/generated/public-assets.json',{entry:'/assets/main-abc.js',css:['/assets/main-abc.css'],csp:"default-src 'self'"});put('dist/assets/main-abc.js','export{}');put('dist/assets/main-abc.css','body{}');put('dist/index.html','<script type="module" src="/assets/main-abc.js"></script><link rel="stylesheet" href="/assets/main-abc.css">');
  try{run(root,put,config);}finally{rmSync(root,{recursive:true,force:true});}
}
test('valid source inventory never certifies deployment or freshness',()=>fixture((root)=>{const r=preflight({root,project:'satsunicgo'});expect(r.errors).toEqual([]);expect(r.inventory).toHaveLength(8);expect(r.inventory.find((x:{name:string})=>x.name==='maintenance').kind).toBe('onSchedule');expect(r.status).toBe('PREPARED_NOT_DEPLOYED');expect(r.readiness).toBe('NOT_READY');expect(r.publicConfiguration).toBe('NOT_CHECKED');expect(r.compiledLibraryFreshness).toContain('UNVERIFIED');expect(Object.values(r.hashes).every(h=>/^[a-f0-9]{64}$/.test(h as string))).toBe(true);}));
test('reject wrong project without echoing supplied value',()=>fixture(root=>{const r=preflight({root,project:'private-wrong-target'});expect(r.project).toBe('REJECTED');expect(JSON.stringify(r)).not.toContain('private-wrong-target');}));
test('missing critical rewrite fails',()=>fixture((root,put,c)=>{c.hosting.rewrites=c.hosting.rewrites.filter(r=>r.source!=='/robots.txt');put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_MISMATCH:/robots.txt');}));
test('node runtime and engine mismatch fail separately',()=>fixture((root,put,c)=>{c.functions[0].runtime='nodejs20';put('firebase.json',c);put('functions/package.json',{engines:{node:'20'}});expect(preflight({root,project:'satsunicgo'}).errors).toEqual(expect.arrayContaining(['FUNCTIONS_CONFIG_MISMATCH','NODE_ENGINE_MISMATCH']));}));
test('stale generated public assets fails',()=>fixture((root,put)=>{put('functions/generated/public-assets.json',{entry:'/assets/old.js',css:[],csp:"default-src 'self'"});expect(preflight({root,project:'satsunicgo'}).errors).toContain('PUBLIC_ASSET_BINDING_INVALID');}));
test('missing disk asset fails despite valid metadata',()=>fixture(root=>{rmSync(path.join(root,'dist/assets/main-abc.css'));expect(preflight({root,project:'satsunicgo'}).errors).toContain('PUBLIC_ASSET_BINDING_INVALID');}));
test('path traversal and credential references never read',()=>fixture((root,put,c)=>{c.firestore.rules='../outside.rules';c.storage.rules='.env.local';put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toEqual(expect.arrayContaining(['MISSING_OR_UNSAFE_firestoreRules','MISSING_OR_UNSAFE_storageRules']));}));
test('symlink escape rejected',()=>fixture((root)=>{rmSync(path.join(root,'storage.rules'));symlinkSync('/etc/hosts',path.join(root,'storage.rules'));expect(preflight({root,project:'satsunicgo'}).errors).toContain('MISSING_OR_UNSAFE_storageRules');}));
test('wrong source trigger region rejected',()=>fixture((root,put)=>{put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';export const publicPage=onRequest({region:'us-central1'},()=>{});export const publicDiscovery=onRequest({region:'asia-southeast1'},()=>{});export const publicImage=onRequest({region:'asia-southeast1'},()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_REGION_MISMATCH');}));
test('unresolved export is not silently counted',()=>fixture((root,put)=>{put('functions/src/index.ts',`export { missing } from './public';`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}));

test('static option spreads resolve and override in source order',()=>fixture((root,put)=>{put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';const base={region:'us-central1'} as const;const opts={...base,region:'asia-southeast1'};export const publicPage=onRequest(opts,()=>{});export const publicDiscovery=onRequest({...opts,concurrency:2},()=>{});export const publicImage=onRequest(opts,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toEqual([]);}));

test('earlier catchall cannot shadow valid canonical rewrites',()=>fixture((root,put,c)=>{c.hosting.rewrites.unshift({source:'**',destination:'/other.html'});put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_ORDER_OR_EXTRA_MISMATCH');}));
test('computed region override fails closed',()=>fixture((root,put)=>{put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';const key='region';const opts={region:'asia-southeast1',[key]:'us-central1'};export const publicPage=onRequest(opts,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}));
test('unknown spread and option cycles fail closed',()=>fixture((root,put)=>{put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';const opts={region:'asia-southeast1',...runtime()};export const publicPage=onRequest(opts,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';const opts={...opts};export const publicPage=onRequest(opts,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}));
test('comment and text asset names are not actual bindings',()=>fixture((root,put)=>{for(const html of ['<!-- <script type="module" src="/assets/main-abc.js"></script><link rel="stylesheet" href="/assets/main-abc.css"> -->','<p>/assets/main-abc.js /assets/main-abc.css</p>','<template><script type="module" src="/assets/main-abc.js"></script><link rel="stylesheet" href="/assets/main-abc.css"></template>']){put('dist/index.html',html);expect(preflight({root,project:'satsunicgo'}).errors).toContain('PUBLIC_ASSET_BINDING_INVALID');}}));
test('exported destructuring, default and nontrigger do not disappear',()=>fixture((root,put)=>{for(const text of [`export const { extra }=runtime();`,`export default runtime();`,`export const extra=123;`,`module.exports.extra=runtime();`]){put('functions/src/index.ts',`export { publicPage, publicDiscovery, publicImage } from './public'; export { maintenance } from './jobs';`+text);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}}));
test('broad media route cannot precede canonical routing',()=>fixture((root,put,c)=>{c.hosting.rewrites.unshift({source:'/media/**',destination:'/other.html'});put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_ORDER_OR_EXTRA_MISMATCH');}));
test('wrong stylesheet href cannot be replaced by text reference',()=>fixture((root,put)=>{put('dist/index.html','<script type="module" src="/assets/main-abc.js"></script><link rel="stylesheet" href="/wrong.css"><p>/assets/main-abc.css</p>');expect(preflight({root,project:'satsunicgo'}).errors).toContain('PUBLIC_ASSET_BINDING_INVALID');}));
test('self-closing metadata and boolean crossorigin are accepted actual markup',()=>fixture((root,put)=>{put('dist/index.html','<!doctype html><meta charset="utf-8"/><script type="module" crossorigin src="/assets/main-abc.js"></script><link rel="stylesheet" crossorigin href="/assets/main-abc.css"/>');expect(preflight({root,project:'satsunicgo'}).errors).toEqual([]);}));
test('region shorthand fails while unrelated secrets shorthand cannot override region',()=>fixture((root,put)=>{put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';const region='asia-southeast1';export const publicPage=onRequest({region},()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}));

test('unsupported browser raw text containers cannot supply active bindings',()=>fixture((root,put)=>{for(const tag of ['xmp','plaintext','iframe','noembed','noframes']){put('dist/index.html',`<${tag}><script type="module" src="/assets/main-abc.js"></script><link rel="stylesheet" href="/assets/main-abc.css"></${tag}>`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('PUBLIC_ASSET_BINDING_INVALID');}}));

// Banner076 canonical expansion: exact two routes, actual trigger kind and region.
test('banner route wrong target or region fails closed',()=>fixture((root,put,c)=>{c.hosting.rewrites[0].function!.functionId='publicPage';put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_MISMATCH:/campaign-banners');}));
test('banner media route cannot be omitted',()=>fixture((root,put,c)=>{c.hosting.rewrites=c.hosting.rewrites.filter(r=>r.source!=='/campaign-banners/**');put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_ORDER_OR_EXTRA_MISMATCH');}));
test('extra banner wildcard cannot replace exact canonical route',()=>fixture((root,put,c)=>{c.hosting.rewrites.unshift({source:'/campaign-*/**',function:{functionId:'campaignBannersPublic',region:'asia-southeast1'}});put('firebase.json',c);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_ORDER_OR_EXTRA_MISMATCH');}));
test('banner callable cannot satisfy Hosting HTTP binding',()=>fixture((root,put)=>{put('functions/src/campaign-banners.ts',`import {onCall} from 'firebase-functions/v2/https';const opts={region:'asia-southeast1'};export const campaignBannersPublic=onCall(opts,()=>{});export const websiteBannerAdmin=onCall(opts,()=>{});export const websiteBannerCommand=onCall(opts,()=>{});export const websiteBannerPreview=onCall(opts,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_MISMATCH:/campaign-banners');}));

test('firestore alias and static spread preserve exact inventory and kind',()=>fixture((root,put)=>{put('functions/src/events.ts',`import {onDocumentCreated as created,onDocumentWritten} from 'firebase-functions/v2/firestore';const base={region:'asia-southeast1'};export const inserted=created({...base,document:'orders/{id}'},()=>{});export const updated=onDocumentWritten({...base,document:'orders/{id}'},()=>{});`);put('functions/src/index.ts',`export { publicPage, publicDiscovery, publicImage } from './public';export { maintenance } from './jobs';export { campaignBannersPublic, websiteBannerAdmin, websiteBannerCommand, websiteBannerPreview } from './campaign-banners';export { inserted,updated } from './events';`);const result=preflight({root,project:'satsunicgo'});expect(result.errors).toEqual([]);expect(result.inventory).toHaveLength(10);expect(result.inventory.find((x:{name:string})=>x.name==='inserted')?.kind).toBe('onDocumentCreated');expect(result.inventory.find((x:{name:string})=>x.name==='updated')?.kind).toBe('onDocumentWritten');expect(result.readiness).toBe('NOT_READY');}));
test('firestore wrong region still fails closed',()=>fixture((root,put)=>{put('functions/src/index.ts',`import {onDocumentWritten} from 'firebase-functions/v2/firestore';export const event=onDocumentWritten({region:'us-central1',document:'orders/{id}'},()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_REGION_MISMATCH');}));
test('unknown or wrong-module trigger never disappears',()=>fixture((root,put)=>{for(const body of [`import {onDocumentDeleted} from 'firebase-functions/v2/firestore';export const event=onDocumentDeleted({region:'asia-southeast1',document:'orders/{id}'},()=>{});`,`import {onCall} from 'firebase-functions/v2/firestore';export const event=onCall({region:'asia-southeast1'},()=>{});`,`import {onDocumentCreated} from 'firebase-functions/v2/https';export const event=onDocumentCreated({region:'asia-southeast1'},()=>{});`]){put('functions/src/index.ts',body);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}}));
test('firestore computed option and unknown spread still fail closed',()=>fixture((root,put)=>{for(const opts of [`{region:'asia-southeast1',[key]:'us-central1'}`,`{region:'asia-southeast1',...runtime()}`]){put('functions/src/index.ts',`import {onDocumentWritten} from 'firebase-functions/v2/firestore';const key='region';export const event=onDocumentWritten(${opts},()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}}));
test('firestore cannot satisfy HTTP hosting binding',()=>fixture((root,put)=>{put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {onDocumentCreated} from 'firebase-functions/v2/firestore';export const publicPage=onDocumentCreated({region:'asia-southeast1',document:'orders/{id}'},()=>{});export const publicDiscovery=onRequest({region:'asia-southeast1'},()=>{});export const publicImage=onRequest({region:'asia-southeast1'},()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('REWRITE_MISMATCH:/terms');}));

test('direct relative imported constant options resolve with alias and source-order spreads',()=>fixture((root,put)=>{put('functions/src/shared.ts',`export const config={region:'asia-southeast1'} as const;`);put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config as opts} from './shared';export const publicPage=onRequest({...opts},()=>{});export const publicDiscovery=onRequest(opts,()=>{});export const publicImage=onRequest(opts,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toEqual([]);}));
test('imported option cycles and dynamic values remain blocked',()=>fixture((root,put)=>{put('functions/src/shared.ts',`import {config as other} from './other';export const config=other;`);put('functions/src/other.ts',`import {config as first} from './shared';export const config=first;`);put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config} from './shared';export const publicPage=onRequest(config,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');put('functions/src/shared.ts',`export const config=runtime();`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}));
test('unexported, nonrelative and escaping options stay blocked',()=>fixture((root,put)=>{for(const from of ['./shared','fake-package','../../outside']){put('functions/src/shared.ts',`const config={region:'asia-southeast1'};`);put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config} from '${from}';export const publicPage=onRequest(config,()=>{});`);expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');}}));

test.each([
  `export let config={region:'asia-southeast1'};config={region:'europe-west1'};`,
  `export var config={region:'asia-southeast1'};config={region:'europe-west1'};`,
  `export const config={region:'asia-southeast1'};config.region='europe-west1';`,
  `export const config={region:'asia-southeast1'};config['region']='europe-west1';`,
  `export const config={region:'asia-southeast1'};delete config.region;`,
  `export const config={region:'asia-southeast1'};Object.assign(config,{region:'europe-west1'});`,
  `export const config={region:'asia-southeast1'};const alias=config;alias.region='europe-west1';`,
  `export const config={region:'asia-southeast1'};change(config);`,
  `export const config={region:'asia-southeast1'};(()=>{config.region='europe-west1';})();`,
])('imported option mutation or escape fails closed: %s',(source)=>fixture((root,put)=>{
  put('functions/src/shared.ts',source);
  put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config} from './shared';export const publicPage=onRequest(config,()=>{});export const publicDiscovery=onRequest(config,()=>{});export const publicImage=onRequest(config,()=>{});`);
  expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
}));
test('consumer-side imported option mutation fails closed',()=>fixture((root,put)=>{
  put('functions/src/shared.ts',`export const config={region:'asia-southeast1'};`);
  put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config} from './shared';config.region='europe-west1';export const publicPage=onRequest(config,()=>{});export const publicDiscovery=onRequest(config,()=>{});export const publicImage=onRequest(config,()=>{});`);
  expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
}));
test('local options with mutations or mutable aliases fail closed',()=>fixture((root,put)=>{
  for(const definition of [`let options={region:'asia-southeast1'};options={region:'europe-west1'};`,`const options={region:'asia-southeast1'};const alias=options;alias.region='europe-west1';`,`const options={region:'asia-southeast1'};let alias=options;alias={region:'europe-west1'};`]){
    put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';${definition}export const publicPage=onRequest(options,()=>{});export const publicDiscovery=onRequest(options,()=>{});export const publicImage=onRequest(options,()=>{});`);
    expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
  }
}));
test('a shadowed SDK constructor cannot conceal an options escape',()=>fixture((root,put)=>{
  put('functions/src/shared.ts',`export const config={region:'asia-southeast1'};`);
  put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config} from './shared';function mutate(onRequest){onRequest(config);}mutate(opts=>{opts.region='europe-west1'});export const publicPage=onRequest(config,()=>{});export const publicDiscovery=onRequest(config,()=>{});export const publicImage=onRequest(config,()=>{});`);
  expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
}));
test('static const option aliases and imported spreads still resolve',()=>fixture((root,put)=>{
  put('functions/src/shared.ts',`const base={region:'asia-southeast1'};export const config={...base,concurrency:2};`);
  put('functions/src/public.ts',`import {onRequest} from 'firebase-functions/v2/https';import {config as opts} from './shared';const alias=opts;const options={...alias};export const publicPage=onRequest(options,()=>{});export const publicDiscovery=onRequest(alias,()=>{});export const publicImage=onRequest(opts,()=>{});`);
  expect(preflight({root,project:'satsunicgo'}).errors).toEqual([]);
}));

const demoExport = `export const purchaseDemoPayment = process.env.FUNCTIONS_EMULATOR === 'true' ? guardedPurchaseDemoPayment : undefined;`;
function demoFixture(root:string,put:(file:string,value:unknown)=>void,entry=demoExport,target=`import {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});`){
  put('functions/src/purchase-checkout.ts',target);
  const original=readFileSync(path.join(root,'functions/src/index.ts'),'utf8');
  put('functions/src/index.ts',`${original}\nimport {purchaseDemoPayment as guardedPurchaseDemoPayment} from './purchase-checkout';\n${entry}`);
}
test('exact immutable demo-only export validates target and never enters production inventory',()=>fixture((root,put)=>{
  demoFixture(root,put);
  const result=preflight({root,project:'satsunicgo'});
  expect(result.errors).toEqual([]);
  expect(result.inventory).toHaveLength(8);
  expect(result.inventory.some((row:{name:string})=>row.name==='purchaseDemoPayment')).toBe(false);
  expect(result.emulatorOnlyExports).toEqual([{name:'purchaseDemoPayment',kind:'onCall',region:'asia-southeast1',source:'functions/src/purchase-checkout.ts'}]);
  expect(result.readiness).toBe('NOT_READY');
}));
test.each([
  ['loose comparison',demoExport.replace('===','==')],
  ['reversed comparison',demoExport.replace('===','!==')],
  ['boolean value',demoExport.replace("=== 'true'",'=== true')],
  ['computed environment',demoExport.replace('.FUNCTIONS_EMULATOR',"['FUNCTIONS_EMULATOR']")],
  ['different variable',demoExport.replace('FUNCTIONS_EMULATOR','ENABLE_DEMO')],
  ['false callable',demoExport.replace(': undefined',': guardedPurchaseDemoPayment')],
  ['void branch',demoExport.replace(': undefined',': void 0')],
  ['unconditional callable','export const purchaseDemoPayment=guardedPurchaseDemoPayment;'],
  ['mutable export',demoExport.replace('export const','export let')],
  ['aliased export',`const local=process.env.FUNCTIONS_EMULATOR === 'true' ? guardedPurchaseDemoPayment : undefined;export {local as purchaseDemoPayment};`],
  ['direct reexport',`export {purchaseDemoPayment} from './purchase-checkout';`],
  ['shadowed process',`const process={env:{FUNCTIONS_EMULATOR:'true'}};${demoExport}`],
  ['shadowed undefined',`const undefined=guardedPurchaseDemoPayment;${demoExport}`],
  ['destructured process',`const {process}=runtime();${demoExport}`],
  ['mutated environment',`process.env.FUNCTIONS_EMULATOR='true';${demoExport}`],
  ['escaped imported callable',`const alias=guardedPurchaseDemoPayment;${demoExport}`],
  ['duplicate export',`${demoExport}${demoExport}`],
  ['duplicate named export',`${demoExport}export {purchaseDemoPayment};`],
  ['indirect named export',`${demoExport.replace('export const','const')}export {purchaseDemoPayment};`],
  ['shared declaration',demoExport.replace(';',',other=runtime();')],
  ['shadowed imported callable',`function mutate(guardedPurchaseDemoPayment){}${demoExport}`],
])('changed demo export fails closed: %s',(_label,entry)=>fixture((root,put)=>{
  demoFixture(root,put,entry);
  expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
}));
test.each([
  `import {onCall} from 'firebase-functions/v2/https';export let purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});`,
  `import {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'us-central1'},()=>{});`,
  `import {onRequest} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onRequest({region:'asia-southeast1'},()=>{});`,
  `import {onCall} from 'other-sdk';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});`,
  `import type {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});`,
  `import {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});purchaseDemoPayment=runtime();`,
  `import {onCall} from 'firebase-functions/v2/https';export const purchaseDemoPayment=onCall({region:'asia-southeast1'},()=>{});function shadow(onCall){return onCall;}`,
])('demo exception independently rejects unsafe target: %s',target=>fixture((root,put)=>{
  demoFixture(root,put,demoExport,target);
  expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
}));
// Analytics release compatibility: inspect actual declarations, not copies of constructor syntax.
test('inventory resolves all nine analytics declarations with production region',()=>fixture((root,put)=>{
  for(const name of ['analytics-ingest','analytics-worker','dashboard-analytics'])
    put(`functions/src/${name}.ts`,readFileSync(new URL(`../../functions/src/${name}.ts`,import.meta.url),'utf8'));
  const index=readFileSync(path.join(root,'functions/src/index.ts'),'utf8');
  put('functions/src/index.ts',index+`export {analyticsSession,analyticsIngest,analyticsLinkOrder,analyticsWithdraw} from './analytics-ingest';export {analyticsOrderChanged,analyticsPaymentCreated,analyticsJobCreated,analyticsCompact} from './analytics-worker';export {dashboardAnalytics} from './dashboard-analytics';`);
  const result=preflight({root,project:'satsunicgo'});
  expect(result.errors).toEqual([]);
  expect(result.inventory).toHaveLength(17);
  const expected={analyticsSession:'onCall',analyticsIngest:'onCall',analyticsLinkOrder:'onCall',analyticsWithdraw:'onCall',analyticsOrderChanged:'onDocumentWritten',analyticsPaymentCreated:'onDocumentCreated',analyticsJobCreated:'onDocumentCreated',analyticsCompact:'onSchedule',dashboardAnalytics:'onCall'};
  for(const [name,kind] of Object.entries(expected))
    expect(result.inventory.find((item:{name:string})=>item.name===name)).toMatchObject({kind,region:'asia-southeast1'});
}));
test('Firestore triggers retain explicit region and trusted constructor import checks',()=>fixture((root,put)=>{
  const index=readFileSync(path.join(root,'functions/src/index.ts'),'utf8');
  put('functions/src/index.ts',index+`export { changed } from './analytics-trigger';`);
  put('functions/src/analytics-trigger.ts',`import {onDocumentWritten as written} from 'firebase-functions/v2/firestore';const options={region:'us-central1'};export const changed=written({...options,document:'orders/{id}'},()=>{});`);
  expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_REGION_MISMATCH');
  for(const [name,module] of [['onDocumentUpdated','firebase-functions/v2/firestore'],['onCall','firebase-functions/v2/firestore'],['onDocumentWritten','untrusted']]){
    put('functions/src/analytics-trigger.ts',`import {${name} as trigger} from '${module}';export const changed=trigger({region:'asia-southeast1',document:'orders/{id}'},()=>{});`);
    expect(preflight({root,project:'satsunicgo'}).errors).toContain('FUNCTION_INVENTORY_INVALID');
  }
}));
