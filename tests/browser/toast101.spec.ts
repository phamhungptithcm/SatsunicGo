import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Real shared feedback, Studio toast and Thread on shared5207; synthetic transport only.
const base = "http://127.0.0.1:5207";
const evidence = "/private/tmp/toast101-browser-evidence";
async function mount(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const source = await (
    await page.request.get(`${base}/src/shared/Toast.tsx`)
  ).text();
  const entry = await (
    await page.request.get(`${base}/src/app/main.tsx`)
  ).text();
  const react = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const root = entry.match(/from "([^"]*\/react-dom_client\.js[^"]*)"/)?.[1];
  const threadSource = await (
    await page.request.get(`${base}/src/features/support/Thread.tsx`)
  ).text();
  const router = threadSource.match(
    /from "([^"]*\/react-router-dom\.js[^"]*)"/,
  )?.[1];
  expect(react && root && router).toBeTruthy();
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "export const auth=null, db=null; export const callService=(...args)=>window.toast101Service(...args);",
    }),
  );
  await page.route("**/toast101-fixture/main.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type;
      window.__vite_plugin_react_preamble_installed__=true;
      const React=(await import(${JSON.stringify(react)})).default;
      const {createRoot}=(await import(${JSON.stringify(root)})).default;
      const {MemoryRouter}=await import(${JSON.stringify(router)});
      await import('/src/styles/global.css');
      await import('/src/features/content/studio/source-design.css');
      const feedback=await import('/src/shared/feedback.ts');
      const {ToastHost}=await import('/src/shared/Toast.tsx');
      const {BlogToast}=await import('/src/features/content/studio/toast.tsx');
      const {Thread}=await import('/src/features/support/Thread.tsx');
      const {AuthFeedbackToast}=await import('/src/features/auth/AuthFeedbackToast.tsx');
      window.toast101Feedback=feedback;
      window.toast101Mode='success'; window.toast101Calls=[]; window.toast101Payloads=[];
      window.toast101Service=async(name,payload)=>{
        window.toast101Calls.push(name);
        if(name==='ticketMessages') return {messages:[]};
        if(name!=='workspaceCommand') throw Error('Unexpected synthetic service');
        window.toast101Payloads.push(JSON.parse(JSON.stringify(payload)));
        if(window.toast101Mode==='denied') throw Object.assign(Error('Synthetic denial'),{code:'functions/permission-denied'});
        if(window.toast101Mode==='deferred') return new Promise(resolve=>window.toast101Resolve=resolve);
        if(window.toast101Mode==='offline') throw Error('Synthetic offline');
        return {};
      };
      function Fixture(){
        const [text,setText]=React.useState(''),[pending,setPending]=React.useState(false),[thread,setThread]=React.useState(true),[authMessage,setAuthMessage]=React.useState(''),[staff,setStaff]=React.useState(false);
        window.toast101SetAuth=(message,isStaff=false)=>{setAuthMessage(message);setStaff(isStaff)};
        return React.createElement(React.Fragment,null,
          React.createElement('main',{id:'baseline',style:{padding:'24px',maxWidth:'900px'}},
            React.createElement('h1',null,'Phản hồi thao tác'),
            React.createElement('button',{id:'trigger',onClick:()=>feedback.notify('Đã lưu hồ sơ.','success')},'Lưu hồ sơ'),
            React.createElement('button',{onClick:()=>feedback.notify('Đã lưu đối soát, chưa gửi lại email.','info')},'Thông tin'),
            React.createElement('button',{onClick:()=>feedback.notify('Chưa sao chép được. Cho phép clipboard hoặc sao chép thủ công.','error')},'Lỗi sao chép'),
            React.createElement('button',{onClick:()=>setText('Đã lưu bản nháp. Bài công khai chưa thay đổi.')},'Studio notice'),
            React.createElement('button',{onClick:()=>setPending(v=>!v)},'Toggle pending'),
            React.createElement('button',{onClick:()=>document.getElementById('test-dialog').showModal()},'Mở hộp thoại'),
            React.createElement('button',{onClick:()=>setThread(false)},'Đóng hội thoại'),
            React.createElement('p',{id:'stable-copy'},'Nội dung cần giữ nguyên vị trí.'),
            thread && React.createElement(Thread,{ticket:{id:'fixture-ticket',version:7,status:'open'},staff:true})),
          React.createElement('dialog',{id:'test-dialog'},
            React.createElement('button',{onClick:()=>feedback.notify('Đã lưu hồ sơ.','success')},'Lưu trong hộp thoại'),
            React.createElement('button',{onClick:()=>document.getElementById('test-dialog').close()},'Đóng hộp thoại')),
          React.createElement(React.StrictMode,null,React.createElement(AuthFeedbackToast,{message:authMessage,staff})),
          React.createElement(ToastHost),
          React.createElement(BlogToast,{text,pending,onClose:()=>setText('')}));
      }
      createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,null,React.createElement(Fixture)));
    `,
    }),
  );
  await page.route("**/toast101-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="vi"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="root"></div><script type="module" src="/toast101-fixture/main.js"></script></body></html>',
    }),
  );
  await page.goto(`${base}/toast101-fixture`);
  await expect(
    page.getByRole("button", { name: "Gửi phản hồi", exact: true }),
  ).toBeEnabled();
  return errors;
}

for (const width of [1440, 390, 320]) {
  test(`toast101 stable layout, focus, localization and replacement at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = await mount(page);
    const before = await page.locator("#stable-copy").boundingBox();
    await page.locator("#trigger").click();
    const toast = page.locator(".siteToast");
    await expect(toast).toHaveCSS("position", "fixed");
    await expect(toast.getByRole("status")).toHaveText("Đã lưu hồ sơ.");
    await expect(page.locator("#trigger")).toBeFocused();
    await expect(page.locator("#stable-copy")).toHaveJSProperty(
      "offsetTop",
      before!.y,
    );
    const close = toast.getByRole("button", { name: "Ẩn thông báo" });
    const size = await close.boundingBox();
    expect(Math.round(size!.width)).toBeGreaterThanOrEqual(44);
    expect(Math.round(size!.height)).toBeGreaterThanOrEqual(44);
    await close.focus();
    await close.press("Enter");
    await expect(toast).toHaveCount(0);
    await expect(page.locator("#trigger")).toBeFocused();
    await page.getByRole("button", { name: "Thông tin", exact: true }).click();
    const copyError = page.getByRole("button", {
      name: "Lỗi sao chép",
      exact: true,
    });
    await copyError.focus();
    await copyError.press("Enter");
    await expect(toast).toHaveCount(1);
    await expect(toast.getByRole("alert")).toContainText("Chưa sao chép được");
    const bounds = await toast.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
      for (const text of document.querySelectorAll<HTMLElement>(".siteToast p"))
        text.style.fontSize = "26px";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await mkdir(evidence, { recursive: true });
    await expect(toast).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: `${evidence}/toast-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("toast101 real Thread acknowledgement emits once; uncertain result retains recovery", async ({
  page,
}) => {
  const errors = await mount(page);
  await page
    .locator('textarea[name="message"]')
    .fill("Xin kiểm tra đơn giúp tôi.");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect(page.locator(".siteToast[data-kind=success]")).toContainText(
    "Đã gửi phản hồi.",
  );
  await expect(
    page
      .locator(".customerWorkspace095-thread")
      .getByText("Đã gửi phản hồi.", { exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".siteToast")
    .getByRole("button", { name: "Ẩn thông báo" })
    .click();
  await page.evaluate(() => {
    (window as unknown as { toast101Mode: string }).toast101Mode = "offline";
  });
  await page
    .locator('textarea[name="message"]')
    .fill("Giữ phản hồi để kiểm tra lại.");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect(
    page.locator(".customerWorkspace095-thread").getByRole("alert"),
  ).toContainText("Chưa xác nhận được kết quả gửi");
  await expect(page.locator(".siteToast")).toHaveCount(0);
  await expect(page.locator('textarea[name="message"]')).toHaveValue(
    "Giữ phản hồi để kiểm tra lại.",
  );
  await page.evaluate(() => {
    (window as unknown as { toast101Mode: string }).toast101Mode = "success";
  });
  await page
    .getByRole("button", { name: "Thử lại phản hồi đang chờ", exact: true })
    .click();
  await expect(page.locator(".siteToast[data-kind=success]")).toContainText(
    "Đã gửi phản hồi.",
  );
  const attempts = await page.evaluate(() =>
    (
      window as unknown as { toast101Payloads: { operationId: string }[] }
    ).toast101Payloads.slice(-2),
  );
  expect(attempts[0].operationId).toBe(attempts[1].operationId);

  expect(errors).toEqual([]);
});

test("toast101 late Thread reply after unmount cannot announce success", async ({
  page,
}) => {
  const errors = await mount(page);
  await page.evaluate(() => {
    (window as unknown as { toast101Mode: string }).toast101Mode = "deferred";
  });
  await page.locator('textarea[name="message"]').fill("Phản hồi đang chờ.");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await page
    .getByRole("button", { name: "Đóng hội thoại", exact: true })
    .click();
  await page.evaluate(() =>
    (
      window as unknown as { toast101Resolve: (value: unknown) => void }
    ).toast101Resolve({}),
  );
  await expect(page.locator(".siteToast")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("toast101 dialog portal stays interactive and returns focus", async ({
  page,
}) => {
  await mount(page);
  await page.getByRole("button", { name: "Mở hộp thoại", exact: true }).click();
  const save = page.getByRole("button", {
    name: "Lưu trong hộp thoại",
    exact: true,
  });
  await save.click();
  await expect(page.locator("dialog[open] .siteToast")).toBeVisible();
  await page
    .locator(".siteToast")
    .getByRole("button", { name: "Ẩn thông báo" })
    .click();
  await expect(save).toBeFocused();
});

test("toast101 Studio pending preserves remaining lifetime instead of resetting", async ({
  page,
}) => {
  await mount(page);
  await page.clock.install();
  await page
    .getByRole("button", { name: "Studio notice", exact: true })
    .click();
  await page.mouse.move(0, 0);
  await expect(page.locator(".blog-toast")).toBeVisible();
  await page.clock.runFor(3000);
  await page
    .getByRole("button", { name: "Toggle pending", exact: true })
    .click();
  await page.clock.runFor(6000);
  await expect(page.locator(".blog-toast")).toBeVisible();
  await page
    .getByRole("button", { name: "Toggle pending", exact: true })
    .click();
  await page.clock.runFor(2100);
  await expect(page.locator(".blog-toast")).toHaveCount(0);
});

test("toast101 shared countdown pauses for hover/focus and replacement gets its own lifetime", async ({
  page,
}) => {
  await mount(page);
  await page.clock.install();
  await page.locator("#trigger").click();
  await page.mouse.move(0, 0);
  await page.clock.runFor(2000);
  await page.locator(".siteToast").hover();
  const close = page
    .locator(".siteToast")
    .getByRole("button", { name: "Ẩn thông báo" });
  await close.focus();
  await page.clock.runFor(6000);
  await page.mouse.move(0, 0);
  await page.clock.runFor(6000);
  await expect(page.locator(".siteToast")).toBeVisible();
  const info = page.getByRole("button", { name: "Thông tin", exact: true });
  await info.focus();
  await info.press("Enter");
  await page.clock.runFor(3100);
  await expect(page.locator(".siteToast")).toContainText("Đã lưu đối soát");
  await page.clock.runFor(2000);
  await expect(page.locator(".siteToast")).toHaveCount(0);
});

test("toast101 Studio dismissal returns keyboard focus with a usable target", async ({
  page,
}) => {
  await mount(page);
  const trigger = page.getByRole("button", {
    name: "Studio notice",
    exact: true,
  });
  await trigger.click();
  const close = page
    .locator(".blog-toast")
    .getByRole("button", { name: "Ẩn thông báo" });
  const size = await close.boundingBox();
  expect(Math.round(size!.width)).toBeGreaterThanOrEqual(44);
  expect(Math.round(size!.height)).toBeGreaterThanOrEqual(44);
  await close.focus();
  await close.press("Enter");
  await expect(page.locator(".blog-toast")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("toast101 login feedback is deduplicated and CRM stays contextual", async ({
  page,
}) => {
  await mount(page);
  await page.evaluate(() =>
    (
      window as unknown as {
        toast101SetAuth: (message: string, staff?: boolean) => void;
      }
    ).toast101SetAuth("Chưa kết nối được Google. Kiểm tra mạng rồi thử lại."),
  );
  await expect(page.locator(".siteToast").getByRole("alert")).toContainText(
    "Kiểm tra mạng",
  );
  const first = await page.evaluate(
    () =>
      (
        window as unknown as {
          toast101Feedback: { noticeSnapshot: () => { id: number } };
        }
      ).toast101Feedback.noticeSnapshot().id,
  );
  await page
    .getByRole("button", { name: "Toggle pending", exact: true })
    .focus();
  await page
    .getByRole("button", { name: "Toggle pending", exact: true })
    .press("Enter");
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            toast101Feedback: { noticeSnapshot: () => { id: number } };
          }
        ).toast101Feedback.noticeSnapshot().id,
    ),
  ).toBe(first);
  await page
    .locator(".siteToast")
    .getByRole("button", { name: "Ẩn thông báo" })
    .click();
  await page.evaluate(() =>
    (
      window as unknown as {
        toast101SetAuth: (message: string, staff?: boolean) => void;
      }
    ).toast101SetAuth("Chưa đăng nhập được. Hãy thử lại.", true),
  );
  await expect(page.locator(".siteToast")).toHaveCount(0);
});

test("toast101 required fields stay contextual and rejected permission cannot report success", async ({
  page,
}) => {
  await mount(page);
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  expect(
    await page
      .locator('textarea[name="message"]')
      .evaluate(
        (element) => (element as HTMLTextAreaElement).validity.valueMissing,
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { toast101Payloads: unknown[] }).toast101Payloads
          .length,
    ),
  ).toBe(0);
  await expect(page.locator(".siteToast")).toHaveCount(0);
  await page.evaluate(() => {
    (window as unknown as { toast101Mode: string }).toast101Mode = "denied";
  });
  await page
    .locator('textarea[name="message"]')
    .fill("Yêu cầu kiểm tra quyền.");
  await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).click();
  await expect(
    page.locator(".customerWorkspace095-thread").getByRole("alert"),
  ).toContainText("Phản hồi chưa được chấp nhận");
  await expect(
    page.getByRole("button", { name: "Tải lại phản hồi", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".siteToast")).toHaveCount(0);
});
