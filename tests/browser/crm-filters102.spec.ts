import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:5207";
test("Customer filter clear preserves explicit apply", async ({ page }) => {
  const source = await (await page.request.get(`${base}/src/features/crm/Workspace.tsx`)).text();
  const entry = await (await page.request.get(`${base}/src/app/main.tsx`)).text();
  const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  expect(react && root).toBeTruthy();
  await page.route("**/src/shared/firebase.ts*", route => route.fulfill({contentType:"text/javascript",body:"export async function callService(name,data){return name==='listCrmStaff'?{rows:[]}:{rows:[],next:null};}"}));
  await page.route("**/filters102-fixture", route => route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script type="module" src="/filters102-fixture.js"></script>' }));
  await page.route("**/filters102-fixture.js", route => route.fulfill({ contentType: "text/javascript", body: `
    import RefreshRuntime from '/@react-refresh';
    RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
    const React=(await import(${JSON.stringify(react)})).default;
    const {createRoot}=(await import(${JSON.stringify(root)})).default;
    const {CrmHeading,CrmHeaderTarget}=await import('/src/features/crm/CrmPresentation.tsx');
    await import('/src/styles/global.css'); await import('/src/features/crm/Workspace.css');
    const {Customers}=await import('/src/features/crm/Customers.tsx');
    function Demo(){return React.createElement('div',{className:'workspaceContent'},React.createElement(Customers,{uid:'fixture-user'}))}
    createRoot(document.getElementById('root')).render(React.createElement(Demo));` }));
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${base}/filters102-fixture`);
    await expect(page.getByRole('button',{name:'Tìm khách hàng',exact:true})).toBeEnabled();
    await page.getByRole('textbox',{name:'Tên khách hàng',exact:true}).fill('Minh');
    await expect(page.getByText(/Bộ lọc đã đổi/)).toBeVisible();
    await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();
    await expect(page.getByRole('textbox',{name:'Tên khách hàng',exact:true})).toHaveValue('');
    await expect(page.getByRole('button',{name:'Xóa bộ lọc',exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
});
