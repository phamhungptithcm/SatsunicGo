import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:5207";
test("CRM header relocates reload, preserves disabled state and public headings", async ({ page }) => {
  const source = await (await page.request.get(`${base}/src/features/crm/Workspace.tsx`)).text();
  const entry = await (await page.request.get(`${base}/src/app/main.tsx`)).text();
  const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  expect(react && root).toBeTruthy();
  await page.route("**/header101-fixture", route => route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script type="module" src="/header101-fixture.js"></script>' }));
  await page.route("**/header101-fixture.js", route => route.fulfill({ contentType: "text/javascript", body: `
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
    const React=(await import(${JSON.stringify(react)})).default;
    const {createRoot}=(await import(${JSON.stringify(root)})).default;
    const {CrmHeading,CrmHeaderTarget}=await import('/src/features/crm/CrmPresentation.tsx');
    await import('/src/styles/global.css'); await import('/src/features/crm/Workspace.css');
    function Demo(){const [target,setTarget]=React.useState(null),[busy,setBusy]=React.useState(false),[count,setCount]=React.useState(0);return React.createElement(React.Fragment,null,
      React.createElement('header',{className:'workspaceTop'},React.createElement('div',{className:'workspaceContext',ref:setTarget})),
      React.createElement(CrmHeaderTarget.Provider,{value:target},React.createElement('section',{id:'crm'},React.createElement(CrmHeading,{title:'Khách hàng',description:'Mô tả lặp',reload:React.createElement('button',{disabled:busy,onClick:()=>{setCount(count+1);setBusy(true)}},'Tải lại'),actions:React.createElement('button',null,'Tạo khách hàng')}))),
      React.createElement('output',null,count),React.createElement('section',{id:'public'},React.createElement(CrmHeading,{title:'Hóa đơn',description:'Xem hóa đơn',reload:React.createElement('button',null,'Tải lại')})))}
    createRoot(document.getElementById('root')).render(React.createElement(Demo));` }));
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${base}/header101-fixture`);
    await expect(page.locator('header h1')).toHaveText('Khách hàng');
    await expect(page.locator('#crm h1')).toHaveCount(0);
    await expect(page.getByText('Mô tả lặp')).toHaveCount(0);
    await expect(page.getByRole('button', {name:'Tạo khách hàng'})).toBeVisible();
    const reload=page.getByRole('button',{name:'Tải lại khách hàng',exact:true});
    await reload.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('output')).toHaveText('1'); await expect(reload).toBeDisabled();
    await expect(page.locator('#public h1')).toHaveText('Hóa đơn');
    await expect(page.locator('#public')).toContainText('Xem hóa đơn');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
});
