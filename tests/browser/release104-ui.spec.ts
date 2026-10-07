import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:5207";
const paths = [
  "documents",
  "orders",
  "purchasing",
  "warehouse",
  "returns",
  "shipping",
  "changes",
  "refunds",
  "finance",
  "customers",
  "follow-ups",
  "support",
  "content",
  "campaigns",
  "membership",
  "staff",
  "activity",
  "shipping-rates",
  "settings",
];
for (const width of [1440, 390])
  test(`release104 CRM read-only shell and account menu ${width}`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const source = await (
      await page.request.get(`${base}/src/features/crm/Workspace.tsx`)
    ).text();
    const entry = await (
      await page.request.get(`${base}/src/app/main.tsx`)
    ).text();
    const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
    const router = source.match(
      /from "([^"]*\/react-router-dom\.js[^"]*)"/,
    )?.[1];
    const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
    expect(react && router && root).toBeTruthy();
    await page.route("**/src/shared/firebase.ts*", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `
    export const db=null,auth=null,configured=true,emulatorMode=false,betaRelease=false,app=null,functions=null;
    export async function login(){throw Error('Fixture cannot log in')}; export async function logout(){};
    export async function sendCommand(){throw Error('Fixture blocks writes')};
    export async function callService(name,data){
      window.reads=(window.reads||[]).concat(name);
      if(/Command|save|financeReview|verifyTransfer/i.test(name))throw Error('Fixture blocks writes');
      if(window.mode==='error')throw Object.assign(Error('Synthetic unavailable'),{code:'functions/unavailable'});
      if(name==='readOwnerConfiguration')return {pricing:null};
      if(name==='membershipReminderRead')return {enabled:false,days:7};
      return {rows:[],items:[],next:null,documents:[],plans:[],config:null,settings:null,messages:[],approved:false,daysBeforeExpiry:null,asOf:Date.now()};
    }`,
      }),
    );
    await page.route("**/release104-fixture", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="root"></div><script type="module" src="/release104-fixture.js"></script>',
      }),
    );
    await page.route("**/release104-fixture.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `
    import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
    const React=(await import(${JSON.stringify(react)})).default;
    const {MemoryRouter,Routes,Route}=await import(${JSON.stringify(router)});
    const {createRoot}=(await import(${JSON.stringify(root)})).default;
    await import('/src/styles/global.css');await import('/src/styles/public-ux.css');
    const {Workspace}=await import('/src/features/crm/Workspace.tsx');
    const {ToastHost}=await import('/src/shared/Toast.tsx');
    const user={uid:'synthetic104',displayName:'Nhân viên kiểm thử',email:'fixture@example.test',photoURL:null,providerData:[]};
    class Boundary extends React.Component{constructor(props){super(props);this.state={error:''}}static getDerivedStateFromError(e){return {error:e.message}}render(){return this.state.error?React.createElement('pre',null,'APP ERROR '+this.state.error):this.props.children}}
    const root=createRoot(document.getElementById('root'));
    window.mount=(path,mode)=>{window.mode=mode;window.reads=[];root.render(React.createElement(MemoryRouter,{key:path+mode,initialEntries:['/crm/'+path]},React.createElement(Boundary,null,React.createElement(Routes,null,React.createElement(Route,{path:'/crm/*',element:React.createElement(Workspace,{roles:['OWNER'],uid:user.uid,user,name:user.displayName,signOut:async()=>{window.didSignOut=true},busy:false})}))),React.createElement(ToastHost)))};
    window.mount('customers','empty');`,
      }),
    );
    await page.goto(`${base}/release104-fixture`);
    await expect(
      page.getByRole("button", { name: "Tài khoản của Nhân viên kiểm thử" }),
    ).toBeVisible();
    const trigger = page.getByRole("button", {
      name: "Tài khoản của Nhân viên kiểm thử",
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("navigation", { name: "Chức năng tài khoản" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Chức năng tài khoản" })
        .getByRole("link", { name: "Bảo mật tài khoản" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      await page.evaluate(async (path) => {
        try {
          await import(path);
          return "ok";
        } catch (e) {
          return String(e);
        }
      }, "/src/features/content/ContentEditor.tsx"),
    ).toBe("ok");
    for (const mode of ["empty", "error"])
      for (const path of paths) {
        await page.evaluate(
          ({ path, mode }) =>
            (
              window as unknown as { mount: (p: string, m: string) => void }
            ).mount(path, mode),
          { path, mode },
        );
        await expect(page.locator(".workspaceContent")).toBeVisible();
        await expect
          .poll(() => page.locator(".workspaceContent").innerText(), {
            timeout: 20000,
            message: path + " " + mode + " " + errors.join(";"),
          })
          .not.toContain("Đang mở công việc");
        await page.waitForTimeout(100);
        await expect(page.locator(".workspaceContent")).not.toContainText(
          "Không thể mở công việc này",
        );
        await expect(page.locator("body")).not.toContainText("APP ERROR");
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${path} ${mode} overflow`,
        ).toBeTruthy();
        await page.screenshot({
          path: `/private/tmp/release104-ui/${path}-${mode}-${width}.png`,
          fullPage: true,
        });
      }
    expect(errors).toEqual([]);
  });
