import { test, expect, type Page } from "@playwright/test";
import { artifactDirectory } from "./artifact-path";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  sourceOrder,
  product as createProduct,
  db,
  customer,
  otherCustomer,
  ownedOrders,
} from "./fixtures";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function open(page: Page, expectedCid?: string) {
  if (expectedCid) {
    await page.addInitScript((cid) => {
      (window as unknown as Record<string, unknown>).__expectedAskCid = cid;
    }, expectedCid);
    page.on("console", (message) => {
      if (message.text().startsWith('{"diagnostic":"ASK_SNAPSHOT026"'))
        console.info(message.text());
    });
    await page.route("**/src/features/ask/Commerce.tsx*", async (route) => {
      const response = await route.fetch(),
        original = await response.text();
      const rewritten = original.replace(
        /import \{([^}]*?)\bonSnapshot\b([^}]*?)\} from ([^;]+);/,
        "import {$1onSnapshot as realOnSnapshot$2} from $3; const onSnapshot = (ref, ...args) => { const options = typeof args[0] === 'function' ? [] : [args.shift()]; const [next, ...rest] = args; return realOnSnapshot(ref, ...options, (snap) => { if (ref.path?.startsWith('askConversations/')) console.info(JSON.stringify({ diagnostic: 'ASK_SNAPSHOT026', pathMatchesFixture: ref.path.endsWith('-' + window.__expectedAskCid), firstTitleMatchesFixture: snap.data()?.turns?.[0]?.answer?.title === 'Reviewed listed product' })); next(snap); }, ...rest); };",
      );
      expect(rewritten).not.toEqual(original);
      await route.fulfill({ response, body: rewritten });
    });
  }
  const currentResponse = expectedCid
    ? page.waitForResponse(
        (r) =>
          new URL(r.url()).pathname.endsWith("/currentAskConversation") &&
          r.request().method() === "POST",
      )
    : null;
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption("customer-a");
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
  if (currentResponse) {
    const response = await currentResponse;
    expect(response.ok()).toBe(true);
    const envelope = await response.json();
    const actualCid = (envelope.result ?? envelope.data)?.conversationId;
    const pointer = (await db.doc(`askCurrent/${customer}`).get()).data()
      ?.conversationId;
    console.info(
      JSON.stringify({
        diagnostic: "ASK_CONTEXT026",
        httpMatchesFixture: actualCid === expectedCid,
        pointerMatchesFixture: pointer === expectedCid,
      }),
    );
    expect(actualCid).toBe(expectedCid);
    expect(pointer).toBe(expectedCid);
  }
  const dialog = page.getByRole("dialog", { name: "SatsunicGo", exact: true });
  const launcher = page.getByRole("button", {
    name: /^(Hỏi SatsunicGo|Ask SatsunicGo)$/,
  });
  const resume = page.getByRole("button", {
    name: /^(Tiếp tục hội thoại|Continue conversation)$/,
  });
  await expect(launcher.or(resume).first()).toBeVisible();
  await launcher.or(resume).first().click();
  await expect(dialog.or(resume).first()).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const width of [390, 768, 1440]) {
  test(`ASK026-C01 sole catalog candidate previews without creating an order at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const { p } = await askSource();
    await db.doc(`products/${p.id}`).update({ catalogOptions: ["Large"] });
    const before = (await ownedOrders()).map((o) => o.id);
    const dialog = await open(page);
    await expect(
      dialog.getByRole("combobox", { name: "Sản phẩm", exact: true }),
    ).toHaveValue(p.id);
    await expect(
      dialog.getByRole("combobox", { name: "Mẫu", exact: true }),
    ).toHaveValue("Large");
    await expect(
      dialog.getByRole("button", {
        name: "Xác nhận lựa chọn và tạo đơn",
        exact: true,
      }),
    ).toBeEnabled();
    await dialog
      .getByRole("combobox", { name: "Sản phẩm", exact: true })
      .focus();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("combobox", { name: "Mẫu", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("spinbutton", { name: "Số lượng", exact: true }),
    ).toBeFocused();
    await dialog.screenshot({
      path: `${artifactDirectory}/ask-catalog-preview-${width}.png`,
    });
    await dialog
      .getByRole("button", {
        name: "Xác nhận lựa chọn và tạo đơn",
        exact: true,
      })
      .scrollIntoViewIfNeeded();
    await dialog.screenshot({
      path: `${artifactDirectory}/ask-catalog-confirm-${width}.png`,
    });
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    expect((await ownedOrders()).map((o) => o.id)).toEqual(before);
  });
}

test("ASK026-C02 same cited product followup preserves reviewed variant and quantity", async ({
  page,
}) => {
  const { p, cid } = await askSource();
  const dialog = await open(page);
  const product = dialog.getByRole("combobox", {
    name: "Sản phẩm",
    exact: true,
  });
  await product.selectOption(p.id);
  await dialog
    .getByRole("combobox", { name: "Mẫu", exact: true })
    .selectOption("Large");
  await dialog
    .getByRole("spinbutton", { name: "Số lượng", exact: true })
    .fill("2");
  await page.route("**/ask", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body:
        "data: " +
        JSON.stringify({
          result: {
            language: "vi",
            title: "Lựa chọn đang xem",
            paragraphs: ["Synthetic model response only"],
            bullets: [],
            sourceIds: [`product:${p.slug}`, `product:${p.slug}`],
            action: "manual",
          },
        }) +
        "\n\n",
    }),
  );
  const input = dialog.getByRole("textbox", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await input.fill("Tôi muốn mua sản phẩm này, giúp tôi kiểm tra lựa chọn");
  await input.press("Enter");
  await expect(
    dialog.getByRole("heading", { name: "Lựa chọn đang xem", exact: true }),
  ).toBeVisible();
  await expect(product).toHaveValue(p.id);
  await expect(
    dialog.getByRole("combobox", { name: "Mẫu", exact: true }),
  ).toHaveValue("Large");
  await expect(
    dialog.getByRole("spinbutton", { name: "Số lượng", exact: true }),
  ).toHaveValue("2");
  await expect(product.locator("option", { hasText: p.title })).toHaveCount(1);
  await expect(
    dialog
      .getByRole("heading", { name: "Lựa chọn đang xem", exact: true })
      .locator("..")
      .getByRole("link"),
  ).toHaveCount(1);
  // Wait for the real saveTurn/current-pointer commit before this shared
  // synthetic identity is seeded for the next independently scoped case.
  await expect
    .poll(async () => {
      const conversation = (
        await db.doc(`askConversations/${customer}-${cid}`).get()
      ).data();
      return conversation?.turns?.at(-1)?.answer?.title;
    })
    .toBe("Lựa chọn đang xem");
});

test("ASK026-S01 existing private support ticket beyond fifty unrelated tickets remains reachable", async ({
  page,
}) => {
  const { cid } = await askSource();
  const orderId = await sourceOrder();
  await db.doc(`askConversations/${customer}-${cid}`).update({ orderId });
  const marker = randomUUID(),
    ticketId = `zzzz-ask026-${marker}`;
  const batch = db.batch();
  for (let i = 0; i < 51; i++)
    batch.set(db.doc(`supportTickets/000-ask026-${marker}-${i}`), {
      ownerId: customer,
      subject: `Synthetic unrelated ${i}`,
      message: "Synthetic unrelated support",
      status: "open",
      version: 1,
      createdAt: 1,
    });
  batch.set(db.doc(`supportTickets/${ticketId}`), {
    ownerId: customer,
    subject: `Ask · ${orderId}`,
    message: "Synthetic existing order support",
    status: "open",
    version: 1,
    createdAt: 1,
  });
  batch.set(db.doc(`supportTickets/000-ask026-${marker}-foreign`), {
    ownerId: otherCustomer,
    subject: `Ask · ${orderId}`,
    message: "Synthetic foreign order support",
    status: "open",
    version: 1,
    createdAt: 1,
  });
  await batch.commit();
  const dialog = await open(page);
  await dialog
    .getByRole("button", { name: "Hỗ trợ / đổi trả trong chat", exact: true })
    .click();
  await expect(
    dialog.getByText("Synthetic existing order support", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Synthetic foreign order support", { exact: true }),
  ).toHaveCount(0);
  let submitted: { action?: string; id?: string } | undefined;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/workspaceCommand")
    )
      submitted = request.postDataJSON()?.data;
  });
  await dialog
    .getByRole("textbox", { name: "Nội dung cần hỗ trợ", exact: true })
    .fill("Synthetic continuing existing ticket");
  await dialog
    .getByRole("button", { name: "Gửi cho nhân viên", exact: true })
    .click();
  await expect.poll(() => submitted?.action).toBe("replyTicket");
  expect(submitted?.id).toBe(ticketId);
  await expect
    .poll(
      async () =>
        (await db.doc(`supportTickets/${ticketId}`).get()).data()?.version,
    )
    .toBe(2);
  expect(
    (
      await db
        .collection("supportTickets")
        .where("ownerId", "==", customer)
        .where("subject", "==", `Ask · ${orderId}`)
        .get()
    ).size,
  ).toBe(1);
});

test("ASK026-C03 ambiguous candidates need a choice and changed sources reset stale variant and quantity", async ({
  page,
}) => {
  const { p, cid } = await askSource();
  const second = await createProduct();
  const conversation = db.doc(`askConversations/${customer}-${cid}`);
  const stored = (await conversation.get()).data()!;
  stored.turns[0].answer.sourceIds.push(`product:${second.slug}`);
  await conversation.update({ turns: stored.turns });
  const before = (await ownedOrders()).map((o) => o.id);
  const dialog = await open(page);
  const product = dialog.getByRole("combobox", {
    name: "Sản phẩm",
    exact: true,
  });
  await expect(product.locator("option")).toHaveCount(3);
  await expect(product).toHaveValue("");
  await product.selectOption(p.id);
  await dialog
    .getByRole("combobox", { name: "Mẫu", exact: true })
    .selectOption("Large");
  await dialog
    .getByRole("spinbutton", { name: "Số lượng", exact: true })
    .fill("3");
  await page.route("**/ask", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body:
        "data: " +
        JSON.stringify({
          result: {
            language: "vi",
            title: "Lựa chọn khác",
            paragraphs: ["Synthetic different candidate only"],
            bullets: [],
            sourceIds: [`product:${second.slug}`],
            action: "manual",
          },
        }) +
        "\n\n",
    }),
  );
  const input = dialog.getByRole("textbox", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await input.fill("Tôi muốn mua sản phẩm khác, giúp tôi xem lại");
  await input.press("Enter");
  await expect(
    dialog.getByRole("heading", { name: "Lựa chọn khác", exact: true }),
  ).toBeVisible();
  await expect(product).toHaveValue(second.id);
  await expect(
    dialog.getByRole("combobox", { name: "Mẫu", exact: true }),
  ).toHaveValue("");
  await expect(
    dialog.getByRole("spinbutton", { name: "Số lượng", exact: true }),
  ).toHaveValue("1");
  await expect(
    dialog.getByRole("button", {
      name: "Xác nhận lựa chọn và tạo đơn",
      exact: true,
    }),
  ).toBeDisabled();
  expect((await ownedOrders()).map((o) => o.id)).toEqual(before);
  await expect
    .poll(
      async () =>
        (await conversation.get()).data()?.turns?.at(-1)?.answer?.title,
    )
    .toBe("Lựa chọn khác");
});

test("ASK026-C04 transient catalog read failure supports explicit retry without creating an order", async ({
  page,
}) => {
  const { p } = await askSource();
  const before = (await ownedOrders()).map((o) => o.id);
  // Fault-inject a catalog getDocs outage until explicit recovery in this dev module;
  // subsequent reads and all workflow commands use the real demo runtime.
  await page.route(
    "**/src/features/ask/CatalogPurchase.tsx*",
    async (route) => {
      const response = await route.fetch();
      const original = await response.text();
      const rewritten = original.replace(
        /import \{([^}]*?)\bgetDocs\b([^}]*?)\} from ([^;]+);/,
        "import {$1getDocs as realGetDocs$2} from $3; const getDocs = (...args) => { if (window.__catalogReadRecovered !== true) { return Promise.reject(new Error('Synthetic catalog read interruption')); } return realGetDocs(...args); };",
      );
      expect(rewritten).not.toEqual(original);
      await route.fulfill({ response, body: rewritten });
    },
  );
  const dialog = await open(page);
  await expect(
    dialog
      .getByRole("alert")
      .filter({ hasText: "Chưa kiểm tra được giá niêm yết" }),
  ).toBeVisible();
  await page.evaluate(() => {
    (
      window as unknown as { __catalogReadRecovered: boolean }
    ).__catalogReadRecovered = true;
  });
  await dialog
    .getByRole("button", { name: "Thử tải lại sản phẩm", exact: true })
    .click();
  await expect(
    dialog.getByRole("combobox", { name: "Sản phẩm", exact: true }),
  ).toHaveValue(p.id);
  expect((await ownedOrders()).map((o) => o.id)).toEqual(before);
  await dialog.screenshot({
    path: `${artifactDirectory}/ask-catalog-read-recovered.png`,
  });
});

test("ASK026-C05 restored English answer keeps catalog actions in English", async ({
  page,
}) => {
  const { p, cid } = await askSource();
  const ref = db.doc(`askConversations/${customer}-${cid}`);
  const stored = (await ref.get()).data()!;
  stored.turns[0].answer.language = "en";
  stored.turns[0].answer.title = "Reviewed listed product";
  await ref.update({ turns: stored.turns });
  const before = (await ownedOrders()).map((o) => o.id);
  const dialog = await open(page, cid);
  await expect(
    dialog.getByRole("heading", {
      name: "Reviewed listed product",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("combobox", { name: "Product", exact: true }),
  ).toHaveValue(p.id);
  await expect(
    dialog.getByRole("button", {
      name: "Confirm selection and create order",
      exact: true,
    }),
  ).toBeVisible();
  expect((await ownedOrders()).map((o) => o.id)).toEqual(before);
  await dialog.screenshot({
    path: `${artifactDirectory}/ask-catalog-english-restored.png`,
  });
});

test("ASK026-C06 reordered identical candidates preserve explicit variant and quantity", async ({
  page,
}) => {
  const { p, cid } = await askSource();
  const second = await createProduct();
  const conversation = db.doc(`askConversations/${customer}-${cid}`);
  const stored = (await conversation.get()).data()!;
  stored.turns[0].answer.sourceIds.push(`product:${second.slug}`);
  await conversation.update({ turns: stored.turns });
  const before = (await ownedOrders()).map((o) => o.id);
  const dialog = await open(page);
  const product = dialog.getByRole("combobox", {
    name: "Sản phẩm",
    exact: true,
  });
  await expect(product.locator("option")).toHaveCount(3);
  await expect(product).toHaveValue("");
  await product.selectOption(p.id);
  await dialog
    .getByRole("combobox", { name: "Mẫu", exact: true })
    .selectOption("Large");
  await dialog
    .getByRole("spinbutton", { name: "Số lượng", exact: true })
    .fill("3");
  await page.route("**/ask", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body:
        "data: " +
        JSON.stringify({
          result: {
            language: "vi",
            title: "Cùng lựa chọn",
            paragraphs: ["Synthetic reordered identical candidates only"],
            bullets: [],
            sourceIds: [`product:${second.slug}`, `product:${p.slug}`],
            action: "manual",
          },
        }) +
        "\n\n",
    }),
  );
  const input = dialog.getByRole("textbox", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await input.fill("Giúp tôi so sánh lại hai lựa chọn đang xem");
  await input.press("Enter");
  await expect(
    dialog.getByRole("heading", { name: "Cùng lựa chọn", exact: true }),
  ).toBeVisible();
  await expect(product).toHaveValue(p.id);
  await expect(
    dialog.getByRole("combobox", { name: "Mẫu", exact: true }),
  ).toHaveValue("Large");
  await expect(
    dialog.getByRole("spinbutton", { name: "Số lượng", exact: true }),
  ).toHaveValue("3");
  await expect(
    dialog.getByRole("button", {
      name: "Xác nhận lựa chọn và tạo đơn",
      exact: true,
    }),
  ).toBeEnabled();
  expect((await ownedOrders()).map((o) => o.id)).toEqual(before);
  await expect
    .poll(
      async () =>
        (await conversation.get()).data()?.turns?.at(-1)?.answer?.title,
    )
    .toBe("Cùng lựa chọn");
});
