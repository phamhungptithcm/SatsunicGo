import { mkdirSync, writeFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { setup, chat, commands, type Fixture } from "./ask-workcell-fixture";

async function revealReceiptItems(page: Page, english: boolean, name: string) {
  const item = page
    .getByLabel(english ? "Details to confirm" : "Nội dung cần xác nhận")
    .getByText("Synthetic product · Blue · 1", { exact: true });
  const group = item.locator("..");
  const scroll = await group.evaluate((el) => {
    const task = el.closest("section")!;
    let scroller: HTMLElement | null = el.parentElement;
    while (
      scroller &&
      task.contains(scroller) &&
      !(
        /auto|scroll/.test(getComputedStyle(scroller).overflowY) &&
        scroller.scrollHeight > scroller.clientHeight
      )
    )
      scroller = scroller.parentElement;
    if (!scroller || !task.contains(scroller))
      throw new Error("Receipt details have no actual task scroller");
    const port = scroller.getBoundingClientRect();
    const footer = task.querySelector("footer")!;
    const footerRect = footer.getBoundingClientRect();
    const bottom =
      getComputedStyle(footer).position === "sticky"
        ? Math.min(port.bottom, footerRect.top)
        : port.bottom;
    const rect = el.getBoundingClientRect();
    scroller.scrollTop +=
      (rect.top + rect.bottom) / 2 - (port.top + bottom) / 2;
    return {
      method:
        "Scroll actual task overflow container to full receipt item group",
      scrollTop: scroller.scrollTop,
      scrollHeight: scroller.scrollHeight,
      clientHeight: scroller.clientHeight,
    };
  });
  await expect(group).toBeInViewport({ ratio: 0.95 });
  await expect
    .poll(() =>
      group.evaluate((el) => {
        const textRects = [...el.querySelectorAll("dt,dd")].flatMap((text) => {
          const range = document.createRange();
          range.selectNodeContents(text);
          return [...range.getClientRects()].map((r) => {
            const hit = document.elementFromPoint(
              r.left + r.width / 2,
              r.top + r.height / 2,
            );
            return !!hit && text.contains(hit);
          });
        });
        return textRects.length > 1 && textRects.every(Boolean);
      }),
    )
    .toBe(true);
  const rect = await group.boundingBox();
  writeFileSync(
    `output/ask-integration-4/${name}.json`,
    JSON.stringify({ ...scroll, rect, unobscuredText: true }, null, 2),
  );
}

for (const english of [false, true]) {
  test(`first request reviews, exact yes sends once ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    const errors = await setup(page, "draft", english);
    await chat(page, english ? "submit buying request" : "gửi yêu cầu mua hộ");
    expect(await commands(page, "submitRequest")).toHaveLength(0);
    await expect(
      page
        .getByRole("heading", {
          name: english ? "Send buying request" : "Gửi yêu cầu mua hộ",
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await page.screenshot({
      path: `output/ask-integration-4/review-request-${english ? "en" : "vi"}.png`,
    });
    await chat(page, english ? "yes" : "đồng ý");
    expect(await commands(page, "submitRequest")).toHaveLength(1);
    await chat(page, english ? "yes" : "đồng ý");
    expect(await commands(page, "submitRequest")).toHaveLength(1);
    expect(errors).toEqual([]);
  });
  test(`native button and chat share reviewed payload ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    const errors = await setup(page, "draft", english);
    await page
      .getByText(
        english ? "Enter details if needed" : "Điền thông tin nếu cần",
        { exact: true },
      )
      .click();
    await page.locator('input[name="quantity-0"]').fill("3");
    await expect(
      page.getByRole("button", {
        name: english ? "Review request" : "Kiểm tra yêu cầu",
        exact: true,
      }),
    ).toBeDisabled();
    await page
      .getByRole("button", {
        name: english ? "Save draft" : "Lưu bản nháp",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: english ? "Review request" : "Kiểm tra yêu cầu",
        exact: true,
      })
      .click();
    expect(await commands(page, "submitRequest")).toHaveLength(0);
    await page
      .getByRole("button", {
        name: english ? "Send buying request" : "Gửi yêu cầu mua hộ",
        exact: true,
      })
      .click();
    const sent = await commands(page, "submitRequest");
    expect(sent).toHaveLength(1);
    expect(sent[0].payload.items![0].quantity).toBe(3);
    expect(errors).toEqual([]);
  });
}
test("closed review must reopen before yes; Escape returns to chat first", async ({
  page,
}) => {
  const errors = await setup(page);
  await chat(page, "gửi yêu cầu mua hộ");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await chat(page, "đồng ý");
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  await chat(page, "đồng ý");
  expect(await commands(page, "submitRequest")).toHaveLength(1);
  expect(errors).toEqual([]);
});
test("history including latest turn stays read only across locale changes", async ({
  page,
}) => {
  const errors = await setup(page);
  await chat(page, "gửi yêu cầu mua hộ");
  await page
    .getByRole("navigation", { name: "Các điểm hội thoại" })
    .getByRole("button")
    .last()
    .click();
  await expect(
    page
      .getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true })
      .filter({ visible: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Return to current conversation" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to current conversation" })
    .click();
  await chat(page, "yes");
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("ordinary answer invalidates consent and yes requests a fresh review", async ({
  page,
}) => {
  const errors = await setup(page);
  await chat(page, "gửi yêu cầu mua hộ");
  await chat(page, "Tell me something unrelated");
  await expect
    .poll(async () => (await commands(page, "saveTurn")).length)
    .toBeGreaterThan(0);
  await chat(page, "yes");
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("unknown action retains identity and exposes reconciliation outside locked form", async ({
  page,
}) => {
  const errors = await setup(page, "unknown-submit");
  await chat(page, "gửi yêu cầu mua hộ");
  await chat(page, "đồng ý");
  const sent = await commands(page, "submitRequest");
  expect(sent).toHaveLength(1);
  await expect(
    page.getByRole("button", { name: "Đối chiếu tác vụ", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Đối chiếu tác vụ", exact: true })
    .click();
  expect(await commands(page, "submitRequest")).toHaveLength(1);
  expect(await commands(page, "resume")).toHaveLength(1);
  await expect(page.locator('[data-review="true"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Kiểm tra yêu cầu", exact: true }),
  ).toBeEnabled();
  await chat(page, "đồng ý");
  expect(await commands(page, "submitRequest")).toHaveLength(1);
  await expect(page.getByLabel("Nội dung cần xác nhận")).toBeVisible();
  expect(errors).toEqual([]);
});
test("dirty recipient survives order revision and remains unsaved", async ({
  page,
}) => {
  const errors = await setup(page, "recipient");
  const details = page.locator("details").filter({ hasText: "Giao đến" });
  await details.locator("summary").click();
  await details.getByRole("button", { name: "Kiểm tra / sửa địa chỉ" }).click();
  await page
    .getByRole("textbox", { name: "Địa chỉ nhận", exact: true })
    .fill("Synthetic unsaved address B");
  await page.evaluate(() =>
    (window as unknown as { qaEmitOrder: (value: object) => void }).qaEmitOrder(
      { version: 3 },
    ),
  );
  await expect(
    page.getByRole("textbox", { name: "Địa chỉ nhận", exact: true }),
  ).toHaveValue("Synthetic unsaved address B");
  await expect(
    page.getByRole("button", { name: "Kiểm tra báo giá và mức cọc" }),
  ).toBeDisabled();
  expect(await commands(page, "acceptQuote")).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("auth A B A cannot resurrect reviewed consent or private draft", async ({
  page,
}) => {
  const errors = await setup(page);
  await chat(page, "gửi yêu cầu mua hộ");
  await page.evaluate(() =>
    (window as unknown as { qaSwitchTo: (uid: string) => void }).qaSwitchTo(
      "qa-other",
    ),
  );
  await page.evaluate(() =>
    (window as unknown as { qaSwitchTo: (uid: string) => void }).qaSwitchTo(
      "qa-panel-owner",
    ),
  );
  await expect(page.locator('[data-review="true"]')).toHaveCount(0);
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(errors).toEqual([]);
});
for (const width of [320, 390, 768, 1440])
  test(`long forms have bounded independent scroll and reachable composer at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = await setup(page, "performance");
    await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
    const bounds = await page.evaluate(() => {
      const dialog = document.querySelector("dialog")!,
        task = document.querySelector(
          'section[aria-labelledby="ask-task-heading"]',
        )!,
        form = task.querySelector("form")!;
      return {
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        task: task.getBoundingClientRect().toJSON(),
        dialog: dialog.getBoundingClientRect().toJSON(),
        form: form.getBoundingClientRect().toJSON(),
        composer: dialog
          .querySelector('input[aria-label="Hỏi SatsunicGo"]')!
          .getBoundingClientRect()
          .toJSON(),
        scrolls: [task, ...task.querySelectorAll("*")].filter((el) => {
          const style = getComputedStyle(el);
          return (
            /auto|scroll/.test(style.overflowY) &&
            el.scrollHeight > el.clientHeight
          );
        }).length,
      };
    });
    expect(bounds.pageOverflow).toBe(false);
    expect(bounds.composer.bottom).toBeLessThanOrEqual(bounds.dialog.bottom);
    expect(bounds.task.height).toBeLessThan(bounds.dialog.height);
    expect(bounds.scrolls).toBe(1);
    await page.screenshot({
      path: `output/ask-integration-4/workcell-${width}.png`,
    });
    expect(errors).toEqual([]);
  });

for (const [mode, initial, action, label, moneyLabel, amount] of [
  [
    "recipient",
    "chấp nhận báo giá",
    "acceptQuote",
    "Chấp nhận báo giá",
    "Tiền cọc",
    "500",
  ],
  [
    "final",
    "duyệt tổng phí cuối",
    "approveFinal",
    "Xác nhận tổng tiền cuối",
    "Tổng tiền cuối",
    "1.300",
  ],
  [
    "receipt",
    "đã nhận đủ hàng",
    "confirmReceipt",
    "Xác nhận đã nhận đủ hàng",
    "",
    "",
  ],
] as const) {
  test(`verified ${action} reviews exact order and amount before contextual consent`, async ({
    page,
  }) => {
    const errors = await setup(page, mode);
    await chat(page, initial);
    const review = page.getByLabel("Nội dung cần xác nhận");
    await expect(review).toContainText("qa-panel-order");
    await expect(review).toContainText(label);
    if (moneyLabel) {
      await expect(review).toContainText(moneyLabel);
      await expect(review).toContainText(amount);
    }
    if (action === "acceptQuote") {
      await expect(review).toContainText("qa-v1");
      await expect(review).toContainText("Tổng báo giá");
    }
    if (action === "confirmReceipt") {
      await expect(review).toContainText("mọi sản phẩm");
      await expect(
        review.getByText("Xác nhận đã nhận đủ hàng sẽ hoàn tất đơn hàng.", {
          exact: true,
        }),
      ).toBeInViewport();
      await expect(review).toContainText("Synthetic product");
      await page.screenshot({
        path: "output/ask-integration-4/review-confirmReceipt-initial.png",
      });
      await revealReceiptItems(page, false, "receipt-review-readability");
    }
    await page.screenshot({
      path: `output/ask-integration-4/review-${action}.png`,
    });
    expect(await commands(page, action)).toHaveLength(0);
    await chat(page, "đồng ý");
    await expect
      .poll(async () => (await commands(page, action)).length)
      .toBe(1);
    expect(await commands(page, "createPaymentLink")).toHaveLength(0);
    expect(errors).toEqual([]);
  });
}
for (const english of [false, true])
  test(`edit and approval in one sentence only edits ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    const errors = await setup(page, "draft", english);
    await chat(page, english ? "submit buying request" : "gửi yêu cầu mua hộ");
    await chat(page, english ? "quantity 2 and yes" : "số lượng 2 và đồng ý");
    expect(await commands(page, "submitRequest")).toHaveLength(0);
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            (window as unknown as Fixture).qaConversation.draft.items[0]
              .quantity,
        ),
      )
      .toBe(2);
    await chat(page, english ? "yes" : "đồng ý");
    expect(await commands(page, "submitRequest")).toHaveLength(0);
    await chat(page, english ? "yes" : "đồng ý");
    await expect
      .poll(async () => (await commands(page, "submitRequest")).length)
      .toBe(1);
    expect(
      (await commands(page, "submitRequest"))[0].payload.items![0].quantity,
    ).toBe(2);
    expect(errors).toEqual([]);
  });
test("expired quote and updated order cannot reuse consent", async ({
  page,
}) => {
  const errors = await setup(page, "recipient");
  await chat(page, "chấp nhận báo giá");
  await page.evaluate(() =>
    (window as unknown as Fixture).qaEmitOrder({ version: 3, quoteVersion: 2 }),
  );
  await expect(page.locator('[data-review="true"]')).toHaveCount(0);
  await chat(page, "đồng ý");
  expect(await commands(page, "acceptQuote")).toHaveLength(0);
  await page.evaluate(() =>
    (window as unknown as Fixture).qaEmitOrder({
      version: 4,
      quote: {
        ...(window as unknown as Fixture).qaOrder.quote,
        expiresAt: Date.now() - 1,
      },
    }),
  );
  await chat(page, "đồng ý");
  expect(await commands(page, "acceptQuote")).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("profile task preserves typed values across chat view and history prevents account editing", async ({
  page,
}) => {
  const errors = await setup(page);
  await page
    .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
    .click();
  await expect(page.locator(".askCustomerWorkspace")).toContainText(
    "Tên hiển thị",
  );
  const name = page.getByRole("textbox", { name: "Tên hiển thị" });
  await name.fill("Synthetic private profile");
  await page.getByRole("button", { name: "Về hội thoại", exact: true }).click();
  await page
    .getByRole("button", { name: "Tác vụ hiện tại", exact: true })
    .click();
  await expect(name).toHaveValue("Synthetic private profile");
  await page
    .getByRole("button", { name: "Hồ sơ và địa chỉ", exact: true })
    .click();
  await chat(page, "gửi yêu cầu mua hộ");
  await page
    .getByRole("navigation", { name: "Các điểm hội thoại" })
    .getByRole("button")
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Về hội thoại hiện tại" }),
  ).toBeVisible();
  await expect(page.locator('input[name="displayName"]')).toBeDisabled();
  await expect(name).not.toBeVisible();
  expect(await commands(page, "workspaceCommand")).toHaveLength(0);
  expect(errors).toEqual([]);
});
test("warm task/chat switches remain bounded with keyboard and reduced motion", async ({
  page,
}) => {
  const errors = await setup(page, "performance");
  const measurements = await page.evaluate(async () => {
    const tasks = () =>
      [...document.querySelectorAll("button")].find(
        (el) => el.textContent === "Tác vụ hiện tại",
      )!;
    const chat = () =>
      [...document.querySelectorAll("button")].find(
        (el) => el.textContent === "Hội thoại",
      )!;
    const samples = [];
    const initial = document.querySelectorAll("*").length;
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      chat().click();
      await new Promise(requestAnimationFrame);
      tasks().click();
      await new Promise(requestAnimationFrame);
      samples.push(performance.now() - start);
    }
    return {
      samples,
      initial,
      final: document.querySelectorAll("*").length,
      windows: document.querySelectorAll(
        'section[aria-labelledby="ask-task-heading"]',
      ).length,
      waypoints: document
        .querySelector('nav[aria-label="Các điểm hội thoại"]')!
        .querySelectorAll("button").length,
    };
  });
  expect(measurements.final).toBeLessThanOrEqual(measurements.initial + 10);
  expect(measurements.windows).toBe(1);
  expect(measurements.waypoints).toBe(24);
  expect(Math.max(...measurements.samples)).toBeLessThan(500);
  await page.keyboard.press("Escape");
  await expect(
    page
      .getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true })
      .filter({ visible: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.screenshot({
    path: "output/ask-integration-4/closed-keyboard.png",
  });
  writeFileSync(
    "output/ask-integration-4/performance.json",
    JSON.stringify(measurements, null, 2),
  );
  expect(errors).toEqual([]);
});

test("locale change during dispatch settles owned verified outcome and never resends", async ({
  page,
}) => {
  const errors = await setup(page, "held-submit");
  await chat(page, "gửi yêu cầu mua hộ");
  await chat(page, "đồng ý");
  await expect
    .poll(async () => (await commands(page, "submitRequest")).length)
    .toBe(1);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.evaluate(() => (window as unknown as Fixture).qaRelease());
  await expect(
    page.getByRole("status").filter({ hasText: "The action was recorded" }),
  ).toBeVisible();
  expect(await commands(page, "submitRequest")).toHaveLength(1);
  expect(errors).toEqual([]);
});
for (const english of [false, true])
  test(`catalog chat selection reviews server-read price and terms ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    const errors = await setup(page, "catalog", english);
    await chat(
      page,
      english
        ? "find synthetic catalog product"
        : "tìm synthetic catalog product",
    );
    await chat(page, english ? "select product 1" : "chọn sản phẩm 1");
    await chat(page, english ? "quantity 2" : "số lượng 2");
    await page
      .getByRole("button", {
        name: english ? "Review selection" : "Kiểm tra lựa chọn",
        exact: true,
      })
      .click();
    const review = page.getByLabel(
      english ? "Details to confirm" : "Nội dung cần xác nhận",
    );
    await expect(review).toContainText("catalog-terms-v1");
    await expect(review).toContainText(english ? "1,400" : "1.400");
    expect(await commands(page, "catalogCheckout")).toHaveLength(0);
    await chat(page, english ? "yes" : "đồng ý");
    await expect
      .poll(async () => (await commands(page, "catalogCheckout")).length)
      .toBe(1);
    expect(errors).toEqual([]);
  });

test("chat edit opens current task from conversation and never auto-submits", async ({
  page,
}) => {
  const errors = await setup(page);
  await page.getByRole("button", { name: "Hội thoại", exact: true }).click();
  await expect(
    page.locator('section[aria-labelledby="ask-task-heading"]'),
  ).not.toBeVisible();
  await chat(page, "số lượng 2");
  await expect(
    page.locator('section[aria-labelledby="ask-task-heading"]'),
  ).toBeVisible();
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(errors).toEqual([]);
});
for (const english of [false, true])
  test(`mobile quote monetary summary is visible before confirming ${english ? "EN" : "VI"}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    const errors = await setup(page, "recipient", english);
    await chat(page, english ? "accept quote" : "chấp nhận báo giá");
    const review = page.getByLabel(
      english ? "Details to confirm" : "Nội dung cần xác nhận",
    );
    const amount = review
      .locator("div")
      .filter({
        has: page
          .locator("dt")
          .filter({ hasText: english ? "Deposit" : "Tiền cọc" }),
      })
      .first();
    const rect = await amount.boundingBox();
    const confirm = page.getByRole("button", {
      name: english ? "Accept quote" : "Chấp nhận báo giá",
      exact: true,
    });
    const buttonRect = await confirm.boundingBox();
    expect(rect).not.toBeNull();
    expect(buttonRect).not.toBeNull();
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(buttonRect!.y);
    await page.screenshot({
      path: `output/ask-integration-4/mobile-quote-${english ? "en" : "vi"}.png`,
    });
    expect(await commands(page, "acceptQuote")).toHaveLength(0);
    expect(errors).toEqual([]);
  });

test("anonymous chat draft opens owned view without durable action authority", async ({
  page,
}) => {
  const errors = await setup(page, "anonymous");
  await chat(page, "Bạn có thể giải thích giúp tôi phần này không?");
  await expect(
    page.getByRole("region", { name: "Yêu cầu mua hộ", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Yêu cầu mua hộ trong chat" }),
  ).toContainText("Synthetic product");
  await chat(page, "gửi yêu cầu mua hộ");
  await expect(
    page.getByRole("heading", { name: "Đăng nhập để tiếp tục" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await chat(page, "đồng ý");
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(await commands(page, "saveDraft")).toHaveLength(0);
  expect(errors).toEqual([]);
});

test("chat quantity merges with unsaved manual notes across task switches", async ({
  page,
}) => {
  const errors = await setup(page);
  await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
  await page.locator('textarea[name="notes"]').fill("Unsaved note must remain");
  await chat(page, "số lượng 2");
  await expect(page.locator('input[name="quantity-0"]')).toHaveValue("2");
  await expect(page.locator('textarea[name="notes"]')).toHaveValue(
    "Unsaved note must remain",
  );
  await page.getByRole("button", { name: "Hội thoại", exact: true }).click();
  await page
    .getByRole("button", { name: "Tác vụ hiện tại", exact: true })
    .click();
  await expect(page.locator('input[name="quantity-0"]')).toHaveValue("2");
  await expect(page.locator('textarea[name="notes"]')).toHaveValue(
    "Unsaved note must remain",
  );
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(errors).toEqual([]);
});

for (const [field, manual, first, second, value] of [
  ["quantity-0", "3", "số lượng 2", "số lượng 1", "1"],
  ["variant-0", "Red", "size M", "size Blue", "Blue"],
  ["market", "JP", "mua từ Hàn Quốc", "mua từ Mỹ", "US"],
] as const) {
  test(`ABA manual ${field} cannot replace latest chat edit in saved review`, async ({
    page,
  }) => {
    const errors = await setup(page);
    await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
    const input = page.locator(`[name="${field}"]`);
    if (field === "market") await input.selectOption(manual);
    else await input.fill(manual);
    await page
      .locator('textarea[name="notes"]')
      .fill("Unsaved notes survive ABA");
    await chat(page, first);
    await expect(input).toHaveValue(
      field === "market" ? "KR" : field === "variant-0" ? "M" : "2",
    );
    await chat(page, second);
    await expect(input).toHaveValue(value);
    await expect(page.locator('textarea[name="notes"]')).toHaveValue(
      "Unsaved notes survive ABA",
    );
    await page
      .getByRole("button", { name: "Lưu bản nháp", exact: true })
      .click();
    await expect
      .poll(async () => (await commands(page, "saveDraft")).at(-1)?.payload)
      .toMatchObject({
        market: "US",
        items: [{ quantity: 1, variant: "Blue" }],
        notes: "Unsaved notes survive ABA",
      });
    await page
      .getByRole("button", { name: "Kiểm tra yêu cầu", exact: true })
      .click();
    await expect(page.getByLabel("Nội dung cần xác nhận")).toContainText(
      "Synthetic product · Blue · 1",
    );
    await expect(page.getByLabel("Nội dung cần xác nhận")).toContainText(
      "Unsaved notes survive ABA",
    );
    expect(await commands(page, "submitRequest")).toHaveLength(0);
    expect(errors).toEqual([]);
  });
}

test("a fresh prepared item replaces dirty name and link while keeping unsaved notes", async ({
  page,
}) => {
  const errors = await setup(page, "llm-edit");
  await page.getByText("Điền thông tin nếu cần", { exact: true }).click();
  await page.locator('input[name="name-0"]').fill("Old manual product");
  await page
    .locator('input[name="url-0"]')
    .fill("https://merchant.example.invalid/old-item");
  await page
    .locator('textarea[name="notes"]')
    .fill("Keep unrelated unsaved notes");
  await chat(page, "Đổi sang một sản phẩm khác giúp tôi được không?");
  await expect(page.locator('input[name="name-0"]')).toHaveValue(
    "New synthetic product",
  );
  await expect(page.locator('input[name="url-0"]')).toHaveValue(
    "https://merchant.example.invalid/new-item",
  );
  await expect(page.locator('textarea[name="notes"]')).toHaveValue(
    "Keep unrelated unsaved notes",
  );
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect
    .poll(async () => (await commands(page, "saveDraft")).at(-1)?.payload)
    .toMatchObject({
      items: [
        {
          name: "New synthetic product",
          url: "https://merchant.example.invalid/new-item",
        },
      ],
      notes: "Keep unrelated unsaved notes",
    });
  expect(await commands(page, "submitRequest")).toHaveLength(0);
  expect(errors).toEqual([]);
});

const out = "output/ask-integration-4/accessibility";
mkdirSync(out, { recursive: true });
async function doubleText(page: Page) {
  return page.evaluate(() => {
    const elements = [
      ...document.querySelectorAll<HTMLElement>("body *"),
    ].filter((e) => getComputedStyle(e).display !== "none");
    const values = elements.map((el) => {
      const s = getComputedStyle(el);
      return {
        el,
        font: parseFloat(s.fontSize),
        line: parseFloat(s.lineHeight),
      };
    });
    for (const { el, font, line } of values) {
      if (Number.isFinite(font))
        el.style.setProperty("font-size", `${font * 2}px`, "important");
      if (Number.isFinite(line))
        el.style.setProperty("line-height", `${line * 2}px`, "important");
    }
    return {
      method:
        "200% computed-font and line-height override, text-only proxy; not browser zoom",
      elements: values.length,
    };
  });
}
async function layout(page: Page, name: string) {
  const info = await page.evaluate(() => {
    const task = document.querySelector<HTMLElement>(
      'section[aria-labelledby="ask-task-heading"]',
    )!;
    const composer = document.querySelector<HTMLElement>(
      'dialog input[aria-label="Hỏi SatsunicGo"],dialog input[aria-label="Ask SatsunicGo"]',
    )!;
    const clipped = [...document.querySelectorAll<HTMLElement>("dialog button")]
      .filter((el) => {
        if (
          !el.innerText.trim() ||
          el.getClientRects().length === 0 ||
          el.closest(
            'nav[aria-label="Các điểm hội thoại"],nav[aria-label="Conversation waypoints"]',
          )
        )
          return false;
        const r = document.createRange();
        r.selectNodeContents(el);
        const t = r.getBoundingClientRect(),
          b = el.getBoundingClientRect();
        return (
          t.left < b.left - 2 ||
          t.right > b.right + 2 ||
          t.top < b.top - 2 ||
          t.bottom > b.bottom + 2
        );
      })
      .map((el) => el.innerText);
    return {
      width: innerWidth,
      height: innerHeight,
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      taskOverflow: task.scrollWidth > task.clientWidth + 2,
      composer: composer.getBoundingClientRect().toJSON(),
      clippedButtons: clipped,
    };
  });
  writeFileSync(`${out}/${name}-layout.json`, JSON.stringify(info, null, 2));
  await page.screenshot({ path: `${out}/${name}.png` });
  expect(info.pageOverflow).toBe(false);
  expect(info.taskOverflow).toBe(false);
  expect(info.clippedButtons).toEqual([]);
  expect(info.composer.bottom).toBeLessThanOrEqual(info.height);
  const navigation = page
    .getByRole("button", { name: "VI", exact: true })
    .locator("../..");
  const dialog = await page.getByRole("dialog").boundingBox();
  expect(dialog).not.toBeNull();
  for (const button of await navigation.getByRole("button").all()) {
    await expect(button).toBeInViewport({ ratio: 0.95 });
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(dialog!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(dialog!.x + dialog!.width);
  }
  await expect(
    page
      .getByRole("textbox", { name: /Hỏi SatsunicGo|Ask SatsunicGo/ })
      .filter({ visible: true }),
  ).toBeInViewport();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Accessibility.enable");
  const ax = await cdp.send("Accessibility.getFullAXTree");
  writeFileSync(
    `${out}/${name}-ax.json`,
    JSON.stringify(
      {
        scope:
          "Browser accessibility-tree proxy only; native VoiceOver NOT_RUN",
        ...ax,
      },
      null,
      2,
    ),
  );
  await cdp.detach();
}
for (const english of [false, true])
  for (const width of [390, 1280])
    for (const kind of ["long-form", "quote", "receipt"] as const) {
      test(`200% text ${kind} ${english ? "EN" : "VI"} ${width}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        const errors = await setup(
          page,
          kind === "quote"
            ? "recipient"
            : kind === "receipt"
              ? "receipt"
              : "draft",
          english,
        );
        if (kind === "long-form")
          await page
            .getByText(
              english ? "Enter details if needed" : "Điền thông tin nếu cần",
              { exact: true },
            )
            .click();
        else
          await chat(
            page,
            kind === "quote"
              ? english
                ? "accept quote"
                : "chấp nhận báo giá"
              : english
                ? "confirm all items received"
                : "đã nhận đủ hàng",
          );
        const scaling = await doubleText(page);
        expect(scaling.elements).toBeGreaterThan(50);
        const name = `text200-${kind}-${english ? "en" : "vi"}-${width}`;
        await layout(page, name);
        if (kind === "long-form") {
          const notes = page.locator('textarea[name="notes"]');
          await notes.scrollIntoViewIfNeeded();
          await expect(notes).toBeInViewport({ ratio: 0.95 });
          await notes.click();
          await notes.fill("Synthetic retained note");
          await expect(notes).toHaveValue("Synthetic retained note");
          const save = page.getByRole("button", {
            name: english ? "Save draft" : "Lưu bản nháp",
            exact: true,
          });
          await save.scrollIntoViewIfNeeded();
          await expect(save).toBeInViewport({ ratio: 0.95 });
        } else {
          const review = page.getByLabel(
            english ? "Details to confirm" : "Nội dung cần xác nhận",
          );
          await expect(review).toContainText("qa-panel-order");
          if (kind === "quote")
            await expect(review).toContainText(
              english ? "Quoted total" : "Tổng báo giá",
            );
          else {
            await revealReceiptItems(page, english, `${name}-readability`);
            await page.screenshot({
              path: `${out}/${name}-readability.png`,
            });
            await expect(review).toContainText(
              english ? "completes the order" : "hoàn tất đơn hàng",
            );
          }
          await page
            .getByRole("button", {
              name:
                kind === "quote"
                  ? english
                    ? "Accept quote"
                    : "Chấp nhận báo giá"
                  : english
                    ? "Confirm all items received"
                    : "Xác nhận đã nhận đủ hàng",
              exact: true,
            })
            .scrollIntoViewIfNeeded();
          await expect(
            page.getByRole("button", {
              name:
                kind === "quote"
                  ? english
                    ? "Accept quote"
                    : "Chấp nhận báo giá"
                  : english
                    ? "Confirm all items received"
                    : "Xác nhận đã nhận đủ hàng",
              exact: true,
            }),
          ).toBeInViewport({ ratio: 0.95 });
          expect(
            await commands(
              page,
              kind === "quote" ? "acceptQuote" : "confirmReceipt",
            ),
          ).toHaveLength(0);
        }
        expect(errors).toEqual([]);
      });
    }

for (const english of [false, true])
  for (const kind of ["long-form", "quote", "receipt"] as const)
    for (const height of [450, 650])
      test(`short-height reflow and keyboard ${kind} ${english ? "EN" : "VI"} ${height}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 640, height });
        const errors = await setup(
          page,
          kind === "quote"
            ? "recipient"
            : kind === "receipt"
              ? "receipt"
              : "draft",
          english,
        );
        if (kind === "long-form") {
          await page
            .getByText(
              english ? "Enter details if needed" : "Điền thông tin nếu cần",
              { exact: true },
            )
            .click();
          const notes = page.locator('textarea[name="notes"]');
          await notes.focus();
          await notes.press("Tab");
          const save = page.getByRole("button", {
            name: english ? "Save draft" : "Lưu bản nháp",
            exact: true,
          });
          await expect(save).toBeFocused();
          await expect(save).toBeInViewport({ ratio: 0.95 });
          await save.press("Shift+Tab");
          await expect(notes).toBeFocused();
          await expect(notes).toBeInViewport({ ratio: 0.95 });
          const unobscured = await notes.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return (
              document.elementFromPoint(
                r.left + r.width / 2,
                r.top + r.height / 2,
              ) === el
            );
          });
          expect(unobscured).toBe(true);
        } else {
          await chat(
            page,
            kind === "quote"
              ? english
                ? "accept quote"
                : "chấp nhận báo giá"
              : english
                ? "confirm all items received"
                : "đã nhận đủ hàng",
          );
          const edit = page.getByRole("button", {
            name: english ? "Edit details" : "Sửa thông tin",
            exact: true,
          });
          await edit.focus();
          await edit.press("Tab");
          const confirm = page.getByRole("button", {
            name:
              kind === "quote"
                ? english
                  ? "Accept quote"
                  : "Chấp nhận báo giá"
                : english
                  ? "Confirm all items received"
                  : "Xác nhận đã nhận đủ hàng",
            exact: true,
          });
          await expect(confirm).toBeFocused();
          await expect(confirm).toBeInViewport({ ratio: 0.95 });
          const unobscured = await confirm.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return (
              document.elementFromPoint(
                r.left + r.width / 2,
                r.top + r.height / 2,
              ) === el
            );
          });
          expect(unobscured).toBe(true);
          expect(
            await commands(
              page,
              kind === "quote" ? "acceptQuote" : "confirmReceipt",
            ),
          ).toHaveLength(0);
        }
        const task = page.locator(
          'section[aria-labelledby="ask-task-heading"]',
        );
        const branch = await task.evaluate((el) => ({
          height: el.parentElement!.clientHeight,
          footer: getComputedStyle(el.querySelector("footer")!).position,
        }));
        if (height === 650) {
          expect(branch.height).toBeGreaterThan(220);
          expect(branch.height).toBeLessThanOrEqual(360);
          expect(branch.footer).toBe("sticky");
        } else {
          expect(branch.height).toBeLessThanOrEqual(220);
          expect(branch.footer).toBe("static");
        }
        expect(
          await task.evaluate((el) => getComputedStyle(el).overflowY),
        ).toBe("auto");
        await expect(
          page
            .getByRole("textbox", { name: /Hỏi SatsunicGo|Ask SatsunicGo/ })
            .filter({ visible: true }),
        ).toBeInViewport();
        expect(errors).toEqual([]);
      });
