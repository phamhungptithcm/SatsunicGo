import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { seedIdentities, closeFixtures, sourceOrder } from "./fixtures";
import { invoke } from "./http";
import { artifactDirectory } from "./artifact-path";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFz8AAAAASUVORK5CYII=";

test("IMG025-A01 image disclosure stays open when its initial list response arrives", async ({
  page,
}) => {
  const orderId = await sourceOrder();
  const description = `Synthetic disclosure ${randomUUID()}`;
  await invoke(
    "uploadOrderImage",
    {
      orderId,
      kind: "request",
      mime: "image/png",
      base64: png,
      description,
      operationId: randomUUID(),
    },
    "customer-a",
  );
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("owner");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  let release!: () => void,
    ready!: () => void,
    requests = 0;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  const fetched = new Promise<void>((resolve) => {
    ready = resolve;
  });
  await page.route("**/listOrderImages", async (route) => {
    if (
      route.request().method() !== "POST" ||
      route.request().postDataJSON()?.data?.orderId !== orderId
    )
      return route.continue();
    requests++;
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    ready();
    await hold;
    await route.fulfill({ response });
  });
  try {
    await page.goto(`/crm/orders?order=${orderId}`);
    await fetched;
    const disclosure = page.locator("details.orderImages");
    await expect(disclosure.locator("summary")).toBeVisible();
    const node = await disclosure.elementHandle();
    expect(node).not.toBeNull();
    await disclosure.locator("summary").click();
    await expect(disclosure).toHaveAttribute("open", "");
    release();
    const row = disclosure.getByRole("button", {
      name: `Ảnh hàng cần mua · ${description}`,
      exact: true,
    });
    await expect(row).toBeVisible();
    await expect(disclosure).toHaveAttribute("open", "");
    expect(
      await node!.evaluate(
        (element) => element === document.querySelector("details.orderImages"),
      ),
    ).toBe(true);
    expect(requests).toBeGreaterThan(0);
    test
      .info()
      .annotations.push({
        type: "initial-image-list-requests",
        description: String(requests),
      });
    await page.screenshot({
      path: `${artifactDirectory}/image-disclosure-list-arrival.png`,
      fullPage: true,
    });
  } finally {
    release();
  }
});
