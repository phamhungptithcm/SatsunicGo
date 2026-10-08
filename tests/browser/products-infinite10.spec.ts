import { test, expect, type Page } from "@playwright/test";

// Browser-only synthetic public SDK reads; no shared emulator writes or resets.
async function catalog(
  page: Page,
  total: number,
  options: { fail?: number; manual?: boolean; delay?: number } = {},
) {
  await page.addInitScript(
    ({ total, options }) => {
      const state = {
        calls: 0,
        limits: [] as number[],
        delivered: 0,
        pending: 0,
        maxPending: 0,
      };
      Object.assign(window, {
        __catalogState: state,
        __catalogRead: async (q: { _query: { limit: number } }) => {
          state.calls++;
          state.limits.push(q._query.limit);
          state.pending++;
          state.maxPending = Math.max(state.maxPending, state.pending);
          await new Promise((resolve) =>
            setTimeout(resolve, options.delay ?? 80),
          );
          state.pending--;
          if (state.calls === options.fail)
            throw Error("SYNTHETIC_PUBLIC_PAGE_FAILURE");
          const count = Math.min(q._query.limit, total - state.delivered);
          const docs = Array.from({ length: count }, (_, i) => {
            const index = state.delivered + i;
            return {
              id: `fixture-${index}`,
              data: () => ({
                title: `Pagination product ${index}`,
                slug: `fixture-${index}`,
                status: "published",
                market: "US",
              }),
            };
          });
          state.delivered += count;
          return { docs, size: docs.length, metadata: { fromCache: false } };
        },
      });
      if (options.manual)
        Object.defineProperty(window, "IntersectionObserver", {
          value: undefined,
        });
    },
    { total, options },
  );
  await page.route("**/src/shared/public-content.ts*", async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const body = original.replace(
      "await getDocs(",
      "await window.__catalogRead(",
    );
    expect(body).not.toBe(original);
    await route.fulfill({ response, body });
  });
  await page.goto("/products");
  await expect(page.locator(".catalogGrid > *")).toHaveCount(
    Math.min(10, total),
  );
}
const cards = (page: Page) => page.locator(".catalogGrid > *");
const state = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          __catalogState: {
            calls: number;
            limits: number[];
            maxPending: number;
          };
        }
      ).__catalogState,
  );
const more = (page: Page) =>
  page.getByRole("button", { name: "Xem thêm sản phẩm", exact: true });

test("scroll loads 10 at a time, preserves cards, and stops after final partial page", async ({
  page,
}) => {
  await catalog(page, 23);
  await more(page).scrollIntoViewIfNeeded();
  await expect(cards(page)).toHaveCount(20);
  await more(page).scrollIntoViewIfNeeded();
  await expect(cards(page)).toHaveCount(23);
  await expect(more(page)).toHaveCount(0);
  expect(await state(page)).toMatchObject({
    calls: 3,
    limits: [10, 10, 10],
    maxPending: 1,
  });
  expect(await cards(page).locator("h2").allTextContents()).toEqual(
    Array.from({ length: 23 }, (_, i) => `Pagination product ${i}`),
  );
  await page.screenshot({
    path: "output/products-infinite10/desktop.png",
    fullPage: true,
  });
});

test("manual keyboard fallback handles exact multiples and the final empty page", async ({
  page,
}) => {
  await catalog(page, 20, { manual: true });
  await more(page).focus();
  await page.keyboard.press("Enter");
  await expect(cards(page)).toHaveCount(20);
  await expect(more(page)).toBeEnabled();
  await page.keyboard.press("Enter");
  await expect(more(page)).toHaveCount(0);
  expect(await state(page)).toMatchObject({
    calls: 3,
    limits: [10, 10, 10],
    maxPending: 1,
  });
});

test("failed next page retains cards, stops automatic retry and permits explicit recovery", async ({
  page,
}) => {
  await catalog(page, 23, { fail: 2 });
  await more(page).scrollIntoViewIfNeeded();
  await expect(
    page.getByText("Chưa tải được thêm sản phẩm.", { exact: true }),
  ).toBeVisible();
  await expect(cards(page)).toHaveCount(10);
  await page.waitForTimeout(350);
  expect((await state(page)).calls).toBe(2);
  await page.screenshot({
    path: "output/products-infinite10/error.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(cards(page)).toHaveCount(20);
});

test("overlapping clicks and observer callbacks issue only one request", async ({
  page,
}) => {
  await catalog(page, 23, { delay: 500 });
  await more(page).scrollIntoViewIfNeeded();
  await expect(
    page.getByText("Đang tải thêm sản phẩm…", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "output/products-infinite10/loading.png",
    fullPage: true,
  });
  await expect(cards(page)).toHaveCount(20);
  expect((await state(page)).maxPending).toBe(1);
});

test("mobile filters continue through loaded pages and observer cleans up on navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await catalog(page, 23);
  await page
    .getByRole("searchbox", { name: "Tìm sản phẩm", exact: true })
    .fill("Pagination product 22");
  await expect(cards(page)).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Pagination product 22", exact: true }),
  ).toBeVisible();
  expect((await state(page)).calls).toBe(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "output/products-infinite10/mobile-filter.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Yêu cầu mua hộ", exact: false })
    .last()
    .click();
  await page.waitForTimeout(200);
  expect((await state(page)).calls).toBe(3);
});
