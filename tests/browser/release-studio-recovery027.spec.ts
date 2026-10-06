import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
import { seedIdentities, closeFixtures, db, operator } from "./fixtures";
import { invoke } from "./http";

test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
async function editor(page: Page) {
  const id = `recovery027-${randomUUID()}`;
  const payload = {
    ...emptyStudioDraft,
    title: `Synthetic ${id}`,
    slug: id,
    summary: "Synthetic recovery scenario",
    authorId: operator,
    category: "Hướng dẫn",
    sources: [
      { title: "Synthetic source", url: "https://example.invalid/source" },
    ],
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Synthetic unchanged recovery body" },
          ],
        },
      ],
    },
  };
  await db.doc("blogStudioSettings/main").set({
    revision: 1,
    commentsEnabled: false,
    requireReview: true,
    categories: ["Hướng dẫn"],
    authors: [{ id: operator, name: "Synthetic editor027", bio: "" }],
  });
  await db
    .doc(`blogAuthors/${operator}`)
    .set({ id: operator, name: "Synthetic editor027", bio: "", revision: 1 });
  await invoke("studioCommand", {
    action: "create",
    id,
    operationId: randomUUID(),
    payload,
  });
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
  await page.goto(`/crm/studio/${id}`);
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toHaveValue(payload.title);
  return { id, payload };
}
for (const droppedAction of ["save", "review"] as const)
  test(`STUDIO027 lost ${droppedAction} response replays the exact save-review step`, async ({
    page,
  }) => {
    const { id } = await editor(page);
    const commands: Record<string, unknown>[] = [];
    let dropped = false;
    await page.route("**/studioCommand", async (route) => {
      const data = route.request().postDataJSON().data as Record<
        string,
        unknown
      >;
      if (data.id !== id) return route.continue();
      commands.push(data);
      if (!dropped && data.action === droppedAction) {
        dropped = true;
        const response = await route.fetch();
        expect((await response.json()).result).toBeTruthy();
        return route.abort("failed");
      }
      return route.continue();
    });
    const send = page
      .getByRole("button", { name: "Gửi duyệt", exact: true })
      .first();
    await send.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await send.click();
    await expect
      .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("state"))
      .toBe("review");
    await expect(
      page.getByRole("status").filter({ hasText: /^Đã lưu\.$/ }),
    ).toBeVisible();
    const replayed = commands.filter(
      (command) => command.action === droppedAction,
    );
    expect(replayed).toHaveLength(2);
    expect(replayed[1]).toEqual(replayed[0]);
    expect((await db.doc(`blogDrafts/${id}`).get()).get("revision")).toBe(3);
    expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
  });
test("STUDIO027 real CAS conflict preserves local text and stops later stale autosaves", async ({
  page,
}) => {
  const { id, payload } = await editor(page);
  await invoke("studioCommand", {
    action: "save",
    id,
    expectedVersion: 1,
    operationId: randomUUID(),
    payload: { ...payload, title: "Synthetic concurrent winner027" },
  });
  let saves = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname.endsWith("/studioCommand")
    ) {
      const data = request.postDataJSON()?.data;
      if (data?.id === id && data.action === "save") saves++;
    }
  });
  const title = page.getByRole("textbox", { name: "Tiêu đề", exact: true });
  await title.fill("Synthetic local conflicting title027");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(saves).toBe(1);
  await title.fill("Synthetic local preserved revision027");
  // Observe beyond the real 1.8s autosave debounce; no stale request may follow.
  await page.waitForTimeout(2500);
  expect(saves).toBe(1);
  await expect(title).toHaveValue("Synthetic local preserved revision027");
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(
    "Synthetic concurrent winner027",
  );
  expect((await db.doc(`blogDrafts/${id}`).get()).get("revision")).toBe(2);
});

for (const rejectedAction of ["save", "review"] as const)
  test(`STUDIO027 definitive ${rejectedAction} rejection allows a corrected fresh submission`, async ({
    page,
  }) => {
    const { id } = await editor(page);
    const commands: Record<string, unknown>[] = [];
    let rejected = false;
    await page.route("**/studioCommand", async (route) => {
      const data = route.request().postDataJSON().data;
      if (data.id !== id) return route.continue();
      commands.push(data);
      if (!rejected && data.action === rejectedAction) {
        rejected = true;
        // Definitive server rejection, followed by an actual emulator submission.
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            error: {
              status: "INVALID_ARGUMENT",
              message: "Synthetic definitive validation rejection027",
            },
          }),
        });
      }
      return route.continue();
    });
    const title = page.getByRole("textbox", { name: "Tiêu đề", exact: true });
    const send = page
      .getByRole("button", { name: "Gửi duyệt", exact: true })
      .first();
    await send.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await title.fill(`Synthetic corrected ${rejectedAction}027`);
    await send.click();
    await expect
      .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("state"))
      .toBe("review");
    expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(
      `Synthetic corrected ${rejectedAction}027`,
    );
    const saves = commands.filter((command) => command.action === "save");
    expect(saves).toHaveLength(2);
    expect(saves[1].operationId).not.toBe(saves[0].operationId);
    expect(saves[1].expectedVersion).toBe(rejectedAction === "save" ? 1 : 2);
    expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
  });
