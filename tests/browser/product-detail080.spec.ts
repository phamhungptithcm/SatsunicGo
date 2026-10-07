import { test } from "@playwright/test";
import assert from "node:assert/strict";
const url = "/tests/browser/fixtures/productdetail080/index.html";
const passed = (_name: string) => {};
for (const width of [320, 390, 768, 1440])
  test(`product detail + verified review + CRM ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const runtime: string[] = [];
    page.on("pageerror", (e) => runtime.push(e.message));
    await page.route("**/*", (r) => {
      const u = new URL(r.request().url());
      return u.hostname === "127.0.0.1" && u.port === "5387"
        ? r.continue()
        : r.abort();
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: "Viết đánh giá", exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.equal(
      await page
        .locator(".sgReviewStars")
        .first()
        .evaluate((e) => getComputedStyle(e).color),
      "rgb(183, 121, 8)",
    );
    assert.equal(
      await page.getByRole("link", { name: "Nguồn sản phẩm" }).count(),
      0,
    );
    assert.equal(
      await page
        .locator(".sgProductUsage")
        .evaluate((e) => getComputedStyle(e).listStyleType),
      "disc",
    );
    passed(
      `product ${width}px responsive / golden stars / unsafe source omitted`,
    );
    await page
      .getByRole("button", { name: "Viết đánh giá", exact: true })
      .click();
    await page.getByLabel("Đơn đã nhận sản phẩm").selectOption("order-1");
    await page.getByRole("radio", { name: "5 sao", exact: true }).check();
    await page
      .getByLabel("Tên hiển thị", { exact: true })
      .fill("Khách kiểm thử");
    await page
      .getByLabel("Nhận xét", { exact: true })
      .fill("Sản phẩm đúng quy cách, đóng gói tốt.");
    await page
      .getByLabel("Nhận xét", { exact: true })
      .dispatchEvent("compositionstart");
    await page
      .getByLabel("Nhận xét", { exact: true })
      .dispatchEvent("keydown", {
        key: "Enter",
        code: "Enter",
        isComposing: true,
      });
    assert.equal(
      await page.evaluate(
        () =>
          window.product080Mock.calls.filter(
            (x) => x.name === "productReviewWrite",
          ).length,
      ),
      0,
    );
    await page
      .getByLabel("Nhận xét", { exact: true })
      .dispatchEvent("compositionend");
    passed(`IME Enter ${width}px does not submit`);
    await page.evaluate(() => (window.product080Mock.failWrite = true));
    await page
      .getByRole("button", { name: "Gửi đánh giá", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Thử lại thao tác", exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Nhận xét", { exact: true }).isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Thử lại thao tác", exact: true })
      .click();
    await page
      .getByText("Đã gửi đánh giá, đang chờ duyệt.", { exact: true })
      .waitFor();
    const writes = await page.evaluate(() =>
      window.product080Mock.calls.filter(
        (x) => x.name === "productReviewWrite",
      ),
    );
    assert.equal(writes.length, 2);
    assert.deepEqual(writes[0].data, writes[1].data);
    passed(
      `lost ACK ${width}px exact payload/op retry / pending durable notice`,
    );
    await page.evaluate(() => window.product080Render("product", true));
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    passed(`long Vietnamese text ${width}px wraps`);
    await page.evaluate(() => window.product080Render("editor"));
    await page
      .getByRole("button", { name: "Thêm hướng dẫn", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Hướng dẫn 1", exact: true })
      .fill("Đọc nhãn trước khi sử dụng.");
    await page
      .getByRole("button", { name: "Thêm hướng dẫn", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Hướng dẫn 2", exact: true })
      .fill("Bảo quản theo hướng dẫn hãng.");
    await page
      .getByRole("button", { name: "Đưa hướng dẫn 2 lên", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("textbox", { name: "Hướng dẫn 1", exact: true })
        .inputValue(),
      "Bảo quản theo hướng dẫn hãng.",
    );
    await page.getByText("Xem trước", { exact: true }).click();
    await page
      .getByRole("listitem")
      .filter({ hasText: "Bảo quản theo hướng dẫn hãng." })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    passed(`CRM bullets ${width}px add / reorder / preview`);
    await page.evaluate(() => window.product080Render("moderation"));
    await page.getByRole("button", { name: "Từ chối", exact: true }).waitFor();
    await page.getByRole("button", { name: "Từ chối", exact: true }).click();
    await page
      .getByText("Nhập lý do hoặc nội dung phản hồi trước khi lưu.", {
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () =>
          window.product080Mock.calls.filter(
            (x) => x.name === "productReviewModerate",
          ).length,
      ),
      0,
    );
    await page
      .getByRole("button", { name: "Cho hiển thị", exact: true })
      .click();
    await page.getByText("Đã lưu quyết định.", { exact: true }).waitFor();
    passed(`CRM ${width}px reject needs reason / one-star approval`);
    assert.deepEqual(runtime, []);
  });

test("weak network and A-B-A late responses and 200%", async ({ page: p }) => {
  await p.setViewportSize({ width: 1024, height: 1000 });
  await p.goto(url);
  await p.getByRole("button", { name: "Viết đánh giá", exact: true }).waitFor();
  await p.evaluate(() => {
    window.product080Mock.scenario = "read-error";
    window.product080Mock.change("buyer-b");
  });
  await p
    .getByText("Chưa tải được đánh giá. Anh/chị thử tải lại nhé.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await p.getByText("Chưa có đánh giá.", { exact: true }).count(),
    0,
  );
  await p.evaluate(() => (window.product080Mock.scenario = "default"));
  await p.getByRole("button", { name: "Tải lại", exact: true }).click();
  await p.getByRole("button", { name: "Viết đánh giá", exact: true }).click();
  await p
    .getByLabel("Nhận xét", { exact: true })
    .fill("Bản nháp riêng tài khoản B.");
  await p.evaluate(() => {
    window.product080Mock.change("buyer-a");
    window.product080Mock.change("buyer-b");
  });
  await p.getByRole("button", { name: "Viết đánh giá", exact: true }).waitFor();
  assert.equal(await p.getByLabel("Nhận xét", { exact: true }).count(), 0);
  assert.equal(
    await p.getByText("Bản nháp riêng tài khoản B.", { exact: true }).count(),
    0,
  );
  passed("weak network no fake zero / recovery / A-B-A private draft cleared");
  await p.getByRole("button", { name: "Viết đánh giá", exact: true }).click();
  await p.getByLabel("Đơn đã nhận sản phẩm").selectOption("order-1");
  await p.getByRole("radio", { name: "5 sao", exact: true }).check();
  await p.getByLabel("Tên hiển thị", { exact: true }).fill("Khách riêng");
  await p
    .getByLabel("Nhận xét", { exact: true })
    .fill("Bản nháp đang gửi của tài khoản hiện tại.");
  await p.evaluate(() => (window.product080DelayWrite = true));
  await p.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
  await p.getByRole("button", { name: "Đang gửi…", exact: true }).waitFor();
  await p.evaluate(() => {
    window.product080Mock.change("buyer-a");
    window.product080Mock.change("buyer-b");
    window.product080ReleaseWrite();
  });
  await p.getByRole("button", { name: "Viết đánh giá", exact: true }).waitFor();
  await p.getByLabel("Nhận xét", { exact: true }).waitFor({ state: "hidden" });
  assert.equal(
    await p
      .getByText("Đã gửi đánh giá, đang chờ duyệt.", { exact: true })
      .count(),
    0,
  );
  assert.equal(await p.getByLabel("Nhận xét", { exact: true }).count(), 0);
  passed(
    "late private write response through A-B-A cannot restore draft or notice",
  );
  await p.evaluate(() => (document.body.style.zoom = "2"));
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  passed("200% layout no horizontal overflow");
});

test("same account read failure clears loaded private customer and staff state", async ({
  page,
}) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Viết đánh giá", exact: true })
    .click();
  await page
    .locator("textarea")
    .fill("Bản nháp riêng cần xóa khi quyền bị thu hồi");
  await page.evaluate(() => {
    window.product080Mock.scenario = "read-error";
  });
  await page.getByLabel("Đơn đã nhận sản phẩm").selectOption("order-1");
  await page.getByRole("radio", { name: "5 sao", exact: true }).check();
  await page.getByLabel("Tên hiển thị", { exact: true }).fill("Khách kiểm thử");
  await page.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
  await page
    .getByText("Chưa tải được đánh giá. Anh/chị thử tải lại nhé.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator("textarea").count(), 0);
  await page.evaluate(() => {
    window.product080Mock.scenario = "default";
    window.product080Render("moderation");
  });
  await page
    .getByText("Cập nhật đơn chưa kịp thời.", { exact: true })
    .waitFor();
  await page.locator("textarea").fill("Lý do riêng của nhân viên");
  await page.evaluate(() => {
    window.product080Mock.scenario = "read-error";
  });
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await page
    .getByText("Chưa tải được đánh giá. Kiểm tra quyền và tải lại.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByText("Cập nhật đơn chưa kịp thời.", { exact: true })
      .count(),
    0,
  );
  assert.equal(await page.locator("textarea").count(), 0);
});

test("same account write permission revocation clears private customer and staff state", async ({
  page,
}) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Viết đánh giá", exact: true })
    .click();
  await page.getByLabel("Đơn đã nhận sản phẩm").selectOption("order-1");
  await page.getByRole("radio", { name: "5 sao", exact: true }).check();
  await page.getByLabel("Tên hiển thị", { exact: true }).fill("Khách kiểm thử");
  await page
    .getByLabel("Nhận xét", { exact: true })
    .fill("Bản nháp riêng phải xóa khi bị từ chối quyền");
  await page.evaluate(() => {
    window.product080Mock.scenario = "write-denied";
  });
  await page.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
  await page
    .getByText("Chưa gửi được đánh giá. Kiểm tra đơn đã nhận và thử lại.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator("textarea").count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Thử lại thao tác", exact: true })
      .count(),
    0,
  );
  await page.evaluate(() => {
    window.product080Mock.scenario = "default";
    window.product080Render("moderation");
  });
  await page
    .getByText("Cập nhật đơn chưa kịp thời.", { exact: true })
    .waitFor();
  await page.locator("textarea").fill("Lý do riêng cần xóa");
  await page.evaluate(() => {
    window.product080Mock.scenario = "write-denied";
  });
  await page.getByRole("button", { name: "Cho hiển thị", exact: true }).click();
  await page
    .getByText("Chưa lưu được quyết định. Tải lại và kiểm tra nội dung.", {
      exact: true,
    })
    .waitFor();
  assert.equal(await page.locator("textarea").count(), 0);
  assert.equal(
    await page
      .getByText("Cập nhật đơn chưa kịp thời.", { exact: true })
      .count(),
    0,
  );
});

test("product withdrawn during review submit is definitive and does not trap retry", async ({
  page,
}) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page
    .getByRole("button", { name: "Viết đánh giá", exact: true })
    .click();
  await page.getByLabel("Đơn đã nhận sản phẩm").selectOption("order-1");
  await page.getByRole("radio", { name: "5 sao", exact: true }).check();
  await page.getByLabel("Tên hiển thị", { exact: true }).fill("Khách kiểm thử");
  await page
    .getByLabel("Nhận xét", { exact: true })
    .fill("Nhận xét trước khi sản phẩm bị ẩn");
  await page.evaluate(() => {
    window.product080Mock.scenario = "write-not-found";
  });
  await page.getByRole("button", { name: "Gửi đánh giá", exact: true }).click();
  await page
    .getByText("Sản phẩm hiện không còn nhận đánh giá.", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Thử lại thao tác", exact: true })
      .count(),
    0,
  );
  assert.equal(await page.locator("textarea").count(), 0);
});
