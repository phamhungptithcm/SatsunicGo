import { test, expect } from "@playwright/test";
import {
  seedIdentities,
  closeFixtures,
  askSource,
  db,
  customer,
} from "./fixtures";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
test("ASK026 initial owned durable snapshot must restore before composer permits a new turn", async ({
  page,
}) => {
  const { cid } = await askSource();
  const before = (
    await db.doc(`askConversations/${customer}-${cid}`).get()
  ).data();
  // Hold delivery of only the first real conversation snapshot. Auth, callable,
  // Firestore subscription and later delivery remain the actual local runtime.
  await page.route("**/src/features/ask/Commerce.tsx*", async (route) => {
    const response = await route.fetch(),
      original = await response.text();
    const rewritten = original.replace(
      /import \{([^}]*?)\bonSnapshot\b([^}]*?)\} from ([^;]+);/,
      "import {$1onSnapshot as realOnSnapshot$2} from $3; const onSnapshot = (ref, ...args) => { const options = typeof args[0] === 'function' ? [] : [args.shift()]; const [next, ...rest] = args; return realOnSnapshot(ref, ...options, (snap) => { if (ref.path?.startsWith('askConversations/') && !window.__askInitialHeld) { window.__askInitialHeld = true; window.__releaseAskInitial = () => next(snap); return; } next(snap); }, ...rest); };",
    );
    expect(rewritten).not.toEqual(original);
    await route.fulfill({ response, body: rewritten });
  });
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
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          (window as unknown as Record<string, unknown>).__askInitialHeld,
        ),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Hỏi SatsunicGo", exact: true })
    .click();
  const composer = page.getByRole("textbox", {
    name: "Hỏi SatsunicGo",
    exact: true,
  });
  await expect(composer).toBeDisabled();
  await page.evaluate(() => {
    const release = (window as unknown as Record<string, unknown>)
      .__releaseAskInitial as () => void;
    release();
  });
  await expect(composer).toBeEnabled();
  await page
    .getByRole("button", { name: "Tiếp tục hội thoại", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Sản phẩm thử nghiệm", { exact: true }),
  ).toBeVisible();
  expect(
    (await db.doc(`askConversations/${customer}-${cid}`).get()).data(),
  ).toEqual(before);
});

test("ASK026 older same-identity restoration response cannot replace a newer verified context", async ({
  page,
}) => {
  const first = await askSource();
  let releaseFirst!: () => void, firstStarted!: () => void;
  const held = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const started = new Promise<void>((resolve) => {
    firstStarted = resolve;
  });
  page.on("console", (message) => {
    if (message.text().startsWith('{"diagnostic":"ASK_CACHE026"'))
      console.info(message.text());
  });
  let reads = 0,
    writes = 0;
  page.on("request", (r) => {
    if (
      /\/(askWorkflow|command|catalogCheckout|workspaceCommand)$/.test(
        new URL(r.url()).pathname,
      )
    )
      writes++;
  });
  // Replay a declared same-user auth notification with the actual SDK User;
  // both restoration HTTP reads and subscriptions use the real demo runtime.
  await page.route("**/src/features/ask/Commerce.tsx*", async (route) => {
    const response = await route.fetch(),
      original = await response.text();
    let rewritten = original.replace(
      /import \{([^}]*?)\bonAuthStateChanged\b([^}]*?)\} from ([^;]+);/,
      "import {$1onAuthStateChanged as realOnAuthStateChanged$2} from $3; const onAuthStateChanged = (auth, next, ...rest) => realOnAuthStateChanged(auth, user => { if (user) window.__replayOwnedAuth = () => next(user); next(user); }, ...rest);",
    );
    expect(rewritten).not.toEqual(original);
    rewritten = rewritten.replace(
      /import \{([^}]*?)\bonSnapshot\b([^}]*?)\} from ([^;]+);/,
      "import {$1onSnapshot as realOnSnapshot$2} from $3; const onSnapshot = (ref, ...args) => { const options = typeof args[0] === 'function' ? [] : [args.shift()]; const [next, ...rest] = args; return realOnSnapshot(ref, ...options, snap => { if (ref.path?.startsWith('askConversations/')) console.info(JSON.stringify({diagnostic:'ASK_CACHE026', exists:snap.exists(), fromCache:snap.metadata.fromCache, titleMatchesNew:snap.data()?.turns?.[0]?.answer?.title === 'Newest verified context'})); next(snap); }, ...rest); };",
    );
    const observed = rewritten
      .replace(
        /\.then\(\(result\)\s*=>\s*\{/,
        "$& window.__askRestoreProcessed = (window.__askRestoreProcessed ?? 0) + 1;",
      )
      .replace(
        /setConversationId\(id\);/g,
        "setConversationId(id); window.__askRestoredCID = id;",
      );
    expect(observed).not.toEqual(rewritten);
    rewritten = observed;
    await route.fulfill({ response, body: rewritten });
  });
  await page.route("**/currentAskConversation", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const number = ++reads,
      response = await route.fetch();
    if (number === 1) {
      const envelope = await response.json();
      expect((envelope.result ?? envelope.data)?.conversationId).toBe(
        first.cid,
      );
      firstStarted();
      await held;
    }
    await route.fulfill({ response });
  });
  try {
    await page.goto("/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("customer-a");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await started;
    const second = await askSource(),
      ref = db.doc(`askConversations/${customer}-${second.cid}`);
    const data = (await ref.get()).data()!;
    data.turns[0].answer.title = "Newest verified context";
    await ref.update({ turns: data.turns });
    await page.evaluate(() => {
      const replay = (window as unknown as Record<string, unknown>)
        .__replayOwnedAuth as () => void;
      replay();
    });
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as Record<string, unknown>).__askRestoredCID,
        ),
      )
      .toBe(second.cid);
    await page
      .getByRole("button", { name: "Hỏi SatsunicGo", exact: true })
      .click();
    const resume = page.getByRole("button", {
      name: "Tiếp tục hội thoại",
      exact: true,
    });
    await expect(page.getByRole("dialog").or(resume).first()).toBeVisible();
    if (await resume.isVisible()) await resume.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page
        .getByRole("dialog")
        .getByRole("heading", { name: "Newest verified context", exact: true }),
    ).toBeVisible();
    releaseFirst();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Number(
              (window as unknown as Record<string, unknown>)
                .__askRestoreProcessed,
            ) >= 2,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as Record<string, unknown>).__askRestoredCID,
        ),
      )
      .toBe(second.cid);
    await expect(
      page
        .getByRole("dialog")
        .getByRole("combobox", { name: "Sản phẩm", exact: true }),
    ).toHaveValue(second.p.id);
    expect(
      (await db.doc(`askCurrent/${customer}`).get()).data()?.conversationId,
    ).toBe(second.cid);
    expect((await ref.get()).data()).toEqual(data);
    expect(writes).toBe(0);
  } finally {
    releaseFirst();
    await page.unrouteAll({ behavior: "wait" });
  }
});
