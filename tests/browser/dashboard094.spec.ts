import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Real Dashboard and shared CSS on the existing server; transport is synthetic.
// No emulator records, staff identities or shared settings are changed.
const baseURL = "http://127.0.0.1:5207";
const evidence =
  process.env.DASHBOARD094_EVIDENCE ?? "/private/tmp/dashboard094-evidence";
type Mode =
  | "success"
  | "zero"
  | "partial"
  | "denied"
  | "offline"
  | "malformed"
  | "deferred";
async function mount(page: Page, mode: Mode = "success") {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      // Route-fulfilled fixture pages have no local-network grant for Vite HMR.
      // Capture/report this known dev-only failure; never suppress app errors.
      if (
        /^WebSocket connection to 'ws:\/\/127\.0\.0\.1:5207\//.test(text) ||
        text.startsWith("[vite] failed to connect to websocket.") ||
        text.startsWith("Failed to send error to Vite server:")
      )
        return;
      errors.push(text);
    }
  });
  const source = await (
    await page.request.get(`${baseURL}/src/features/crm/Dashboard.tsx`)
  ).text();
  const entry = await (
    await page.request.get(`${baseURL}/src/app/main.tsx`)
  ).text();
  const reactPath = source.match(/from "([^"]*\/react\.js[^"]*)"/)?.[1];
  const routerPath = source.match(
    /from "([^"]*\/react-router-dom\.js[^"]*)"/,
  )?.[1];
  const rootPath = entry.match(
    /from "([^"]*\/react-dom_client\.js[^"]*)"/,
  )?.[1];
  expect(reactPath && routerPath && rootPath).toBeTruthy();
  await page.route("**/src/shared/firebase.ts*", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `export const callService = (...args) => window.dashboard094Call(...args);`,
    }),
  );
  await page.route("**/dashboard094-fixture/main.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      const React = (await import(${JSON.stringify(reactPath)})).default;
      const { MemoryRouter } = await import(${JSON.stringify(routerPath)});
      const { createRoot } = (await import(${JSON.stringify(rootPath)})).default;
      await import('/src/styles/global.css');
      await import('/src/styles/public-ux.css');
      await import('/src/features/crm/Workspace.css');
      await import('/src/features/crm/crm-ux028.css');
      window.dashboard094Mode = ${JSON.stringify(mode)};
      window.dashboard094Calls = [];
      window.dashboard094Pending = [];
      window.dashboard094Call = async (name, range) => {
        if (name !== 'operationalDashboard') throw Error('Unexpected write');
        window.dashboard094Calls.push(range);
        const response = {
          ...range, observedAt: Date.now(), truncated: [],
          counts: { requests: 24, quotes: 16, purchasing: 9, ready: 6, exceptions: 2, transfers: 5, holds: 3, balance: 8, tickets: 12 }
        };
        const mode = window.dashboard094Mode;
        if (mode === 'denied') throw Object.assign(Error('Synthetic denial'), { code: 'functions/permission-denied' });
        if (mode === 'offline') throw Error('Synthetic offline');
        if (mode === 'malformed') return { ...response, from: 1 };
        if (mode === 'zero') Object.keys(response.counts).forEach(key => response.counts[key] = 0);
        if (mode === 'partial') { delete response.counts.quotes; response.counts.requests = 100; response.truncated = ['orders']; }
        if (mode === 'deferred') return new Promise(resolve => window.dashboard094Pending.push({ range, response, resolve }));
        return response;
      };
      const { Dashboard } = await import('/src/features/crm/Dashboard.tsx');
      const { ToastHost } = await import('/src/shared/Toast.tsx');
      const root = createRoot(document.getElementById('root'));
      window.dashboard094Unmount = () => root.unmount();
      root.render(React.createElement(MemoryRouter, null,
        React.createElement('div', { className: 'workspaceShell', style: { gridTemplateColumns: '1fr', minHeight: '100vh' } },
          React.createElement('main', { className: 'workspaceMain' },
            React.createElement('div', { className: 'workspaceContent' }, React.createElement(Dashboard)))), React.createElement(ToastHost)));
    `,
    }),
  );
  await page.route("**/dashboard094-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dashboard 094 · Component QA</title></head><body><div id="root"></div><script type="module" src="/dashboard094-fixture/main.js"></script></body></html>',
    }),
  );
  await page.goto(`${baseURL}/dashboard094-fixture`);
  await expect(
    page.getByRole("region", { name: "Tổng quan vận hành", exact: true }),
  ).toBeVisible();
  return errors;
}
const setMode = (page: Page, mode: Mode) =>
  page.evaluate((next) => {
    (window as unknown as { dashboard094Mode: Mode }).dashboard094Mode = next;
  }, mode);

for (const width of [1440, 390, 320]) {
  test(`D094 meaningful auto-load, presets, custom range and accessible layout at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = await mount(page);
    expect(page.url()).toBe(`${baseURL}/dashboard094-fixture`);
    expect(await page.title()).toContain("Dashboard 094");
    await expect(page.locator(".d94KpiValue").first()).toHaveText("24đơn");
    const trackWidth = await page
      .locator(".d94Track")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    const barWidth = await page
      .locator(".d94Bar")
      .first()
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.abs(trackWidth - barWidth)).toBeLessThan(1);
    await expect(
      page.getByRole("button", { name: "7 ngày", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "30 ngày", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "30 ngày", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".d94Status")).toContainText("Đọc lúc");
    await page.getByRole("button", { name: "Tùy chọn", exact: true }).click();
    await expect(page.locator(".d94Toolbar #d94CustomPeriod")).toHaveCount(1);
    if (width === 1440) {
      const bottoms = await page
        .locator(".d94Custom input, .d94Custom button")
        .evaluateAll((elements) =>
          elements.map((el) => el.getBoundingClientRect().bottom),
        );
      expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(3);
    }
    await mkdir(evidence, { recursive: true });
    await page.screenshot({
      path: `${evidence}/filter-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("textbox", { name: "Từ ngày (UTC)", exact: true })
      .fill("2026-01-01");
    await page
      .getByRole("textbox", { name: "Đến ngày (UTC)", exact: true })
      .fill("2026-02-02");
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("tối đa 31 ngày");
    await page
      .getByRole("textbox", { name: "Từ ngày (UTC)", exact: true })
      .fill("2026-01-01");
    await page
      .getByRole("textbox", { name: "Đến ngày (UTC)", exact: true })
      .fill("2026-01-07");
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await expect(page.locator(".d94Context")).toContainText(
      "01/01/2026 – 07/01/2026",
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Áp dụng", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(".d94Kpi").first()).toBeFocused();
    await page.getByRole("button", { name: "7 ngày", exact: true }).click();
    await expect(page.locator(".d94Status")).toContainText("Đọc lúc");
    await expect(page.locator(".d94Kpi").first()).toHaveAttribute(
      "href",
      "/crm/orders?queue=requests",
    );
    expect(await page.locator("vite-error-overlay").count()).toBe(0);
    await mkdir(evidence, { recursive: true });
    await page.screenshot({
      path: `${evidence}/desktop-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("D094 unavailable, genuine zero and partial coverage remain distinct", async ({
  page,
}) => {
  await mount(page, "deferred");
  await expect(page.locator(".d94KpiValue").first()).toHaveText("—đơn");
  await expect(
    page.getByRole("button", { name: "Đang tải số liệu…" }),
  ).toBeDisabled();
  await page.evaluate(() => {
    const state = window as unknown as {
      dashboard094Pending: {
        response: { counts: Record<string, number> };
        resolve: (value: unknown) => void;
      }[];
    };
    const pending = state.dashboard094Pending[0];
    for (const key of Object.keys(pending.response.counts))
      pending.response.counts[key] = 0;
    pending.resolve(pending.response);
  });
  await expect(page.locator(".siteToast[data-kind=info]")).toContainText(
    "Không có việc cần xử lý trong mẫu đã đọc",
  );
  await expect(page.locator(".siteToast")).toHaveCSS("position", "fixed");
  await expect(page.locator(".d94Zero")).toHaveCount(0);
  await page.getByRole("button", { name: "Ẩn thông báo" }).click();
  await page.screenshot({ path: `${evidence}/zero.png`, fullPage: true });
  await expect(page.locator(".d94KpiValue").first()).toHaveText("0đơn");
  await setMode(page, "partial");
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(
    page.getByText("Số liệu chưa đầy đủ", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".d94KpiValue").nth(1)).toHaveText("—đơn");
  await expect(page.locator(".d94Zero")).toHaveCount(0);
  await expect(page.locator(".siteToast")).toHaveCount(0);
  await page.screenshot({ path: `${evidence}/partial.png`, fullPage: true });
  await page.getByText("Phạm vi và cách đọc số liệu", { exact: true }).click();
  await expect(page.getByText(/Không cộng các số đếm/)).toBeVisible();
  await setMode(page, "deferred");
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await page.evaluate(() => {
    const state = window as unknown as {
      dashboard094Pending: {
        response: { counts: Record<string, number>; truncated: string[] };
        resolve: (value: unknown) => void;
      }[];
    };
    const pending = state.dashboard094Pending.at(-1)!;
    for (const key of Object.keys(pending.response.counts))
      pending.response.counts[key] = 0;
    pending.response.truncated = ["orders"];
    pending.resolve(pending.response);
  });
  await expect(page.locator(".d94KpiValue").first()).toHaveText("0đơn");
  await expect(page.locator(".d94Zero")).toHaveCount(0);
});

test("D094 retry keeps stale scope honest and permission denial clears private counts", async ({
  page,
}) => {
  await mount(page);
  await expect(page.locator(".d94KpiValue").first()).toHaveText("24đơn");
  await setMode(page, "offline");
  await page.getByRole("button", { name: "30 ngày", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Chưa tải được số liệu");
  await expect(page.locator(".d94Status--stale")).toContainText(
    "lần đọc trước",
  );
  await expect(page.locator(".d94KpiValue").first()).toHaveText("24đơn");
  await setMode(page, "success");
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await setMode(page, "malformed");
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Số liệu trả về chưa hợp lệ",
  );
  await setMode(page, "denied");
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Chưa có quyền");
  await expect(page.locator(".d94KpiValue").first()).toHaveText("—đơn");
  await page.screenshot({ path: `${evidence}/permission.png`, fullPage: true });
});

test("D094 older responses cannot replace a newer selected range", async ({
  page,
}) => {
  await mount(page, "deferred");
  await page.getByRole("button", { name: "30 ngày", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { dashboard094Pending: unknown[] })
            .dashboard094Pending.length,
      ),
    )
    .toBe(2);
  await page.evaluate(() => {
    const state = window as unknown as {
      dashboard094Pending: {
        response: { counts: { requests: number } };
        resolve: (value: unknown) => void;
      }[];
    };
    state.dashboard094Pending[1].response.counts.requests = 18;
    state.dashboard094Pending[1].resolve(state.dashboard094Pending[1].response);
  });
  await expect(page.locator(".d94KpiValue").first()).toHaveText("18đơn");
  await page.evaluate(() => {
    const state = window as unknown as {
      dashboard094Pending: {
        response: unknown;
        resolve: (value: unknown) => void;
      }[];
    };
    state.dashboard094Pending[0].resolve(state.dashboard094Pending[0].response);
  });
  await expect(page.locator(".d94KpiValue").first()).toHaveText("18đơn");
});

test("D094 text scaling preserves content and unmount releases pending response ownership", async ({
  page,
}) => {
  const errors = await mount(page, "deferred");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${evidence}/text-scale200.png`,
    fullPage: true,
  });
  await page.evaluate(() => {
    const state = window as unknown as {
      dashboard094Unmount: () => void;
      dashboard094Pending: {
        response: unknown;
        resolve: (value: unknown) => void;
      }[];
    };
    state.dashboard094Unmount();
    state.dashboard094Pending[0].resolve(state.dashboard094Pending[0].response);
  });
  await expect(page.locator(".dashboard094")).toHaveCount(0);
  expect(errors).toEqual([]);
});
