import { artifactDirectory } from "./artifact-path";
import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  seedIdentities,
  closeFixtures,
  product,
  statementRenderFixture,
  sourceOrder,
} from "./fixtures";
import { invoke } from "./http";
import { randomUUID } from "node:crypto";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);

test("UI-H200 native browser 200 percent zoom preserves checkout labels and keyboard controls", async () => {
  // This fresh owned profile sets browser page zoom; CSS zoom, pinch zoom and
  // deviceScaleFactor would not establish the same acceptance evidence.
  const profile = await mkdtemp(join(tmpdir(), "release021-zoom-"));
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  });
  try {
    const page = await context.newPage();
    await page.goto("chrome://settings/appearance");
    await page.locator("select#zoomLevel").selectOption({ label: "200%" });
    await page.goto("http://127.0.0.1:5187/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("customer-a");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    const p = await product();
    await page.goto(`http://127.0.0.1:5187/products/${p.slug}/checkout`);
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      ratio: devicePixelRatio,
      scroll: document.body.scrollWidth,
    }));
    expect(dimensions.width).toBeGreaterThanOrEqual(719);
    expect(dimensions.width).toBeLessThanOrEqual(721);
    expect(dimensions.ratio).toBeCloseTo(2, 1);
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
    await page
      .getByRole("combobox", { name: "Mẫu sản phẩm", exact: true })
      .selectOption("Large");
    const quantity = page.getByRole("spinbutton", {
      name: "Số lượng",
      exact: true,
    });
    await quantity.fill("2");
    await quantity.focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", {
        name: "Đặt mua và tiếp tục thanh toán",
        exact: true,
      }),
    ).toBeFocused();
    const contrast = await page
      .getByRole("button", {
        name: "Đặt mua và tiếp tục thanh toán",
        exact: true,
      })
      .evaluate((element) => {
        const style = getComputedStyle(element);
        const luminance = (value: string) => {
          const channels = value
            .match(/[\d.]+/g)
            ?.slice(0, 3)
            .map(Number);
          if (!channels || channels.length !== 3)
            throw Error("Opaque RGB color required");
          const linear = channels.map((n) => {
            const s = n / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        };
        const foreground = luminance(style.color),
          background = luminance(style.backgroundColor);
        return (
          (Math.max(foreground, background) + 0.05) /
          (Math.min(foreground, background) + 0.05)
        );
      });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    const tree = await page.locator("main").ariaSnapshot();
    expect(tree).toContain("Mẫu sản phẩm");
    expect(tree).toContain("Số lượng");
    expect(tree).toContain("Đặt mua và tiếp tục thanh toán");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${artifactDirectory}/checkout-native-200.png`,
      fullPage: false,
    });
    await writeFile(
      `${artifactDirectory}/checkout-200-accessibility.yaml`,
      tree,
    );
    await page.goto("http://127.0.0.1:5187/account");
    await page.getByRole("button", { name: /Tài khoản của/ }).click();
    await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("owner");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /Tài khoản của/ }),
    ).toBeVisible();
    const statement = await statementRenderFixture();
    await page.goto(
      `http://127.0.0.1:5187/crm/documents?order=${statement.sourceOrderId}`,
    );
    await page
      .locator(".documentList article")
      .filter({ has: page.getByText(statement.id, { exact: true }) })
      .getByRole("button", { name: "Mở chứng từ", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Chứng từ đơn hàng nội bộ",
        exact: true,
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await expect(page.locator(".salesStatement tbody tr")).toHaveCount(20);
    const statementTree = await page.locator(".salesStatement").ariaSnapshot();
    expect(statementTree).toContain("Tổng chi phí đã duyệt");
    await writeFile(
      `${artifactDirectory}/statement-200-accessibility.yaml`,
      statementTree,
    );
    await page.locator(".salesStatement").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${artifactDirectory}/statement-native-200.png`,
      fullPage: false,
    });
    const ticket = await invoke<{ id: string }>(
      "workspaceCommand",
      {
        action: "openTicket",
        operationId: randomUUID(),
        payload: {
          subject: `Synthetic zoom ${randomUUID()}`,
          message: "Synthetic zoom accessibility",
          topic: "purchase",
        },
      },
      "customer-a",
    );
    await page.goto(`http://127.0.0.1:5187/crm/support?ticket=${ticket.id}`);
    const reply = page.getByRole("textbox", { name: "Phản hồi", exact: true });
    await expect(reply).toBeVisible();
    const back = await page
      .getByRole("link", { name: "← Tất cả hội thoại", exact: true })
      .boundingBox();
    const reload = await page
      .getByRole("button", { name: "Tải lại hội thoại", exact: true })
      .boundingBox();
    expect(back).not.toBeNull();
    expect(reload).not.toBeNull();
    expect(
      Math.abs(reload!.y - back!.y) < 10
        ? reload!.x - back!.x - back!.width
        : reload!.y - back!.y - back!.height,
    ).toBeGreaterThanOrEqual(8);
    const checkbox = page.getByRole("checkbox", {
      name: "Đánh dấu đã giải quyết",
      exact: true,
    });
    const alignment = await checkbox.evaluate((element) => {
      const label = element.closest("label")!;
      const text = Array.from(label.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      );
      if (!text) throw Error("Expected visible checkbox label text");
      const range = document.createRange();
      range.selectNode(text);
      const t = range.getBoundingClientRect(),
        c = element.getBoundingClientRect();
      return {
        gap: t.x - c.right,
        centerDelta: Math.abs(t.y + t.height / 2 - c.y - c.height / 2),
      };
    });
    expect(alignment.gap).toBeGreaterThanOrEqual(4);
    expect(alignment.centerDelta).toBeLessThan(10);
    await reply.focus();
    await page.keyboard.type("Synthetic keyboard reply at native zoom");
    await expect(reply).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Gửi phản hồi", exact: true }),
    ).toBeEnabled();
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await writeFile(
      `${artifactDirectory}/support-200-accessibility.yaml`,
      await page.locator("main").ariaSnapshot(),
    );
    await page.screenshot({
      path: `${artifactDirectory}/support-native-200.png`,
      fullPage: false,
    });
    const orderId = await sourceOrder();
    await page.goto(`http://127.0.0.1:5187/crm/orders?order=${orderId}`);
    const orderLinks = page.locator(".workbenchLinks");
    await expect(orderLinks.getByRole("link")).toHaveCount(2);
    const linkBoxes = await orderLinks.getByRole("link").evaluateAll((links) =>
      links.map((link) => {
        const r = link.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    expect(
      Math.abs(linkBoxes[1].y - linkBoxes[0].y) < 10
        ? linkBoxes[1].x - linkBoxes[0].x - linkBoxes[0].width
        : linkBoxes[1].y - linkBoxes[0].y - linkBoxes[0].height,
    ).toBeGreaterThanOrEqual(8);
    const images = page.locator("details.orderImages");
    await expect(images).toBeVisible();
    if (!(await images.evaluate((el) => (el as HTMLDetailsElement).open)))
      await images.locator("summary").click();
    const description = images.getByRole("textbox", {
      name: "Mô tả",
      exact: true,
    });
    await description.focus();
    await page.keyboard.type("Synthetic image description at native zoom");
    await expect(description).toBeFocused();
    await expect(images.getByLabel("Ảnh", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1),
    ).toBe(true);
    await writeFile(
      `${artifactDirectory}/images-200-accessibility.yaml`,
      await images.ariaSnapshot(),
    );
    await description.scrollIntoViewIfNeeded();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const capture = await description.evaluate((element) => {
      const r = element.getBoundingClientRect();
      return {
        width: innerWidth,
        height: innerHeight,
        scrollY,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    });
    expect(capture.rect.y).toBeGreaterThanOrEqual(0);
    expect(capture.rect.y + capture.rect.height).toBeLessThanOrEqual(
      capture.height + 1,
    );
    await writeFile(
      `${artifactDirectory}/images-200-capture.json`,
      JSON.stringify(capture, null, 2),
    );
    await page.screenshot({
      path: `${artifactDirectory}/images-native-200.png`,
      fullPage: false,
    });
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
