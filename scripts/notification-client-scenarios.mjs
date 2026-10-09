/** Builds a local-only harness for the actual React notification controller. */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs/promises";
const root = process.cwd();
const temp = "/private/tmp/notification-client-hardening";
await fs.mkdir(temp, { recursive: true });
await fs
  .symlink(`${root}/node_modules`, `${temp}/node_modules`, "dir")
  .catch((e) => {
    if (e.code !== "EEXIST") throw e;
  });
const fixture = `import {emptyNotificationPreferences,changeNotificationPreferences} from '${root}/packages/domain/notification-preferences.ts';
export const auth={currentUser:{uid:'client-test-0'}};
export const testState={mode:'ok',calls:[],resolve:null,prefs:emptyNotificationPreferences('test@example.invalid'),operations:new Set()};
const view=()=>({...structuredClone(testState.prefs),availability:{email:false,sms:false}});
export async function callService(name,command){testState.calls.push(structuredClone(command));if(command.action==='read')return view();
if(testState.mode==='deferred'){await new Promise(resolve=>testState.resolve=resolve);}
if(testState.mode==='conflict')throw Object.assign(Error('conflict'),{code:'functions/aborted'});
if(!testState.operations.has(command.operationId)){testState.prefs=changeNotificationPreferences(testState.prefs,testState.prefs.email,command.phone,command.selected,Date.now());testState.operations.add(command.operationId);}
if(testState.mode==='lost-response'){testState.mode='ok';throw Error('network response lost');}return view();}`;
const entry = `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import {useNotificationPreferences} from '${root}/src/features/notifications/use-notification-preferences.ts';
import {emptyNotificationPreferences} from '${root}/packages/domain/notification-preferences.ts';
import {auth,testState} from 'notification-test-fixture';
let controller,changeOwner,ownerIndex=0;
const tick=()=>new Promise(resolve=>setTimeout(resolve,30));
const assert=(yes,message)=>{if(!yes)throw Error(message)};
function Probe({user}){controller=useNotificationPreferences(user,'profile');return <pre>{JSON.stringify({owner:controller.owner,busy:controller.busy,uncertain:controller.uncertain,error:controller.error,selected:controller.selected},null,2)}</pre>}
function App(){const [user,setUser]=useState(auth.currentUser);changeOwner=setUser;const [results,setResults]=useState([]),[busy,setBusy]=useState(false);
async function reset(){testState.mode='ok';testState.calls=[];testState.resolve=null;testState.operations.clear();testState.prefs=emptyNotificationPreferences('test@example.invalid');auth.currentUser={uid:'client-test-'+(++ownerIndex)};changeOwner(auth.currentUser);await tick();await tick();assert(controller.view,'initial read');}
async function select(){controller.setSelected({orderEmail:true,promotionsEmail:true,orderSms:false});await tick();}
async function run(){setBusy(true);const out=[];const check=async(name,fn)=>{await reset();try{await fn();out.push({name,status:'PASSED'})}catch(e){out.push({name,status:'FAILED',reason:e.message})}setResults([...out]);};
await check('Lost save response retries same operation once',async()=>{await select();testState.mode='lost-response';await controller.save();await tick();assert(controller.uncertain,'must retain uncertain operation');await controller.load();await tick();assert(controller.uncertain&&controller.view,'reload cannot discard pending recovery');controller.setSelected({orderEmail:false,promotionsEmail:false,orderSms:false});await tick();assert(controller.selected.orderEmail,'edits must freeze');await controller.save();await tick();const saves=testState.calls.filter(x=>x.action==='save');assert(saves.length===2&&saves[0].operationId===saves[1].operationId,'same operation required');assert(testState.prefs.version===1&&!controller.uncertain&&!controller.busy,'one durable save and recovery');});
await check('Reload during save must not orphan busy state',async()=>{await select();testState.mode='deferred';const pending=controller.save();await tick();await controller.load();testState.resolve();await pending;await tick();assert(!controller.busy&&!controller.uncertain&&controller.view.version===1,'reload invalidated save completion');});
await check('Duplicate clicks send one command',async()=>{await select();testState.mode='deferred';const a=controller.save();const b=controller.save();await tick();assert(testState.calls.filter(x=>x.action==='save').length===1,'duplicate command');testState.resolve();await Promise.all([a,b]);await tick();assert(!controller.busy,'completion');});
await check('Version conflict allows explicit reload',async()=>{await select();testState.mode='conflict';await controller.save();await tick();assert(!controller.uncertain&&!controller.busy&&controller.error,'definitive failure');await controller.load();await tick();assert(controller.view&&!controller.selected.orderEmail,'reload authoritative state');});
await check('Sign out while save in flight hides old owner and ignores late response',async()=>{await select();testState.mode='deferred';const pending=controller.save();await tick();auth.currentUser=null;changeOwner(null);await tick();testState.resolve();await pending;await tick();assert(controller.owner===''&&!controller.view&&!controller.busy,'old account state leaked');});
await check('Invalid SMS never calls mutation endpoint',async()=>{controller.setSelected({orderEmail:false,promotionsEmail:false,orderSms:true});controller.setPhone('123');await tick();await controller.save();await tick();assert(controller.error&&testState.calls.filter(x=>x.action==='save').length===0,'invalid SMS reached backend');});
setBusy(false);}
return <main><h1>Notification controller scenarios</h1><p>Actual React hook; deterministic local service boundary. No Firebase or provider calls.</p><button disabled={busy} onClick={run}>Run scenarios</button><Probe user={user}/><pre id="results">{JSON.stringify(results,null,2)}</pre></main>};createRoot(document.getElementById('root')).render(<App/>);`;
await fs.writeFile(`${temp}/entry.tsx`, entry);
const plugin = {
  name: "notification-client-fixture",
  enforce: "pre",
  resolveId(id) {
    if (/shared\/firebase$/.test(id) || id === "notification-test-fixture")
      return "\0notification-client-fixture";
  },
  load(id) {
    if (id === "\0notification-client-fixture") return fixture;
  },
};
const result = await build({
  configFile: false,
  root,
  logLevel: "warn",
  plugins: [plugin, react()],
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    write: false,
    minify: true,
    lib: { entry: `${temp}/entry.tsx`, formats: ["es"] },
    rollupOptions: { output: { codeSplitting: false } },
  },
});
for (const item of (Array.isArray(result) ? result[0] : result).output)
  if (item.type === "chunk")
    await fs.writeFile(
      "docs/previews/notification-client-scenarios.js",
      item.code,
    );
await fs.writeFile(
  "docs/previews/NOTIFICATION-CLIENT-SCENARIOS-20261009.html",
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Local notification scenarios</title><div id="root"></div><script type="module" src="/docs/previews/notification-client-scenarios.js"></script></html>',
);
