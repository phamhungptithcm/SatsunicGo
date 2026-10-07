import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

type NavigationMetrics = {
  frames: number;
  maxFrameGapMs: number;
  longTasks: number;
  longestTaskMs: number;
  longTasksSupported: boolean;
  stopped: boolean;
};
declare global {
  interface Window {
    nav087: NavigationMetrics;
  }
}

const origin = "http://127.0.0.1:5207";
test.use({ baseURL: origin });

async function account(
  page: import("@playwright/test").Page,
  authenticated = false,
) {
  await page.goto("/account");
  await expect(page.locator(".customerRail")).toBeVisible();
  if (authenticated) {
    // UI-only demo sign-in. No seeding, cleanup or real Google/provider use.
    await expect(
      page.getByRole("heading", { name: "Tài khoản thử nghiệm" }),
    ).toBeVisible();
    await page.getByLabel("Vai trò thử").selectOption("customer-a");
    await page.getByRole("button", { name: "Đăng nhập thử nghiệm" }).click();
    await expect(page.locator(".demoLogin")).toHaveCount(0);
    await expect(page.locator(".accountLoading")).toHaveCount(0);
  }
}

for (const width of [1440, 390]) {
  test(`query tabs keep their content host at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await account(page, true);
    await page.evaluate(() => {
      const metrics: NavigationMetrics = {
        frames: 0,
        maxFrameGapMs: 0,
        longTasks: 0,
        longestTaskMs: 0,
        longTasksSupported:
          PerformanceObserver.supportedEntryTypes.includes("longtask"),
        stopped: false,
      };
      window.nav087 = metrics;
      let previous = performance.now();
      const frame = (now: number) => {
        if (metrics.stopped) return;
        metrics.frames++;
        metrics.maxFrameGapMs = Math.max(metrics.maxFrameGapMs, now - previous);
        previous = now;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      if (metrics.longTasksSupported) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.longTasks++;
            metrics.longestTaskMs = Math.max(
              metrics.longestTaskMs,
              entry.duration,
            );
          }
          if (metrics.stopped) observer.disconnect();
        });
        observer.observe({ type: "longtask" });
      }
    });
    const host = await page.locator(".accountPage").elementHandle();
    for (const [label, title] of [
      ["Vận chuyển", "Vận chuyển"],
      ["Thông báo", "Thông báo"],
      ["Đơn của tôi", "Đơn của tôi"],
      ["Vận chuyển", "Vận chuyển"],
      ["Thông báo", "Thông báo"],
    ]) {
      await page
        .locator(".customerRail")
        .getByRole("link", { name: label, exact: true })
        .click();
      await expect(page.locator(".accountPage h1")).toHaveText(title);
      expect(await host!.evaluate((element) => element.isConnected)).toBe(true);
      expect(
        await page
          .locator(".accountPage")
          .evaluate((element) => getComputedStyle(element).animationName),
      ).toBe("none");
      await expect(page.locator(".loadingOverlay")).toHaveCount(0);
      await expect(page.locator("#main")).toBeFocused();
    }
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    const metrics = await page.evaluate(() => {
      window.nav087.stopped = true;
      return window.nav087;
    });
    const evidence = JSON.stringify(
      {
        environment: "LOCAL_EMULATOR_HEADLESS_CHROMIUM",
        phase: "AFTER_ONLY",
        width,
        switches: 5,
        ...metrics,
        longTasks: metrics.longTasksSupported ? metrics.longTasks : null,
        longestTaskMs: metrics.longTasksSupported
          ? metrics.longestTaskMs
          : null,
      },
      null,
      2,
    );
    await writeFile(
      `docs/reviews/NAV-PERF-087-${width}-metrics.json`,
      evidence,
    );
    await testInfo.attach("frame-sample", {
      body: evidence,
      contentType: "application/json",
    });
    await page.screenshot({
      path: `docs/reviews/NAV-PERF-087-${width}.png`,
      fullPage: true,
    });
    await testInfo.attach("screen", {
      path: `docs/reviews/NAV-PERF-087-${width}.png`,
      contentType: "image/png",
    });
  });
}

test("a cold slow account module keeps navigation and announces inline loading", async ({
  page,
}) => {
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/src/features/auth/Security.tsx*", async (route) => {
    await hold;
    await route.continue();
  });
  await account(page);
  const link = page
    .locator(".customerRail")
    .getByRole("link", { name: "Bảo mật tài khoản" });
  const started = await page.evaluate(() => performance.now());
  await link.click();
  await expect(page.locator(".customerRail")).toBeVisible();
  await expect(page.locator(".accountPage [role=status]")).toHaveText(
    "Đang mở mục này…",
  );
  // Observe through the overlay's existing 400ms threshold without arbitrary sleeps.
  await expect
    .poll(() =>
      page.evaluate(() => performance.now()).then((now) => now - started),
    )
    .toBeGreaterThan(450);
  await expect(page.locator(".loadingOverlay")).toHaveCount(0);
  await page.screenshot({
    path: "docs/reviews/NAV-PERF-087-inline-loading.png",
    fullPage: true,
  });
  await page
    .locator(".customerRail")
    .getByRole("link", { name: "Đơn của tôi", exact: true })
    .click();
  await expect(page.locator(".accountPage h1")).toHaveText("Đơn của tôi");
  release();
  await link.click();
  await expect(page.locator(".accountPage h1")).toHaveText("Bảo mật tài khoản");
});

test("a failed optional preload can recover on navigation", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/src/features/auth/Security.tsx*", async (route) => {
    requests++;
    if (requests === 1) await route.abort("failed");
    else await route.continue();
  });
  await account(page);
  const link = page
    .locator(".customerRail")
    .getByRole("link", { name: "Bảo mật tài khoản" });
  await link.focus();
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator(".accountPage h1")).toHaveText("Đơn của tôi");
  await link.press("Enter");
  // Native module maps may retain a failed fetch. In that case the existing
  // reload recovery must stay reachable; a full reload resets the module map.
  await expect
    .poll(() => page.locator("h1").allTextContents())
    .toContainEqual(
      expect.stringMatching(/Bảo mật tài khoản|Chưa mở được màn hình/),
    );
  if (await page.getByRole("button", { name: "Tải lại trang" }).isVisible()) {
    await page.getByRole("button", { name: "Tải lại trang" }).click();
  }
  await expect(page.locator(".accountPage h1")).toHaveText("Bảo mật tài khoản");
});

test("keyboard, reduced motion, zoom and browser history", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await account(page);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const link = page
    .locator(".customerRail")
    .getByRole("link", { name: "Thông báo", exact: true });
  await link.focus();
  await link.press("Enter");
  await expect(page.locator(".accountPage h1")).toHaveText("Thông báo");
  await expect(page.locator("#main")).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.goBack();
  await expect(page.locator(".accountPage h1")).toHaveText("Đơn của tôi");
  await page.goForward();
  await expect(page.locator(".accountPage h1")).toHaveText("Thông báo");
});

test("public routes and Ask retain identity-bound route resets without entrance bounce", async ({
  page,
}) => {
  await page.goto("/");
  for (const selector of [".heroCopy", ".journey"]) {
    expect(
      await page
        .locator(selector)
        .evaluate((element) => getComputedStyle(element).animationName),
    ).toBe("none");
  }
  const ask = page.getByRole("textbox", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await ask.fill("Navigation test draft — do not send");
  await page
    .locator("#primary-navigation")
    .getByRole("link", { name: "Mua hộ", exact: true })
    .click();
  await expect(page).toHaveURL(/\/request$/);
  await expect(page.locator("#main h1")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Hỏi SatsunicGo", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "SatsunicGo — Trang chủ" }).click();
  await expect(ask).toHaveValue("");
  expect(
    await ask.evaluate(
      (element) => getComputedStyle(element.closest("aside")!).animationName,
    ),
  ).toBe("none");
  await expect(page.locator(".loadingOverlay")).toHaveCount(0);
});
