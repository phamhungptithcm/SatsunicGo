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
test("ASK027 cached missing first SDK snapshot cannot authorize new work before verified server hydration", async ({
  page,
}) => {
  const { cid } = await askSource(),
    before = (await db.doc(`askConversations/${customer}-${cid}`).get()).data();
  await page.route("**/src/features/ask/Commerce.tsx*", async (route) => {
    const response = await route.fetch(),
      original = await response.text();
    const rewritten = original.replace(
      /import \{([^}]*?)\bonSnapshot\b([^}]*?)\} from ([^;]+);/,
      "import {$1onSnapshot as realOnSnapshot, disableNetwork, enableNetwork$2} from $3; const onSnapshot=(ref,...args)=>{ if(!ref.path?.startsWith('askConversations/'))return realOnSnapshot(ref,...args); const index=typeof args[0]==='function'?0:1;const next=args[index];args[index]=snap=>{window.__actualCache027={exists:snap.exists(),fromCache:snap.metadata.fromCache}; next(snap);};let stop=()=>{};let cancelled=false;window.__restoreNetwork027=()=>enableNetwork(ref.firestore);disableNetwork(ref.firestore).then(()=>{if(!cancelled)stop=realOnSnapshot(ref,...args);});return()=>{cancelled=true;stop();void enableNetwork(ref.firestore);};};",
    );
    expect(rewritten).not.toEqual(original);
    await route.fulfill({ response, body: rewritten });
  });
  try {
    await page.goto("/account");
    await page
      .getByRole("combobox", { name: "Vai trò thử", exact: true })
      .selectOption("customer-a");
    await page
      .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __actualCache027?: unknown })
              .__actualCache027,
        ),
      )
      .toEqual({ exists: false, fromCache: true });
    await page
      .getByRole("button", { name: "Hỏi SatsunicGo", exact: true })
      .click();
    const composer = page.getByRole("textbox", {
      name: "Hỏi SatsunicGo",
      exact: true,
    });
    await expect(composer).toBeDisabled();
    await page.evaluate(async () => {
      await (
        window as unknown as { __restoreNetwork027: () => Promise<void> }
      ).__restoreNetwork027();
    });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __actualCache027?: unknown })
              .__actualCache027,
        ),
      )
      .toEqual({ exists: true, fromCache: false });
    await expect(composer).toBeEnabled();
    await page
      .getByRole("button", { name: "Tiếp tục hội thoại", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog")
        .getByText("Sản phẩm thử nghiệm", { exact: true }),
    ).toBeVisible();
    expect(
      (await db.doc(`askConversations/${customer}-${cid}`).get()).data(),
    ).toEqual(before);
  } finally {
    await page.evaluate(async () => {
      const restore = (
        window as unknown as { __restoreNetwork027?: () => Promise<void> }
      ).__restoreNetwork027;
      if (restore) await restore();
    });
  }
});
