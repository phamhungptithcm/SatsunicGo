import { test, expect, type Page } from "@playwright/test";

async function fixture(page: Page, mode: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("close", () => expect(errors).toEqual([]));
  const src = await (
    await page.request.get("/src/features/payments/Finance.tsx")
  ).text();
  const entry = await (await page.request.get("/src/app/main.tsx")).text();
  const react = src.match(/from "([^" ]*\/react\.js[^" ]*)"/)![1];
  const root = entry.match(/from "([^" ]*react-dom_client[^" ]*)"/)![1];
  const commands: Record<string, unknown>[] = [];
  await page.route("**/finance112-command", async (route) => {
    commands.push(route.request().postDataJSON());
    if (mode === "retry" && commands.length === 1) {
      await route.fulfill({ status: 503, body: "unknown" });
    } else await route.fulfill({ body: "ok" });
  });
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export async function callService(name,data){
      if(name==='listWork'){
        if('${mode}'==='error')throw {code:'functions/unavailable'};
        if('${mode}'==='denied')throw {code:'functions/permission-denied'};
        const rows='${mode}'==='empty'?[]:data.kind==='transferReviews'?[{id:'synthetic-transfer112',orderId:'synthetic-order112',amount:250000,reference:'SYNTHETIC-112-'+('long-reference-'.repeat(8)),status:'pending'}]:data.kind==='membershipInvoices'?[{id:'synthetic-invoice112',ownerId:'synthetic-owner112',amount:99000,state:'pending',planSnapshot:{name:'Gói thử nghiệm'}}]:[{id:'synthetic-exception112',amount:120000,state:'open',reason:'Synthetic unmatched',inboundVerified:false}];
        return {rows,next:null};
      }
      if(name==='orderHistory')return {order:{version:7}};
      return {};
    }
    export async function sendCommand(name,payload,orderId,expectedVersion,operationId){
      const result=await fetch('/finance112-command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,payload,orderId,expectedVersion,operationId})});
      if(!result.ok)throw {code:'functions/unavailable'};
      return {};
    }`,
    }),
  );
  await page.route("**/finance112-fixture*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<meta name="viewport" content="width=device-width,initial-scale=1"><div class="workspaceShell" style="display:block"><header class="workspaceTop"><div class="workspaceContext" id="heading"></div></header><main class="workspaceContent"><div id="root"></div></main></div><script type="module">import '/src/styles/global.css';import '/src/features/crm/Workspace.css';import '/src/features/crm/crm-ux028.css';import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import React from '${react}';import ReactDOM from '${root}';const {Finance}=await import('/src/features/payments/Finance.tsx');const {CrmHeaderTarget}=await import('/src/features/crm/CrmPresentation.tsx');ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(CrmHeaderTarget.Provider,{value:document.getElementById('heading')},React.createElement(Finance)));</script>`,
    }),
  );
  await page.goto(`/finance112-fixture?${mode}`);
  return commands;
}

