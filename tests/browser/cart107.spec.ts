import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { createConnection } from "node:net";
const id = `cart107-${randomUUID()}`,
  identity = `cart107-${randomUUID()}`,
  uid = `e2e005-${identity}`;
const project = "demo-satsunicgo",
  key = `satsunicgo-cart-v1:${project}:guest`;
let admin: ReturnType<typeof initializeApp>;
let authAvailable = false,
  functionsAvailable = false,
  createdUser = false;
function listening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.setTimeout(1500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}
test.beforeEach(async ({ context }) => {
  if (process.env.CART107_BROWSER_FIXTURE_ENV !== "true") return;
  // Browser-only override: never change shared Vite env or contact live Firebase.
  await context.route("**/src/shared/firebase.ts*", async (route) => {
    const response = await route.fetch(),
      source = await response.text();
    if (!source.includes("const env = import.meta.env;"))
      throw Error(
        "Unexpected Firebase module; do not run against live configuration",
      );
    const fixtureEnv = {
      DEV: true,
      VITE_FIREBASE_API_KEY: "demo-cart107",
      VITE_FIREBASE_PROJECT_ID: project,
      VITE_FIREBASE_APP_ID: "1:107:web:cart107",
      VITE_FIREBASE_AUTH_DOMAIN: "demo-satsunicgo.firebaseapp.com",
      VITE_USE_EMULATORS: "true",
      VITE_AUTH_EMULATOR_PORT: "19207",
      VITE_FIRESTORE_EMULATOR_PORT: "18207",
      VITE_FUNCTIONS_EMULATOR_PORT: "15207",
    };
    await route.fulfill({
      response,
      body: source.replace(
        "const env = import.meta.env;",
        `const env = ${JSON.stringify(fixtureEnv)};`,
      ),
    });
  });
});
test("guest offline and second-tab sync preserve the local cart", async ({
  page,
  context,
}) => {
  await page.goto(`/products/${id}`);
  await page
    .locator(".cartAdd107")
    .getByLabel("Mẫu sản phẩm")
    .selectOption("Trắng");
  await page
    .locator(".cartAdd107")
    .getByRole("button", { name: "Thêm vào giỏ" })
    .click();
  await page.locator(".headerCart107").click();
  await expect(page.locator(".cartTotal107")).toContainText("650.000");
  const second = await context.newPage();
  await second.goto("/cart");
  await expect(second.locator(".cartQuantity107 output")).toHaveText("1");
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(second.locator(".cartQuantity107 output")).toHaveText("2");
  await context.setOffline(true);
  await expect(
    page.getByText("Bạn đang ngoại tuyến.", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(page.locator(".cartQuantity107 output")).toHaveText("3");
  await expect(second.locator(".cartQuantity107 output")).toHaveText("3");
  await page.screenshot({
    path: "docs/reviews/SATSUNICGO-CART-107/cart-offline.png",
    fullPage: true,
  });
  await context.setOffline(false);
  await second.close();
});
test("storage failure retains further additions in memory with an honest warning", async ({
  page,
}) => {
  await page.addInitScript((k) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === k)
        throw new DOMException("Synthetic quota failure", "QuotaExceededError");
      return original.call(this, key, value);
    };
  }, key);
  await page.goto(`/products/${id}`);
  await page
    .locator(".cartAdd107")
    .getByLabel("Mẫu sản phẩm")
    .selectOption("Trắng");
  await page
    .locator(".cartAdd107")
    .getByRole("button", { name: "Thêm vào giỏ" })
    .click();
  await expect(page.locator(".headerCart107")).toHaveAccessibleName(
    "Giỏ hàng, 1 sản phẩm",
  );
  await page.locator(".headerCart107").click();
  await expect(
    page.getByText("Giỏ chỉ được giữ trong trang này", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(page.locator(".cartQuantity107 output")).toHaveText("2");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
});
test("long product names and 200 percent cart scaling retain controls", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1000 });
  await page.goto(`/products/${id}`);
  await page.locator(".cartAdd107").getByLabel("Mẫu sản phẩm").selectOption("Trắng");
  await page.locator(".cartAdd107").getByRole("button", { name: "Thêm vào giỏ" }).click();
  await page.locator(".headerCart107").click();
  await expect(page.locator(".cartItemBody107 h2")).toBeVisible();
  await page.locator(".cartItemBody107 h2 a").evaluate(el => { el.textContent = "Bình giữ nhiệt Nhật Bản với tên sản phẩm dài để kiểm tra khả năng đọc, xuống dòng và sử dụng các nút trên màn hình nhỏ"; });
  await page.locator(".cart107").evaluate(el => { el.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(page.locator(".cartQuantity107 output")).toHaveText("2");
  await page.screenshot({ path: "docs/reviews/SATSUNICGO-CART-107/cart-scaled.png", fullPage: true });
});
test.beforeAll(async () => {
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207" ||
    process.env.GCLOUD_PROJECT !== project
  )
    throw Error("Use existing shared demo emulators only");
  admin = initializeApp({ projectId: project }, "cart107-browser");
  await getFirestore(admin)
    .doc(`products/${id}`)
    .set({
      title: "Bình giữ nhiệt kiểm thử giỏ 107",
      slug: id,
      body: "Dữ liệu minh họa kiểm thử cục bộ.",
      status: "published",
      market: "JP",
      version: 1,
      orderable: true,
      listedPrice: 650000,
      termsVersion: "synthetic-cart-v1",
      catalogOptions: ["Trắng", "Đen"],
    });
  authAvailable = await listening(19207);
  functionsAvailable = await listening(15207);
  if (!authAvailable) return;
  await getAuth(admin).createUser({
    uid,
    email: `${identity}@satsunicgo.example.invalid`,
    emailVerified: true,
  });
  createdUser = true;
  await getAuth(admin).updateUser(uid, {
    providerToLink: {
      providerId: "google.com",
      uid,
      email: `${identity}@satsunicgo.example.invalid`,
    },
  });
});
test.afterAll(async () => {
  if (!admin) return;
  const db = getFirestore(admin);
  // Only suite-owned synthetic product, cart and auth identity; no resets/reseeding.
  await db.doc(`products/${id}`).delete();
  await db.recursiveDelete(db.doc(`carts/${uid}`));
  const orders = await db
    .collection("orders")
    .where("ownerId", "==", uid)
    .get();
  for (const order of orders.docs) await db.recursiveDelete(order.ref);
  await db.doc(`users/${uid}`).delete();
  if (createdUser) await getAuth(admin).deleteUser(uid);
  await db.terminate();
  await deleteApp(admin);
});
for (const width of [1440, 390, 320])
  test(`guest cart and navbar at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/products/${id}`);
    const add = page.locator(".cartAdd107");
    await expect(
      add.getByRole("button", { name: "Thêm vào giỏ" }),
    ).toBeDisabled();
    await add.getByLabel("Mẫu sản phẩm").selectOption("Trắng");
    await add.getByLabel("Số lượng").fill("2");
    await add.getByRole("button", { name: "Thêm vào giỏ" }).click();
    await expect(
      page.getByRole("link", { name: "Giỏ hàng, 2 sản phẩm", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Giỏ hàng, 2 sản phẩm", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Giỏ hàng", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".cartTotal107")).toContainText("1.300.000");
    await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
    await expect(page.locator(".cartQuantity107 output")).toHaveText("3");
    await page.reload();
    await expect(page.locator(".cartQuantity107 output")).toHaveText("3");
    await expect(page.locator(".cartTotal107")).toContainText("1.950.000");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `docs/reviews/SATSUNICGO-CART-107/cart-${width}.png`,
      fullPage: true,
    });
    await page.locator(".headerCart107").focus();
    await expect(page.locator(".headerCart107")).toBeFocused();
    await page.getByRole("button", { name: /^Xóa .*khỏi giỏ/ }).click();
    await expect(
      page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
    ).toBeVisible();
  });
