const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:5207';
 const source=await(await page.request.get(base+'/src/features/crm/Workspace.tsx')).text();const main=await(await page.request.get(base+'/src/app/main.tsx')).text();
 const react=source.match(/from "([^\"]*\/react\.js[^\"]*)"/)[1],router=source.match(/from "([^\"]*\/react-router-dom\.js[^\"]*)"/)[1],root=main.match(/from "([^\"]*\/react-dom_client\.js[^\"]*)"/)[1];
 // Shared Vite cache returns 504 for the optimized ExcelJS URL. Use the installed
 // real ExcelJS browser bundle only as a disclosed fixture dependency proxy.
 await page.route('**/node_modules/.vite/deps/exceljs.js*',r=>r.fulfill({contentType:'text/javascript',body:'var module={exports:{}};var exports=module.exports;\n'+fs.readFileSync('node_modules/exceljs/dist/exceljs.min.js','utf8')+'\nexport const Workbook=module.exports.Workbook;export default module.exports;'}));
 await page.route('**/src/shared/firebase.ts*',r=>r.fulfill({contentType:'text/javascript',body:`
 export const db=null,auth=null,configured=true,emulatorMode=false,betaRelease=false,app=null,functions=null;
 export async function login(){throw Error('fixture')};export async function logout(){};export async function sendCommand(){throw Error('fixture blocks writes')};
 export async function callService(name,data){
 if(/Command|save/i.test(name))throw Error('fixture blocks writes');
 if(name!=='listWork'||data?.kind!=='products')return {rows:[],items:[],next:null};
 window.reads.push(data.after||'first');
 await new Promise(r=>setTimeout(r,window.mode==='slow'?400:40));
 if(window.mode==='empty')return {rows:[],next:null};
 if(window.mode==='initialError'||(window.mode==='error'&&data.after&&!window.recovered))throw Error('Synthetic unavailable');
 const start=data.after?30:0,count=data.after?10:30;
 const rows=Array.from({length:count},(_,i)=>({id:'p'+(start+i),title:'Sản phẩm '+(start+i)+' — Tên dài để kiểm tra hiển thị và cuộn danh sách',brand:'Thương hiệu kiểm thử',slug:'product-'+(start+i),category:'Chăm sóc da',status:'published',referencePrice:100000,version:1}));
 if(data.after)rows.unshift({id:'p0',title:'Sản phẩm 0 cập nhật',brand:'Kiểm thử',category:'Chăm sóc da',status:'published',version:2});
 return {rows,next:window.mode==='repeat'?(data.after||'p29'):(data.after?null:'p29')};
 }`}));
 await page.route('**/products112-fixture',r=>r.fulfill({contentType:'text/html',body:'<div id="root"></div><script type="module" src="/products112-fixture.js"></script>'}));
 await page.route('**/products112-fixture.js',r=>r.fulfill({contentType:'text/javascript',body:`
 import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
 const React=(await import(${JSON.stringify(react)})).default;const {MemoryRouter,Routes,Route}=await import(${JSON.stringify(router)});const {createRoot}=(await import(${JSON.stringify(root)})).default;
 await import('/src/styles/global.css');await import('/src/styles/public-ux.css');
 const {Workspace}=await import('/src/features/crm/Workspace.tsx');const {ToastHost}=await import('/src/shared/Toast.tsx');
 const root=createRoot(document.getElementById('root'));let epoch=0;
 window.mount=(mode)=>{window.mode=mode;window.reads=[];window.recovered=false;root.render(React.createElement(MemoryRouter,{key:++epoch,initialEntries:['/crm/content']},React.createElement(Routes,null,React.createElement(Route,{path:'/crm/*',element:React.createElement(Workspace,{roles:['OWNER'],uid:'fixture112',user:{uid:'fixture112',displayName:'Kiểm thử',email:'fixture@example.test',providerData:[]},name:'Kiểm thử',signOut:async()=>{},busy:false})})),React.createElement(ToastHost)))};window.mount('normal');`}));
 await page.goto(base+'/products112-fixture');const rows=page.locator('.ceTable tbody tr');await rows.first().waitFor().catch(async e=>{console.log('PAGE DEBUG',await page.locator('body').innerText(),JSON.stringify(errors));throw e});assert.equal(await rows.count(),30);
 assert.equal(await page.getByRole('combobox',{name:'Loại nội dung'}).count(),0);
 assert.equal(await page.locator('.workspaceTop').getByRole('button',{name:'Tải lại sản phẩm'}).count(),1);
 assert.equal(await page.locator('.ceExport').getByRole('button').first().innerText(),'Thêm sản phẩm');
 assert.equal(await page.getByRole('link',{name:'Sản phẩm & bài viết',exact:true}).count(),0);
 await page.screenshot({path:'output/playwright/products112/desktop.png'});
 await rows.first().getByRole('checkbox').check();await page.getByRole('combobox',{name:'Phạm vi xuất'}).selectOption('selected');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất dữ liệu',exact:true}).click();const download=await downloadPromise.catch(async e=>{console.log('EXPORT DEBUG',await page.locator('.ceSpreadsheet').innerText(),JSON.stringify(errors));throw e});assert.match(download.suggestedFilename(),/\.xlsx$/);await download.saveAs('output/playwright/products112/selected.xlsx');await page.getByRole('combobox',{name:'Phạm vi xuất'}).selectOption('filtered');
 await page.getByRole('button',{name:'Nhập Excel',exact:true}).click();await page.getByRole('dialog',{name:'Nhập sản phẩm'}).waitFor();await page.getByRole('button',{name:'Đóng nhập sản phẩm'}).click();

 await page.locator('.ceListFooter').scrollIntoViewIfNeeded();await page.waitForFunction(()=>window.reads.length===2);await page.waitForFunction(()=>document.querySelectorAll('.ceTable tbody tr').length===40);await page.waitForTimeout(200);assert.equal(await rows.count(),40);assert.deepEqual(await page.evaluate(()=>window.reads),['first','p29']);
 const results=['selected XLSX download and import dialog','desktop navbar/create-first/product-only','automatic cursor append, ID deduplication, terminal stop'];
 async function mount(mode){await page.evaluate(mode=>window.mount(mode),mode);await page.waitForFunction(()=>window.reads.length===1);await rows.first().waitFor();await page.waitForTimeout(70);}
 await mount('error');await page.locator('.ceListFooter').scrollIntoViewIfNeeded();await page.getByRole('alert').filter({hasText:'Không tải được sản phẩm'}).waitFor();assert.equal(await rows.count(),30);await page.waitForTimeout(400);assert.equal((await page.evaluate(()=>window.reads)).length,2);await page.evaluate(()=>window.recovered=true);await page.getByRole('button',{name:'Thử lại',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ceTable tbody tr').length===40);results.push('append failure preserves rows, no retry loop, manual retry succeeds');
 await mount('repeat');await page.locator('.ceListFooter').scrollIntoViewIfNeeded();await page.getByRole('alert').filter({hasText:'Không thể tải tiếp'}).waitFor();await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>window.reads)).length,2);results.push('repeated cursor stops automatic requests');
 await mount('normal');await page.getByRole('searchbox',{name:'Tìm sản phẩm'}).fill('không có kết quả');await page.locator('.ceListFooter').scrollIntoViewIfNeeded();await page.waitForTimeout(350);assert.equal((await page.evaluate(()=>window.reads)).length,1);await page.getByRole('button',{name:'Tải thêm',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.reads.length===2);results.push('loaded-only filter prevents eager full scan, keyboard fallback works');
 await mount('slow');await page.locator('.ceListFooter').scrollIntoViewIfNeeded();await page.waitForFunction(()=>window.reads.length===2);await page.getByRole('button',{name:'Thêm sản phẩm',exact:true}).click();await page.waitForTimeout(500);assert.equal((await page.evaluate(()=>window.reads)).length,2);assert.equal(await page.getByRole('combobox',{name:'Loại nội dung'}).count(),0);await page.getByRole('button',{name:'Xem danh sách',exact:true}).click();await rows.first().waitFor();results.push('editor entry disconnects observer; late read does not alter form');
 await page.setViewportSize({width:390,height:844});await mount('normal');await page.screenshot({path:'output/playwright/products112/mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.getByRole('button',{name:'Thêm sản phẩm',exact:true}).focus();assert.equal(await page.getByRole('button',{name:'Thêm sản phẩm',exact:true}).evaluate(el=>el===document.activeElement),true);assert.ok(await page.getByRole('combobox',{name:'Phạm vi xuất'}).evaluate(el=>el.getBoundingClientRect().width>=200));assert.ok(await page.getByRole('combobox',{name:'Định dạng xuất'}).evaluate(el=>el.getBoundingClientRect().width>=70));results.push('390px mobile layout, readable selects and keyboard focus');
 await page.setViewportSize({width:768,height:900});await page.emulateMedia({reducedMotion:'reduce'});await mount('normal');await page.screenshot({path:'output/playwright/products112/tablet.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);results.push('768px tablet and reduced motion');
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>window.mount('empty'));await page.getByText('Chưa có sản phẩm. Thêm sản phẩm hoặc nhập Excel để bắt đầu.',{exact:true}).waitFor();results.push('empty state');
 await page.evaluate(()=>window.mount('initialError'));await page.getByRole('button',{name:'Thử lại',exact:true}).waitFor();await page.evaluate(()=>window.mode='normal');await page.getByRole('button',{name:'Thử lại',exact:true}).click();await rows.first().waitFor();results.push('initial failure and retry');
 await page.evaluate(()=>{window.savedObserver=window.IntersectionObserver;window.IntersectionObserver=undefined});await mount('normal');await page.locator('.ceListFooter').scrollIntoViewIfNeeded();await page.waitForTimeout(150);assert.equal((await page.evaluate(()=>window.reads)).length,1);await page.getByRole('button',{name:'Tải thêm',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.ceTable tbody tr').length===40);results.push('IntersectionObserver unavailable: manual fallback');await page.evaluate(()=>window.IntersectionObserver=window.savedObserver);
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/reviews/PRODUCTS112/BROWSER-EVIDENCE.json',JSON.stringify({status:'PASSED',environment:'Synthetic browser fixture using actual Workspace and ContentEditor on shared 5207; backend writes blocked; no provider/authenticated production proof',checks:results,pageErrors:errors,dependencyProxy:'Installed real ExcelJS UMD bundle supplied by browser fixture; shared Vite optimized URL returns HTTP 504 Outdated Optimize Dep. Live XLSX loading remains BLOCKED.'},null,2));console.log(JSON.stringify({status:'PASSED',checks:results,pageErrors:errors,dependencyProxy:'Installed real ExcelJS UMD bundle supplied by browser fixture; shared Vite optimized URL returns HTTP 504 Outdated Optimize Dep. Live XLSX loading remains BLOCKED.'},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
