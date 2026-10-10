/** Interactive design fixture using application components. No Firebase or provider I/O. */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), tmp='/private/tmp/satsunicgo-notification-source-render';
await fs.mkdir(tmp,{recursive:true});
const entry=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';import {PurchaseCheckout} from '${root}/src/features/cart/purchase-checkout.tsx';import {Profile} from '${root}/src/features/profile/Profile.tsx';import {AccountRail} from '${root}/src/features/account/AccountRail.tsx';
const user={uid:'notification-preview-only',email:'customer@example.invalid',displayName:'Khách hàng minh họa'};
function Preview(){const [screen,setScreen]=useState('checkout');return <MemoryRouter><div className="notificationPreviewToolbar"><span>Component thật · Không lưu tài khoản · Không gửi tin</span><button onClick={()=>setScreen('checkout')} aria-pressed={screen==='checkout'}>Nhận hàng</button><button onClick={()=>setScreen('profile')} aria-pressed={screen==='profile'}>Hồ sơ · Thông báo</button></div><div hidden={screen!=='checkout'}><PurchaseCheckout user={user} signIn={()=>{}}/></div><div hidden={screen!=='profile'}><section className="accountWorkspace"><AccountRail active="profile"/><div className="accountPage"><Profile user={user}/></div></section></div></MemoryRouter>};createRoot(document.getElementById('notificationPreviewRoot')).render(<Preview/>);`;
const firebase=`import {emptyNotificationPreferences,changeNotificationPreferences} from '${root}/packages/domain/notification-preferences.ts';
export const db={},auth={currentUser:{uid:'notification-preview-only'}},emulatorMode=false;
let prefs=emptyNotificationPreferences('customer@example.invalid');const operations=new Map();
const view=()=>({...structuredClone(prefs),availability:{email:false,sms:false}});
export async function callService(name,data){
if(name==='purchaseCheckoutSetup')return {regions:[{code:'79',name:'TP. Hồ Chí Minh',communes:[{code:'7901',name:'Phường Bến Thành'}]}],shipping:null,shippingOrigin:'reference',pricing:null};
if(name==='notificationPreferences'){
if(data.action==='read')return view();
if(data.action==='save'){if(operations.has(data.operationId))return view();if(data.expectedVersion!==prefs.version)throw Object.assign(Error('Fixture version conflict'),{code:'functions/aborted'});prefs=changeNotificationPreferences(prefs,prefs.email,data.phone,data.selected,Date.now());operations.set(data.operationId,true);return view();}
}throw Error('PREVIEW_ONLY')}`;
const firestore=`export const doc=(db,...parts)=>({path:parts.join('/')});export const collection=(db,path)=>({path});export const where=()=>({}),limit=()=>({}),query=(...args)=>args[0];export const getDocs=async()=>({docs:[]});export const onSnapshot=(ref,cb)=>{cb(ref.path?.startsWith('users/')?{data:()=>({displayName:'Khách hàng minh họa',businessName:'',marketingConsent:false,version:1})}:{docs:[]});return()=>{}};`;
const plugin={name:'notification-component-fixture',enforce:'pre',resolveId(id){if(/shared\/firebase$/.test(id))return '\0fixtureFirebase';if(id==='firebase/firestore')return '\0fixtureFirestore';if(id==='./cart-store')return '\0fixtureCart';if(/app\/route-modules$/.test(id))return '\0fixtureRoutes';},load(id){if(id==='\0fixtureFirebase')return firebase;if(id==='\0fixtureFirestore')return firestore;if(id==='\0fixtureCart')return 'export const useCart=()=>({cart:{revision:1,items:[{kind:"catalog"}]},loading:false,cached:false,refresh:()=>{}});';if(id==='\0fixtureRoutes')return 'export const preloadNavigation=()=>{};';}};
await fs.writeFile(path.join(tmp,'interactive.tsx'),entry);
await fs.symlink(path.join(root,'node_modules'),path.join(tmp,'node_modules'),'dir').catch(e=>{if(e.code!=='EEXIST')throw e});
const result=await build({configFile:false,root,logLevel:'warn',plugins:[plugin,react()],define:{'process.env.NODE_ENV':'"production"'},build:{write:false,minify:true,lib:{entry:path.join(tmp,'interactive.tsx'),formats:['es'],fileName:()=> 'notification-subscriptions-implementation.js'},rollupOptions:{output:{codeSplitting:false}},cssCodeSplit:false}});
for(const item of (Array.isArray(result)?result[0]:result).output)await fs.writeFile(path.join(root,'docs/previews',item.type==='chunk'?'notification-subscriptions-implementation.js':'notification-subscriptions-implementation.css'),item.type==='chunk'?item.code:item.source);
const {header,footer,styles}=JSON.parse(await fs.readFile('docs/reviews/NOTIFICATION-SUBSCRIPTIONS-20261009/r4-app-shell.json','utf8'));
const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>SatsunicGo · Thông báo</title>${styles}<link rel="stylesheet" href="/docs/previews/notification-subscriptions-implementation.css"><style>.notificationPreviewToolbar{display:flex;align-items:center;gap:8px;padding:6px 24px;font-size:11px;background:#f6f8fb;color:#53627b}.notificationPreviewToolbar span{margin-right:auto}.notificationPreviewToolbar button{border:0;background:transparent;color:inherit;font:inherit;padding:6px}.notificationPreviewToolbar button[aria-pressed=true]{color:#163cff}.notificationPreviewToolbar~[hidden]{display:none!important}</style></head><body>${header}<main id="main"><div id="notificationPreviewRoot"></div></main>${footer}<script type="module" src="/docs/previews/notification-subscriptions-implementation.js"></script></body></html>`;
await fs.writeFile('docs/previews/NOTIFICATION-SUBSCRIPTIONS-20261009.html',html);
console.log('Generated interactive application-component fixture. Firebase/provider I/O replaced; checkout commits disabled.');