test("offline cart, explicit account merge, checkout prefill and sign-out isolation", async ({
  page,
  context,
}) => {
  test.skip(
    !authAvailable || !functionsAvailable,
    "Auth 19207 / Functions 15207 are unavailable; no runtime restart authorized.",
  );
  await page.goto(`/products/${id}`);
  await page
    .locator(".cartAdd107")
    .getByLabel("Mẫu sản phẩm")
    .selectOption("Đen");
  await page
    .locator(".cartAdd107")
    .getByRole("button", { name: "Thêm vào giỏ" })
    .click();
  await page.locator(".headerCart107").click();
  await expect(page.locator(".cartTotal107")).toContainText("650.000");
  await context.setOffline(true);
  await expect(
    page.getByText("Bạn đang ngoại tuyến.", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click();
  await expect(page.locator(".cartQuantity107 output")).toHaveText("2");
  await context.setOffline(false);
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử" })
    .evaluate((select, value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = "Synthetic CART107";
      select.appendChild(option);
    }, identity);
  await page
    .getByRole("combobox", { name: "Vai trò thử" })
    .selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  await page.locator(".headerCart107").click();
  await expect(
    page.getByRole("button", { name: "Gộp vào giỏ tài khoản" }),
  ).toBeEnabled();
  let lostMergeReply = false;
  await page.route("**/asia-southeast1/cartCommand", async (route) => {
    if (
      route.request().method() !== "POST" ||
      lostMergeReply ||
      route.request().postDataJSON()?.data?.action !== "merge"
    )
      return route.continue();
    lostMergeReply = true;
    await route.fetch(); // Commit the real emulator mutation, then lose only its reply.
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "http://127.0.0.1:5207" },
      body: JSON.stringify({
        error: { status: "INTERNAL", message: "Synthetic reply loss" },
      }),
    });
  });
  await page.getByRole("button", { name: "Gộp vào giỏ tài khoản" }).click();
  await expect(
    page.getByRole("button", {
      name: "Kiểm tra lại lần cập nhật",
      exact: true,
    }),
  ).toBeEnabled();
  await page.screenshot({ path: "docs/reviews/SATSUNICGO-CART-107/cart-retry.png", fullPage: true });
  await page
    .getByRole("button", { name: "Kiểm tra lại lần cập nhật", exact: true })
    .click();
  await expect(page.locator(".cartQuantity107 output")).toHaveText("2");
  await expect.poll(() => page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await page.getByRole("button", { name: "Xem lại để đặt mua" }).click();
  await getFirestore(admin)
    .doc(`products/${id}`)
    .update({ version: 2, listedPrice: 700000 });
  await page.getByRole("link", { name: "Đặt mua sản phẩm này →" }).click();
  await expect(
    page.getByRole("heading", { name: "Đặt mua sản phẩm", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Số lượng" })).toHaveValue(
    "2",
  );
  await expect(
    page.getByRole("combobox", { name: "Mẫu sản phẩm" }),
  ).toHaveValue("Đen");
  await expect(
    page.getByRole("button", {
      name: "Đặt mua và tiếp tục thanh toán",
      exact: true,
    }),
  ).toBeDisabled();
  await page.screenshot({ path: "docs/reviews/SATSUNICGO-CART-107/checkout-price-change.png", fullPage: true });
  await page.getByRole("button", { name: "Đã xem thông tin mới" }).click();
  // Opening checkout must neither create an order nor delete the cart.
  expect(
    (await getFirestore(admin).doc(`carts/${uid}`).get()).data()?.items[0]
      .quantity,
  ).toBe(2);
  await page
    .getByRole("button", {
      name: "Đặt mua và tiếp tục thanh toán",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/account\/orders\//);
  const orderId = new URL(page.url()).pathname.split("/").pop()!;
  await expect
    .poll(
      async () =>
        (await getFirestore(admin).doc(`carts/${uid}`).get()).data()?.items
          .length,
    )
    .toBe(0);
  const order = (
    await getFirestore(admin).doc(`orders/${orderId}`).get()
  ).data();
  expect(order).toMatchObject({
    ownerId: uid,
    purchaseKind: "catalog",
    finalTotal: 1400000,
    collected: 0,
    catalogSnapshot: { productId: id, quantity: 2, variant: "Đen" },
  });
  // Retain a different choice to prove private cart clearing on sign-out.
  await page.goto(`/products/${id}`);
  await page
    .locator(".cartAdd107")
    .getByLabel("Mẫu sản phẩm")
    .selectOption("Trắng");
  await page
    .locator(".cartAdd107")
    .getByRole("button", { name: "Thêm vào giỏ" })
    .click();
  await expect(page.locator(".headerCart107")).toHaveAccessibleName(
    "Giỏ hàng, 1 sản phẩm",
  );
  await page.getByRole("button", { name: /Tài khoản của/ }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Giỏ hàng, 0 sản phẩm", exact: true }),
  ).toBeVisible();
});