for (const width of [390, 768, 1440]) {
  test(`Finance112 workflow, drafts and layout at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const commands = await fixture(page, "records");
    const transfer = page.getByRole("tab", {
      name: "Chuyển khoản",
      exact: true,
    });
    await expect(transfer).toBeEnabled();
    const panel = page.locator("#finance-panel-transferReviews");
    await expect(panel.getByText("250.000 ₫", { exact: true })).toBeVisible();
    expect(
      await panel
        .locator("summary")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(44);
    await panel.locator("summary").click();
    await panel
      .getByLabel("Mã giao dịch trên tài khoản ngân hàng doanh nghiệp")
      .fill("synthetic-bank112");
    await page
      .getByRole("tab", { name: "Hóa đơn thành viên", exact: true })
      .click();
    await expect(
      page.getByText("Tiền gói thành viên chỉ phân bổ", { exact: false }),
    ).toBeVisible();
    await transfer.click();
    await expect(
      panel.getByLabel("Mã giao dịch trên tài khoản ngân hàng doanh nghiệp"),
    ).toHaveValue("synthetic-bank112");
    // Manual arrow activation keeps the current queue until Enter.
    await transfer.focus();
    await page.keyboard.press("ArrowRight");
    await expect(transfer).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("tab", { name: "Hóa đơn thành viên" }),
    ).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: "Ngoại lệ", exact: true }).click();
    const exception = page.locator("#finance-panel-paymentExceptions");
    await exception.locator("summary").click();
    await expect(exception.getByLabel("Mã đơn", { exact: true })).toHaveCount(
      0,
    );
    await expect(
      exception.getByRole("option", {
        name: "Phân bổ tiền đã đối soát vào đơn",
      }),
    ).toHaveCount(0);
    await exception
      .getByRole("button", { name: "Tiếp tục →", exact: true })
      .click();
    await exception
      .getByLabel("Lý do", { exact: false })
      .fill("Synthetic checked exception112");
    await exception
      .getByLabel("Bằng chứng đã đối soát", { exact: false })
      .fill("Synthetic bank evidence112");
    await exception
      .getByRole("button", { name: "Tiếp tục →", exact: true })
      .click();
    await expect(
      exception.getByText(
        "Đóng ngoại lệ chỉ lưu kết quả kiểm tra, không ghi thêm tiền.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      exception.getByRole("button", { name: "Đóng ngoại lệ đã kiểm tra" }),
    ).toBeVisible();
    expect(commands).toHaveLength(0);
    await page.locator("main").evaluate((el) => {
      el.style.fontSize = "125%";
    });
    expect(
      await page
        .locator("main")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `docs/reviews/FINANCE112/exception-${width}.png`,
      fullPage: true,
    });
    await transfer.click();
    await page.screenshot({
      path: `docs/reviews/FINANCE112/transfer-${width}.png`,
      fullPage: true,
    });
  });
}

test("Finance112 empty queue retains useful navigation and secondary reversal", async ({
  page,
}) => {
  await fixture(page, "empty");
  await expect(
    page.getByText("Chưa có thông báo chờ đối soát trong trang này."),
  ).toBeVisible();
  await expect(
    page.getByRole("tab", { name: "Hóa đơn thành viên" }),
  ).toBeEnabled();
  await expect(page.locator(".financeSecondary summary")).toBeVisible();
  await page.screenshot({
    path: "docs/reviews/FINANCE112/empty-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator("main")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: "docs/reviews/FINANCE112/empty-mobile.png",
    fullPage: true,
  });
});

for (const mode of ["error", "denied"])
  test(`Finance112 ${mode} does not claim an empty or successful queue`, async ({
    page,
  }) => {
    const commands = await fixture(page, mode);
    await expect(
      page.getByText(
        mode === "error"
          ? "Chưa tải được hàng đợi tài chính. Dữ liệu đang hiển thị chưa được cập nhật."
          : "Cần kiểm tra lại quyền truy cập.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Chưa có thông báo chờ đối soát trong trang này."),
    ).toHaveCount(0);
    expect(commands).toHaveLength(0);
  });

test("Finance112 uncertain transfer locks queues and retries exact command", async ({
  page,
}) => {
  const commands = await fixture(page, "retry");
  const panel = page.locator("#finance-panel-transferReviews");
  await panel.locator("summary").click();
  await panel
    .getByLabel("Mã giao dịch trên tài khoản ngân hàng doanh nghiệp")
    .fill("synthetic-bank112");
  await panel
    .getByLabel("Bằng chứng đã đối chiếu đúng tài khoản, đơn và số tiền")
    .fill("Synthetic bank evidence112");
  await panel
    .getByRole("button", {
      name: "Xác nhận tiền vào và đóng thông báo này",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("tab", { name: "Ngoại lệ", exact: true }),
  ).toBeDisabled();
  await expect(
    panel.getByText(
      "Chưa xác nhận được kết quả. Thử lại đúng thao tác và bằng chứng đã gửi.",
    ),
  ).toBeVisible();
  await panel
    .getByRole("button", { name: "Thử lại thao tác đang chờ" })
    .click();
  await expect(
    panel.getByText("Đã xác nhận tiền vào và đóng thông báo."),
  ).toBeVisible();
  expect(commands).toHaveLength(2);
  expect(commands[1]).toEqual(commands[0]);
  expect(commands[0]).toMatchObject({
    name: "verifyTransfer",
    orderId: "synthetic-order112",
    expectedVersion: 7,
    payload: {
      amount: 250000,
      bankTransactionId: "synthetic-bank112",
      reviewId: "synthetic-transfer112",
    },
  });
});
