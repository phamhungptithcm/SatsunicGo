import {
  test,
  expect,
  type Page,
  type TestInfo,
  type Request,
} from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";
import {
  emptyStudioDraft,
  bodyText,
  studioDraftSchema,
  type RichNode,
  type StudioPost,
} from "../../packages/domain/blog-studio";
import {
  seedIdentities,
  closeFixtures,
  freshCustomer,
  db,
  operator,
  customer,
} from "./fixtures";
import { invoke, call } from "./http";
import { artifactDirectory } from "./artifact-path";

// Approved NEW FILE lease. DEGRADED bounded source verification; root alone runs browsers.
// Actual demo callables/readback; only named failure injection and browser-clock control.
// Captures have no matched original baseline: they MUST NOT be labeled visual parity passes.
const run = `complete027-${randomUUID()}`;
const owned = new Set<string>(),
  authors = new Set<string>(),
  categoryNames = new Set<string>(),
  media = new Set<string>();
const responses: Promise<void>[] = [];
let authorId: string, categoryName: string;
const app = () => {
  const value = getApps().find((a) => a.name === "release021-browser");
  if (!value) throw Error("Dedicated fixture app missing");
  return value;
};
async function command<T = Record<string, unknown>>(
  name: string,
  data: Record<string, unknown>,
  diagnostic?: { info: TestInfo; id: string },
) {
  const operationId = randomUUID();
  owned.add(`blogStudioOperations/${operator}_${operationId}`);
  if (!diagnostic) return invoke<T>(name, { ...data, operationId });
  const result = await call<T>(name, { ...data, operationId });
  if (result.error || !result.result) {
    await diagnosePublication(diagnostic.info, diagnostic.id, result.error);
    throw Error(
      `Fixture callable failed: ${name} ${result.error?.status ?? "EMPTY_RESULT"}`,
    );
  }
  return result.result;
}
function isStudioPost(
  request: Request,
  endpoint: string,
  expected: Record<string, unknown>,
) {
  if (
    request.method() !== "POST" ||
    !new URL(request.url()).pathname.endsWith(`/${endpoint}`)
  )
    return false;
  const data = request.postDataJSON()?.data;
  return (
    data &&
    Object.entries(expected).every(([key, value]) => data[key] === value)
  );
}
function waitStudioResponse(
  page: Page,
  endpoint: string,
  expected: Record<string, unknown>,
) {
  return page.waitForResponse((response) =>
    isStudioPost(response.request(), endpoint, expected),
  );
}
async function diagnosePublication(info: TestInfo, id: string, error: unknown) {
  // Only task-owned synthetic drafts; never attach raw snapshots, identities or auth data.
  if (!owned.has(`blogDrafts/${id}`))
    throw Error("Publication diagnostic requires owned draft");
  const [draft, settings] = await Promise.all([
    db.doc(`blogDrafts/${id}`).get(),
    db.doc("blogStudioSettings/main").get(),
  ]);
  const value = draft.data();
  const safe = (text: unknown) =>
    typeof text === "string"
      ? text
          .replace(/https?:\/\/\S+/g, "[url]")
          .replace(/[\w.+-]+@[\w.-]+/g, "[email]")
          .replace(/\b[A-Za-z0-9_-]{64,}\b/g, "[redacted]")
          .slice(0, 500)
      : null;
  const failure =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const detail = {
    error: {
      status: safe(failure.status),
      code: safe(failure.code),
      message: safe(failure.message),
    },
    draft: {
      exists: draft.exists,
      revision: value?.revision ?? null,
      state: value?.state ?? null,
      required: Object.fromEntries(
        ["title", "slug", "summary", "authorId", "category"].map((key) => [
          key,
          typeof value?.[key] === "string" && !!value[key].trim(),
        ]),
      ),
      hasSources: Array.isArray(value?.sources) && value.sources.length > 0,
      hasBodyText: !!(value?.body && bodyText(value.body)),
    },
    policy: {
      exists: settings.exists,
      requireReview: settings.get("requireReview") ?? null,
      configuredAuthor: (settings.get("authors") ?? []).some(
        (author: { id: string }) => author.id === value?.authorId,
      ),
    },
  };
  info.annotations.push({
    type: "publication-diagnostic",
    description: JSON.stringify(detail),
  });
}
async function category(name: string) {
  const result = await command<{ record: { id: string } }>(
    "studioAdvancedCommand",
    { action: "catalogUpdate", payload: { kind: "taxonomy", name } },
  );
  owned.add(`blogCategories/${result.record.id}`);
  categoryNames.add(name);
  return result.record.id;
}
test.beforeAll(async () => {
  await seedIdentities();
  const result = await command<{ record: { id: string } }>(
    "studioAdvancedCommand",
    {
      action: "catalogUpdate",
      payload: { kind: "authors", name: run, bio: "Synthetic complete author" },
    },
  );
  authorId = result.record.id;
  authors.add(authorId);
  owned.add(`blogAuthors/${authorId}`);
  categoryName = `Synthetic ${run}`;
  await category(categoryName);
});
test.afterAll(async () => {
  try {
    await Promise.allSettled(responses);
    // Recover IDs after a dropped upload response, bounded to this suite's unique content IDs.
    const contentIds = [...owned]
      .filter((path) => path.startsWith("blogDrafts/"))
      .map((path) => path.split("/")[1])
      .concat([...authors]);
    for (let offset = 0; offset < contentIds.length; offset += 30) {
      const uploads = await db
        .collection("contentMedia")
        .where("contentId", "in", contentIds.slice(offset, offset + 30))
        .limit(250)
        .get();
      for (const doc of uploads.docs) media.add(doc.id);
    }
    // Remove only this suite's additions; retain all other settings and their concurrent revisions.
    await db.runTransaction(async (tx) => {
      const ref = db.doc("blogStudioSettings/main"),
        snap = await tx.get(ref);
      if (!snap.exists) return;
      const data = snap.data()!;
      tx.update(ref, {
        authors: (data.authors ?? []).filter(
          (a: { id: string }) => !authors.has(a.id),
        ),
        categories: (data.categories ?? []).filter(
          (name: string) => !categoryNames.has(name),
        ),
        revision: Number(data.revision ?? 1) + 1,
      });
    });
    for (const id of media) {
      const snap = await db.doc(`contentMedia/${id}`).get();
      const path = snap.get("objectPath");
      if (typeof path === "string" && path === `content-images/${id}`) {
        if (
          !/^127\.0\.0\.1:\d+$/.test(
            process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? "",
          )
        )
          throw Error("Storage cleanup requires explicit local emulator host");
        await getStorage(app())
          .bucket(
            process.env.SATSUNICGO_STUDIO_TEST_STORAGE_BUCKET ??
              "demo-satsunicgo.appspot.com",
          )
          .file(path)
          .delete({ ignoreNotFound: true });
      }
      owned.add(`contentMedia/${id}`);
    }
    for (const path of owned) await db.recursiveDelete(db.doc(path));
  } finally {
    await closeFixtures();
  }
});
async function login(page: Page, identity = "owner") {
  page.on("request", (req) => {
    if (
      req.method() === "POST" &&
      /\/(studioCommand|studioAdvancedCommand)$/.test(
        new URL(req.url()).pathname,
      )
    ) {
      const id = req.postDataJSON()?.data?.operationId;
      if (typeof id === "string")
        owned.add(
          `blogStudioOperations/${identity === "owner" ? operator : `e2e005-${identity}`}_${id}`,
        );
    }
  });
  page.on("response", (res) => {
    if (new URL(res.url()).pathname.endsWith("/studioMediaUpload"))
      responses.push(
        (async () => {
          const value = await res.json();
          if (typeof value.result?.id === "string") media.add(value.result.id);
        })().catch(() => {
          /* Scoped metadata recovery during teardown handles dropped responses. */
        }),
      );
  });
  await page.goto("/account");
  await page
    .getByRole("combobox", { name: "Vai trò thử", exact: true })
    .selectOption(identity);
  await page
    .getByRole("button", { name: "Đăng nhập thử nghiệm", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}
function ownPost(id: string, slug = id) {
  for (const collection of ["blogDrafts", "blogPublished", "blogSchedules"])
    owned.add(`${collection}/${id}`);
  owned.add(`blogSlugs/${slug}`);
}
async function post(label = "post", body: RichNode = emptyStudioDraft.body) {
  const id = `complete027-${randomUUID()}`;
  ownPost(id);
  const payload = {
    ...emptyStudioDraft,
    title: `${run} ${label}`,
    slug: id,
    summary: "Synthetic complete summary",
    authorId,
    category: categoryName,
    sources: [
      { title: "Synthetic source", url: "https://example.invalid/source" },
    ],
    body,
  };
  const result = await command<{ draft: StudioPost }>("studioCommand", {
    action: "create",
    id,
    payload,
  });
  return { id, payload, draft: result.draft };
}
const prose = (text: string): RichNode => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
async function editor(
  page: Page,
  label = "editor",
  body: RichNode = prose("Synthetic complete body"),
) {
  const value = await post(label, body);
  await login(page);
  await openEditor(page, value.id);
  return value;
}
async function openEditor(page: Page, id: string) {
  await page.goto(`/crm/studio/${id}`);
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toBeVisible();
  await expect(body(page)).toBeVisible();
}
const body = (page: Page) =>
  page.getByRole("textbox", { name: "Nội dung bài viết", exact: true });
const format = (page: Page) =>
  page.getByRole("toolbar", { name: "Định dạng nội dung", exact: true });
async function dismiss(page: Page) {
  const close = page.getByRole("button", { name: "Ẩn thông báo", exact: true });
  if (await close.isVisible()) await close.click();
  await expect(page.locator(".blog-toast")).toHaveCount(0);
}
async function save(page: Page, id: string) {
  const before = (await db.doc(`blogDrafts/${id}`).get()).get(
    "revision",
  ) as number;
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("revision"))
    .toBeGreaterThan(before);
  await expect(
    page.getByRole("status").filter({ hasText: /^Đã lưu\.$/ }),
  ).toBeVisible();
  await dismiss(page);
}
async function submitRequiredReview(page: Page, id: string) {
  const [settings, before] = await Promise.all([
    db.doc("blogStudioSettings/main").get(),
    db.doc(`blogDrafts/${id}`).get(),
  ]);
  if (
    settings.get("requireReview") !== true ||
    before.get("state") === "review"
  )
    return;
  const reviewed = waitStudioResponse(page, "studioCommand", {
    id,
    action: "review",
  });
  await page.getByRole("button", { name: "Gửi duyệt", exact: true }).click();
  const response = await reviewed;
  expect(response.ok()).toBe(true);
  const result = (await response.json()).result;
  expect(result.draft.state).toBe("review");
  expect(result.draft.revision).toBeGreaterThan(before.get("revision"));
  await expect
    .poll(async () => {
      const current = await db.doc(`blogDrafts/${id}`).get();
      return { state: current.get("state"), revision: current.get("revision") };
    })
    .toEqual({ state: "review", revision: result.draft.revision });
  await expect(
    page.getByRole("status").filter({ hasText: /^Đã lưu\.$/ }),
  ).toBeVisible();
  await dismiss(page);
}
async function publish(page: Page, id: string, info?: TestInfo) {
  const failures: Promise<unknown>[] = [];
  const observe = (response: import("@playwright/test").Response) => {
    if (
      isStudioPost(response.request(), "studioCommand", {
        id,
        action: "publish",
      })
    )
      failures.push(response.json().then((value) => value.error ?? null));
  };
  if (info) page.on("response", observe);
  try {
    await submitRequiredReview(page, id);
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Xuất bản bài viết", exact: true })
      .getByRole("button", { name: "Xuất bản ngay", exact: true })
      .click();
    await expect
      .poll(async () => (await db.doc(`blogPublished/${id}`).get()).exists)
      .toBe(true);
  } catch (error) {
    if (info) {
      const observed = await Promise.allSettled(failures);
      const failure = observed.find(
        (item) => item.status === "fulfilled" && item.value,
      );
      await diagnosePublication(
        info,
        id,
        failure?.status === "fulfilled" ? failure.value : error,
      );
    }
    throw error;
  } finally {
    if (info) page.off("response", observe);
  }
}
async function capture(page: Page, info: TestInfo, name: string) {
  const dir = `${artifactDirectory}/studio-complete-state-captures`;
  await mkdir(dir, { recursive: true });
  const path = `${dir}/${run}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
  info.annotations.push({
    type: "visual-parity",
    description:
      "NOT_RUN: Go-only capture; matched original fixture/state baseline required",
  });
}

test("STUDIO027 complete dashboard search category state and empty results", async ({
  page,
}, info) => {
  const a = await post("matching"),
    b = await post("other-category");
  const other = `Other ${run}`;
  await category(other);
  await command("studioCommand", {
    action: "save",
    id: b.id,
    expectedVersion: 1,
    payload: { ...b.payload, category: other },
  });
  await command("studioCommand", {
    action: "review",
    id: a.id,
    expectedVersion: 1,
  });
  await login(page);
  await page.goto("/crm/studio");
  await page.getByRole("textbox", { name: "Tìm bài", exact: true }).fill(run);
  await page
    .getByRole("textbox", { name: "Chuyên mục", exact: true })
    .fill(categoryName);
  await page.getByRole("button", { name: "Tìm / lọc", exact: true }).click();
  await expect(page.locator(".post-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".post-table")).toContainText(a.payload.title);
  const reviewRead = waitStudioResponse(page, "studioAdvancedRead", {
    kind: "list",
    q: run,
    category: categoryName,
    state: "review",
  });
  await page
    .getByRole("navigation", { name: "Trạng thái bài", exact: true })
    .getByRole("link", { name: /Chờ duyệt/ })
    .click();
  expect((await reviewRead).ok()).toBe(true);
  await expect(page).toHaveURL(/state=review/);
  await expect(page.locator('.list-controls input[name="state"]')).toHaveValue(
    "review",
  );
  await expect(
    page.getByRole("textbox", { name: "Tìm bài", exact: true }),
  ).toHaveValue(run);
  await expect(page.locator(".post-table")).toContainText(a.payload.title);
  await page
    .getByRole("textbox", { name: "Tìm bài", exact: true })
    .fill(`missing-${run}`);
  const emptyRead = waitStudioResponse(page, "studioAdvancedRead", {
    kind: "list",
    q: `missing-${run}`,
    state: "review",
    category: categoryName,
  });
  await page.getByRole("button", { name: "Tìm / lọc", exact: true }).click();
  expect((await emptyRead).ok()).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Chưa có bài phù hợp.", exact: true }),
  ).toBeVisible();
  await capture(page, info, "dashboard-empty");
});
test("STUDIO027 complete dashboard cursor traverses 21 actual matching drafts", async ({
  page,
}) => {
  const label = `p${randomUUID().replaceAll("-", "")}`;
  const ids = new Set<string>();
  for (let i = 0; i < 21; i++) ids.add((await post(`${label} ${i}`)).id);
  await login(page);
  await page.goto(`/crm/studio?q=${label}`);
  await expect(page.locator(".post-table tbody tr")).toHaveCount(20);
  const first = await page
    .locator(".post-table .post-title")
    .evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")!.split("/").at(-1)!),
    );
  await page.getByRole("link", { name: /Trang tiếp/ }).click();
  await expect(page.locator(".post-table tbody tr")).toHaveCount(1);
  const last = await page
    .locator(".post-table .post-title")
    .getAttribute("href");
  expect(new Set([...first, last!.split("/").at(-1)!])).toEqual(ids);
});
test("STUDIO027 complete dashboard actual failed read recovers without fake success", async ({
  page,
}, info) => {
  await login(page);
  let failed = false,
    failing = true;
  await page.route("**/studioAdvancedRead", (route) => {
    if (
      failing &&
      isStudioPost(route.request(), "studioAdvancedRead", { kind: "summary" })
    ) {
      failed = true;
      return route.abort("failed");
    }
    return route.continue();
  });
  await page.goto("/crm/studio");
  await expect(page.getByRole("alert")).toBeVisible();
  expect(failed).toBe(true);
  await capture(page, info, "dashboard-read-error");
  failing = false;
  await page.getByRole("button", { name: "Tải lại", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bài viết của bạn", exact: true }),
  ).toBeVisible();
  expect(failed).toBe(true);
});
test("STUDIO027 complete dashboard creates archives and restores a real draft", async ({
  page,
}) => {
  await login(page);
  await page.goto("/crm/studio");
  await page.getByRole("button", { name: "Viết bài mới", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toBeVisible();
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  ownPost(id);
  const title = `${run} created-native`;
  await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).fill(title);
  await save(page, id);
  await page
    .getByRole("button", { name: "Chuyển vào thùng rác", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Chuyển vào thùng rác?", exact: true })
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("state"))
    .toBe("archived");
  await page.goto(`/crm/studio?state=archived&q=${run}`);
  await page
    .getByRole("button", { name: `Khôi phục ${title}`, exact: true })
    .click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("state"))
    .toBe("draft");
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(title);
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
});
test("STUDIO027 complete fields and SEO persist through reload", async ({
  page,
}) => {
  const { id } = await editor(page);
  await page
    .getByRole("textbox", { name: "Tiêu đề", exact: true })
    .fill(`${run} edited fields`);
  await page
    .getByRole("textbox", { name: "Tóm tắt", exact: true })
    .fill("Synthetic edited summary");
  await page
    .getByRole("combobox", { name: "Tác giả", exact: true })
    .selectOption(authorId);
  await page
    .getByRole("combobox", { name: "Người phụ trách", exact: true })
    .selectOption(operator);
  await page
    .getByRole("combobox", { name: "Ngôn ngữ", exact: true })
    .selectOption("en");
  await page
    .getByRole("checkbox", { name: "Bình luận", exact: true })
    .uncheck();
  await page
    .getByRole("textbox", { name: "Ý chính", exact: true })
    .fill("Synthetic central answer");
  await page
    .getByRole("textbox", {
      name: "Nguồn tham khảo — mỗi dòng: tên | URL",
      exact: true,
    })
    .fill("Synthetic edited source | https://example.invalid/edited");
  await page
    .getByRole("button", { name: "Xem trước SEO & chia sẻ", exact: true })
    .click();
  const seo = page.getByRole("dialog", {
    name: "Ấn tượng đầu tiên.",
    exact: true,
  });
  await seo.getByLabel("Tiêu đề SEO").fill("Synthetic SEO title");
  await seo.getByLabel("Mô tả SEO").fill("Synthetic SEO description");
  await expect(seo.locator(".seo-preview")).toContainText(
    "Synthetic SEO title",
  );
  await page.keyboard.press("Escape");
  await save(page, id);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Tóm tắt", exact: true }),
  ).toHaveValue("Synthetic edited summary");
  await expect(
    page.getByRole("combobox", { name: "Ngôn ngữ", exact: true }),
  ).toHaveValue("en");
  await expect(
    page.getByRole("checkbox", { name: "Bình luận", exact: true }),
  ).not.toBeChecked();
  expect((await db.doc(`blogDrafts/${id}`).get()).data()).toMatchObject({
    authorId,
    assignee: operator,
    language: "en",
    commentsEnabled: false,
    answer: "Synthetic central answer",
    seoTitle: "Synthetic SEO title",
    seoDescription: "Synthetic SEO description",
    sources: [
      {
        title: "Synthetic edited source",
        url: "https://example.invalid/edited",
      },
    ],
  });
});
test("STUDIO027 complete slug auto manual publish lock and snapshot isolation", async ({
  page,
}, info) => {
  const { id, payload } = await editor(page);
  await command("studioCommand", {
    action: "save",
    id,
    expectedVersion: 1,
    payload: { ...payload, slug: "" },
  });
  await openEditor(page, id);
  const auto = `synthetic-${randomUUID()}`;
  await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).fill(auto);
  await expect(
    page.getByRole("textbox", { name: "Slug", exact: true }),
  ).toHaveValue(auto);
  const slug = `manual-${randomUUID()}`;
  owned.add(`blogSlugs/${slug}`);
  await page.getByRole("textbox", { name: "Slug", exact: true }).fill(slug);
  await save(page, id);
  await publish(page, id, info);
  await openEditor(page, id);
  await expect(
    page.getByRole("textbox", { name: "Slug", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Tiêu đề", exact: true })
    .fill("Synthetic private changed title");
  await save(page, id);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("slug")).toBe(slug);
  expect((await db.doc(`blogPublished/${id}`).get()).get("title")).toBe(auto);
});
test("STUDIO027 complete review and unpublish keep private content", async ({
  page,
}) => {
  const { id } = await editor(page);
  await page
    .getByRole("button", { name: "Gửi duyệt", exact: true })
    .first()
    .click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("state"))
    .toBe("review");
  await dismiss(page);
  await publish(page, id);
  await openEditor(page, id);
  await page.getByRole("button", { name: "Gỡ bài", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Gỡ bài viết?", exact: true });
  await expect(modal).toContainText("Bạn vẫn giữ bản nháp.");
  await modal.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("state"))
    .toBe("draft");
  expect((await db.doc(`blogPublished/${id}`).get()).get("status")).not.toBe(
    "published",
  );
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBeTruthy();
});
for (const [kind, label, selector] of [
  ["list", "Danh sách", "ul li"],
  ["ordered", "Danh sách đánh số", "ol li"],
  ["quote", "Trích dẫn", "blockquote"],
  ["code", "Khối code", ".editor-code-content"],
] as const)
  test(`STUDIO027 complete ${kind} node inserts through native controls and persists`, async ({
    page,
  }, info) => {
    const inserting = kind === "ordered" || kind === "code";
    const { id } = await editor(
      page,
      kind,
      inserting
        ? { type: "doc", content: [{ type: "paragraph" }] }
        : prose("Synthetic complete body"),
    );
    const navigationEvidence: { category: string; reason?: string }[] = [];
    const diagnosticSession =
      kind === "code" ? await page.context().newCDPSession(page) : null;
    if (diagnosticSession) {
      await diagnosticSession.send("Page.enable");
      diagnosticSession.on("Page.frameRequestedNavigation", (event) => {
        navigationEvidence.push({
          category: "navigation-request",
          reason: event.reason,
        });
      });
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame())
          navigationEvidence.push({ category: "main-frame-navigation" });
      });
      page.on("console", (entry) => {
        const text = entry.text();
        if (text.startsWith("[vite]") && /reload|lost|disconnect/i.test(text))
          navigationEvidence.push({ category: "vite-reload-or-disconnect" });
      });
    }
    if (kind === "ordered" || kind === "code") {
      await expect(body(page).locator("p")).toHaveText([""]);
      await body(page).locator("p").click();
      await expect
        .poll(async () =>
          body(page).evaluate((el) => {
            const selection = window.getSelection();
            return (
              !!selection?.isCollapsed &&
              !!selection.anchorNode &&
              el.contains(selection.anchorNode)
            );
          }),
        )
        .toBe(true);
      await page.keyboard.type("/");
      await page
        .getByRole("group", { name: "Chèn nội dung", exact: true })
        .getByRole("button", { name: label, exact: true })
        .click();
      const content = body(page).locator(
        kind === "ordered" ? "ol li p" : selector,
      );
      await expect(content).toHaveCount(1);
      try {
        await expect
          .poll(async () =>
            content.evaluate((el) => {
              const selection = window.getSelection();
              return (
                !!selection?.isCollapsed &&
                !!selection.anchorNode &&
                el.contains(selection.anchorNode)
              );
            }),
          )
          .toBe(true);
      } catch (error) {
        const diagnostic = await content.evaluate((el) => {
          const selection = window.getSelection(),
            editor = el.closest('[role="textbox"]'),
            active = document.activeElement;
          return {
            collapsed: selection?.isCollapsed ?? null,
            anchorType: selection?.anchorNode?.nodeType ?? null,
            anchorOffset: selection?.anchorOffset ?? null,
            focusOffset: selection?.focusOffset ?? null,
            anchorInsideNode:
              !!selection?.anchorNode && el.contains(selection.anchorNode),
            anchorInsideEditor:
              !!selection?.anchorNode &&
              !!editor?.contains(selection.anchorNode),
            activeInsideEditor: !!active && !!editor?.contains(active),
            activeTag:
              active && editor?.contains(active) ? active.tagName : null,
          };
        });
        info.annotations.push({
          type: "editor-caret-diagnostic",
          description: JSON.stringify({ kind, ...diagnostic }),
        });
        throw error;
      }
      await page.keyboard.type(`Synthetic ${kind} text`);
    } else {
      await body(page).locator("p").click();
      await format(page)
        .getByRole("button", { name: label, exact: true })
        .click();
    }
    try {
      await expect(body(page).locator(selector)).toContainText("Synthetic");
    } finally {
      if (diagnosticSession) {
        await info.attach("code-insertion-navigation-categories", {
          body: JSON.stringify(navigationEvidence),
          contentType: "application/json",
        });
        await diagnosticSession.detach();
      }
    }
    await save(page, id);
    if (kind === "code" || kind === "ordered") {
      const stored = (await db.doc(`blogDrafts/${id}`).get()).get(
        "body",
      ) as RichNode;
      expect(
        stored.content?.some(
          (node) =>
            node.type === (kind === "code" ? "codeBlock" : "orderedList") &&
            bodyText(node).includes(`Synthetic ${kind} text`) &&
            (kind !== "ordered" ||
              node.content?.some(
                (item) =>
                  item.type === "listItem" &&
                  bodyText(item).includes("Synthetic ordered text"),
              )),
        ),
      ).toBe(true);
    }
    await page.reload();
    await expect(body(page).locator(selector)).toContainText("Synthetic");
    if (kind === "code" || kind === "ordered") {
      const stored = (await db.doc(`blogDrafts/${id}`).get()).get(
        "body",
      ) as RichNode;
      expect(
        stored.content?.some(
          (node) =>
            node.type === (kind === "code" ? "codeBlock" : "orderedList") &&
            bodyText(node).includes(`Synthetic ${kind} text`) &&
            (kind !== "ordered" ||
              node.content?.some(
                (item) =>
                  item.type === "listItem" &&
                  bodyText(item).includes("Synthetic ordered text"),
              )),
        ),
      ).toBe(true);
    }
  });
test("STUDIO027 complete unsafe link rejected and HTTPS link persists", async ({
  page,
}) => {
  const { id } = await editor(page, "link", prose("Synthetic link text"));
  await body(page).locator("p").click();
  await body(page).press("Home");
  await body(page).press("Shift+End");
  await format(page)
    .getByRole("button", { name: "Liên kết", exact: true })
    .click();
  const modal = page.getByRole("dialog", {
    name: "Chèn liên kết",
    exact: true,
  });
  await modal
    .getByLabel("Liên kết", { exact: true })
    .fill("javascript:alert(1)");
  await modal
    .getByRole("button", { name: "Lưu liên kết", exact: true })
    .click();
  await expect(modal.getByRole("status")).toContainText(
    "https:// hoặc http://",
  );
  await expect(body(page).locator("a")).toHaveCount(0);
  await modal
    .getByLabel("Liên kết", { exact: true })
    .fill("https://example.invalid/link");
  await modal
    .getByRole("button", { name: "Lưu liên kết", exact: true })
    .click();
  await expect(body(page).locator("a")).toHaveAttribute(
    "href",
    "https://example.invalid/link",
  );
  await save(page, id);
  await page.reload();
  await expect(body(page).locator("a")).toHaveAttribute(
    "href",
    "https://example.invalid/link",
  );
});
async function imageFile() {
  return {
    name: `${run}.png`,
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 64, height: 32, channels: 3, background: "#163cff" },
    })
      .png()
      .toBuffer(),
  };
}
async function approveImage(page: Page, alt: string) {
  const modal = page.getByRole("dialog", { name: "Thêm ảnh", exact: true });
  await modal.getByLabel("Mô tả ảnh", { exact: true }).fill(alt);
  await expect(
    modal.getByRole("button", { name: "Thêm ảnh", exact: true }),
  ).toBeDisabled();
  await modal
    .getByRole("checkbox", {
      name: "Tôi có quyền sử dụng ảnh này.",
      exact: true,
    })
    .check();
  await modal.getByRole("button", { name: "Thêm ảnh", exact: true }).click();
  await expect(modal).toHaveCount(0);
}
function observeOwnedImageSaves(page: Page, id: string, info: TestInfo) {
  if (!owned.has(`blogDrafts/${id}`))
    throw Error("Save diagnostic requires owned draft");
  const pending: Promise<void>[] = [];
  let count = 0;
  const observe = (response: import("@playwright/test").Response) => {
    if (
      !isStudioPost(response.request(), "studioCommand", {
        action: "save",
        id,
      }) ||
      count++ >= 20
    )
      return;
    const task = (async () => {
      const data = response.request().postDataJSON().data;
      const parsed = studioDraftSchema.safeParse(data.payload);
      const images: Record<string, unknown>[] = [],
        nodeTypes = new Set<string>();
      const allowed = new Set([
        "doc",
        "paragraph",
        "text",
        "heading",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "codeBlock",
        "hardBreak",
        "horizontalRule",
        "image",
        "table",
        "tableRow",
        "tableCell",
        "tableHeader",
      ]);
      let visited = 0;
      const visit = (node: RichNode, depth = 0) => {
        if (!node || depth > 12 || visited++ >= 10000) return;
        nodeTypes.add(allowed.has(node.type) ? node.type : "unsupported");
        if (node.type === "image" && images.length < 30) {
          const attrs = node.attrs ?? {},
            src = attrs.src;
          const canonical =
            typeof src === "string"
              ? /^\/media\/([a-zA-Z0-9-]{1,80})$/.exec(src)
              : null;
          const metadata = Object.fromEntries(
            ["alt", "title", "width", "height"].map((key) => {
              const value = attrs[key];
              return [
                key,
                {
                  present: value !== undefined,
                  type: value === null ? "null" : typeof value,
                  ...(key === "width" || key === "height"
                    ? {
                        withinBounds:
                          typeof value === "number" &&
                          Number.isFinite(value) &&
                          value >= 1 &&
                          value <= 10000,
                      }
                    : {
                        nonempty: typeof value === "string" && !!value.trim(),
                      }),
                },
              ];
            }),
          );
          images.push({
            srcCategory: canonical
              ? "canonical-media"
              : typeof src !== "string"
                ? "missing-or-nonstring"
                : src.startsWith("blob:")
                  ? "blob"
                  : src.startsWith("https:")
                    ? "https"
                    : src.startsWith("http:")
                      ? "http"
                      : "other",
            canonicalMedia: !!canonical,
            matchesOwnedUpload: !!canonical && media.has(canonical[1]),
            metadata,
          });
        }
        node.content?.forEach((child) => visit(child, depth + 1));
      };
      visit(data.payload?.body);
      const result = await response.json(),
        current = await db.doc(`blogDrafts/${id}`).get();
      const safe = (value: unknown) =>
        typeof value === "string"
          ? value
              .replace(/https?:\/\/\S+|blob:\S+/g, "[url]")
              .replace(/[\w.+-]+@[\w.-]+/g, "[email]")
              .replace(/\b[A-Za-z0-9_-]{64,}\b/g, "[redacted]")
              .slice(0, 500)
          : null;
      info.annotations.push({
        type: "image-save-schema-diagnostic",
        description: JSON.stringify({
          schemaValid: parsed.success,
          issues: parsed.success
            ? []
            : parsed.error.issues.slice(0, 30).map((issue) => ({
                code: issue.code,
                path: issue.path
                  .slice(0, 12)
                  .map((part) =>
                    typeof part === "number"
                      ? part
                      : /^[a-zA-Z]+$/.test(String(part))
                        ? part
                        : "[field]",
                  ),
              })),
          images,
          nodeTypes: [...nodeTypes],
          response: {
            httpStatus: response.status(),
            error: {
              status: safe(result.error?.status),
              code: safe(result.error?.code),
              message: safe(result.error?.message),
            },
          },
          expectedRevision: Number.isSafeInteger(data.expectedVersion)
            ? data.expectedVersion
            : null,
          currentRevision: Number.isSafeInteger(current.get("revision"))
            ? current.get("revision")
            : null,
        }),
      });
    })().catch(() => {
      info.annotations.push({
        type: "image-save-schema-diagnostic",
        description: "UNAVAILABLE: bounded diagnostic read failed",
      });
    });
    pending.push(task);
  };
  page.on("response", observe);
  return async () => {
    page.off("response", observe);
    await Promise.allSettled(pending);
  };
}
test("STUDIO027 complete cover real upload cancellation removal and private read", async ({
  page,
  request,
}) => {
  const { id } = await editor(page, "cover");
  const file = await imageFile();
  let chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Chọn ảnh bìa", exact: true }).click();
  await (await chooser).setFiles(file);
  await page
    .getByRole("dialog", { name: "Thêm ảnh", exact: true })
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  expect((await db.doc(`blogDrafts/${id}`).get()).get("coverId")).toBe("");
  chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Chọn ảnh bìa", exact: true }).click();
  await (await chooser).setFiles(file);
  await approveImage(page, "Synthetic cover description");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).get("coverId"))
    .not.toBe("");
  const mid = (await db.doc(`blogDrafts/${id}`).get()).get("coverId") as string;
  media.add(mid);
  expect((await call("studioMediaRead", { id: mid }, null)).error?.status).toBe(
    "UNAUTHENTICATED",
  );
  expect(
    (
      await request.get(
        `http://127.0.0.1:5107/demo-satsunicgo/asia-southeast1/publicImage/media/${mid}`,
      )
    ).status(),
  ).toBe(404);
  await dismiss(page);
  await page.getByRole("button", { name: "Bỏ ảnh bìa", exact: true }).click();
  await save(page, id);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("coverId")).toBe("");
});
// Approved viewport delta: both real upload paths at 390/768/1440, preserving
// 50/75/100/reset geometry, owned-save diagnostics, persisted dimensions/alt and reload.
for (const width of [390, 768, 1440])
  for (const mode of ["paste", "drop"] as const)
    test(`STUDIO027 complete inline ${mode} actual upload resize alt and persistence at ${width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      const { id } = await editor(page, mode);
      const finishDiagnostics = observeOwnedImageSaves(page, id, info);
      try {
        const file = await imageFile();
        await body(page).locator("p").click();
        // Constructed transfer event, real browser handler and real Storage-backed service success.
        await body(page).evaluate(
          (el, { bytes, name, mode }) => {
            const transfer = new DataTransfer();
            transfer.items.add(
              new File([new Uint8Array(bytes)], name, { type: "image/png" }),
            );
            const rect = el.getBoundingClientRect();
            el.dispatchEvent(
              mode === "paste"
                ? new ClipboardEvent("paste", {
                    clipboardData: transfer,
                    bubbles: true,
                    cancelable: true,
                  })
                : new DragEvent("drop", {
                    dataTransfer: transfer,
                    bubbles: true,
                    cancelable: true,
                    clientX: rect.left + 10,
                    clientY: rect.top + 10,
                  }),
            );
          },
          { bytes: [...file.buffer], name: file.name, mode },
        );
        await approveImage(page, `Synthetic ${mode} alt`);
        const img = body(page).locator("img");
        await expect(img).toHaveAttribute("alt", `Synthetic ${mode} alt`);
        await img.click();
        const controls = page.getByRole("toolbar", {
          name: "Chỉnh ảnh",
          exact: true,
        });
        await controls
          .getByRole("button", { name: "Chiều rộng ảnh 50%", exact: true })
          .click();
        const expectedWidth = await body(page).evaluate((el) =>
          Math.round(el.clientWidth / 2),
        );
        const recordGeometry = async (stage: string) => {
          if (!owned.has(`blogDrafts/${id}`))
            throw Error("Image diagnostic requires owned draft");
          const dom = await body(page)
            .locator("img")
            .evaluate((el) => {
              const rect = el.getBoundingClientRect();
              return {
                widthAttribute: el.getAttribute("width"),
                heightAttribute: el.getAttribute("height"),
                styleWidth: (el as HTMLElement).style.width,
                styleHeight: (el as HTMLElement).style.height,
                renderedWidth: rect.width,
                renderedHeight: rect.height,
              };
            });
          const stored = (await db.doc(`blogDrafts/${id}`).get()).get(
            "body",
          ) as RichNode;
          const image = stored.content?.find((node) => node.type === "image");
          info.annotations.push({
            type: "image-geometry-diagnostic",
            description: JSON.stringify({
              mode,
              viewportWidth: width,
              stage,
              expectedWidth,
              dom,
              stored: {
                width: image?.attrs?.width ?? null,
                height: image?.attrs?.height ?? null,
              },
            }),
          });
        };
        await recordGeometry("after-50-percent");
        try {
          // Numeric node attributes and actual rendered geometry are authoritative;
          // the resize node view's choice of inline style versus HTML attribute is incidental.
          await expect
            .poll(async () =>
              img.evaluate((el) =>
                Math.round(el.getBoundingClientRect().width),
              ),
            )
            .toBe(expectedWidth);
        } catch (error) {
          await recordGeometry("geometry-failure");
          throw error;
        }
        await expect
          .poll(async () =>
            img.evaluate((el) => Math.round(el.getBoundingClientRect().height)),
          )
          .toBe(Math.round(expectedWidth / 2));
        const available = await body(page).evaluate((el) => el.clientWidth);
        for (const percent of [75, 100]) {
          await controls
            .getByRole("button", {
              name: `Chiều rộng ảnh ${percent}%`,
              exact: true,
            })
            .click();
          const width = Math.round((available * percent) / 100);
          await expect
            .poll(async () =>
              img.evaluate((el) =>
                Math.round(el.getBoundingClientRect().width),
              ),
            )
            .toBe(width);
          await expect
            .poll(async () =>
              img.evaluate((el) =>
                Math.round(el.getBoundingClientRect().height),
              ),
            )
            .toBe(Math.round(width / 2));
        }
        await controls
          .getByRole("button", { name: "Tự cân", exact: true })
          .click();
        await expect
          .poll(async () =>
            img.evaluate((el) => ({
              width: Math.round(el.getBoundingClientRect().width),
              height: Math.round(el.getBoundingClientRect().height),
              styleWidth: (el as HTMLElement).style.width,
              styleHeight: (el as HTMLElement).style.height,
            })),
          )
          .toEqual({ width: 64, height: 32, styleWidth: "", styleHeight: "" });
        await controls
          .getByRole("button", { name: "Chiều rộng ảnh 50%", exact: true })
          .click();
        await expect
          .poll(async () =>
            img.evaluate((el) => Math.round(el.getBoundingClientRect().width)),
          )
          .toBe(expectedWidth);
        await controls
          .getByRole("button", { name: "Mô tả", exact: true })
          .click();
        const modal = page.getByRole("dialog", {
          name: "Mô tả ảnh",
          exact: true,
        });
        await modal
          .getByLabel("Mô tả ảnh", { exact: true })
          .fill(`Synthetic edited ${mode} alt`);
        await modal.getByRole("button", { name: "Lưu", exact: true }).click();
        await save(page, id);
        await recordGeometry("saved");
        await page.reload();
        await expect(body(page).locator("img")).toHaveAttribute(
          "alt",
          `Synthetic edited ${mode} alt`,
        );
        const draft = (await db.doc(`blogDrafts/${id}`).get()).get(
          "body",
        ) as RichNode;
        const image = draft.content?.find((n) => n.type === "image");
        await recordGeometry("reloaded");
        expect(image?.attrs?.title).toBe("");
        expect(Number(image?.attrs?.width)).toBe(expectedWidth);
        expect(Number(image?.attrs?.height)).toBe(
          Math.round(expectedWidth / 2),
        );
        await expect
          .poll(async () =>
            body(page)
              .locator("img")
              .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
          )
          .toBe(expectedWidth);
      } finally {
        await finishDiagnostics();
      }
    });
test("STUDIO027 complete rejects multiple pasted files without service upload", async ({
  page,
}) => {
  await editor(page, "bad-media");
  let uploads = 0;
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.endsWith("/studioMediaUpload")) uploads++;
  });
  await body(page).click();
  await body(page).evaluate((el) => {
    const dt = new DataTransfer();
    for (const name of ["one.png", "two.png"])
      dt.items.add(new File(["synthetic"], name, { type: "image/png" }));
    el.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
  await expect(page.getByRole("alert")).toContainText("Thêm từng ảnh một");
  expect(uploads).toBe(0);
  await expect(body(page).locator("img")).toHaveCount(0);
});
test("STUDIO027 complete author create edit and native required-field validation", async ({
  page,
}) => {
  await login(page);
  await page.goto("/crm/studio/settings");
  await page.getByLabel("Chọn tác giả", { exact: true }).selectOption("");
  await page.getByLabel("Tài khoản Google", { exact: true }).fill("");
  const name = `Created ${run}`;
  await page.getByLabel("Tên hiển thị", { exact: true }).fill(name);
  await page
    .getByLabel("Giới thiệu ngắn", { exact: true })
    .fill("Synthetic created author biography");
  const authorWrite = page.waitForResponse((response) => {
    if (
      !isStudioPost(response.request(), "studioAdvancedCommand", {
        action: "catalogUpdate",
      })
    )
      return false;
    const payload = response.request().postDataJSON()?.data?.payload;
    return payload?.kind === "authors" && payload.name === name;
  });
  const authorRefresh = waitStudioResponse(page, "studioAdvancedRead", {
    kind: "summary",
  });
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  expect((await authorWrite).ok()).toBe(true);
  await expect
    .poll(
      async () =>
        (await db.collection("blogAuthors").where("name", "==", name).get())
          .size,
    )
    .toBe(1);
  expect((await authorRefresh).ok()).toBe(true);
  const rows = await db
    .collection("blogAuthors")
    .where("name", "==", name)
    .get();
  expect(rows.size).toBe(1);
  const id = rows.docs[0].id;
  authors.add(id);
  owned.add(`blogAuthors/${id}`);
  await expect(page.getByLabel("Chọn tác giả", { exact: true })).toContainText(
    name,
  );
  await page.getByLabel("Chọn tác giả", { exact: true }).selectOption(id);
  await page.getByLabel("Tên hiển thị", { exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Lưu", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Tên hiển thị", { exact: true }).fill(`${name} edited`);
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect
    .poll(async () => (await db.doc(`blogAuthors/${id}`).get()).get("name"))
    .toBe(`${name} edited`);
});
test("STUDIO027 complete category creates renames and reaches editor autocomplete", async ({
  page,
}) => {
  const { id } = await editor(page, "category");
  await page.goto("/crm/studio/settings");
  const nav = page.getByRole("navigation", {
    name: "Các mục cài đặt",
    exact: true,
  });
  await nav.getByRole("button", { name: "Chuyên mục", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm chuyên mục", exact: true })
    .click();
  const name = `Created category ${run}`;
  categoryNames.add(name);
  const modal = page.getByRole("dialog", {
    name: "Thêm chuyên mục",
    exact: true,
  });
  await modal.getByLabel("Tên chuyên mục", { exact: true }).fill(name);
  await modal.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await db.collection("blogCategories").where("name", "==", name).get())
          .size,
    )
    .toBe(1);
  const row = (
    await db.collection("blogCategories").where("name", "==", name).get()
  ).docs[0];
  owned.add(row.ref.path);
  await nav.getByRole("button", { name: "Chuyên mục", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
  const renamed = `Renamed category ${run}`;
  categoryNames.add(renamed);
  const edit = page.getByRole("dialog", {
    name: "Đổi tên chuyên mục",
    exact: true,
  });
  await edit.getByLabel("Tên chuyên mục", { exact: true }).fill(renamed);
  await edit.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect
    .poll(async () => (await row.ref.get()).get("name"))
    .toBe(renamed);
  await openEditor(page, id);
  const input = page.getByRole("combobox", { name: "Chuyên mục", exact: true });
  await input.fill(renamed);
  await input.press("ArrowDown");
  await input.press("Enter");
  await save(page, id);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("category")).toBe(
    renamed,
  );
});
test("STUDIO027 complete member role updates and native self safeguards", async ({
  page,
}) => {
  const identity = await freshCustomer();
  owned.add(`users/${identity.uid}`);
  owned.add(`staffAccess/${identity.uid}`);
  owned.add(`blogEditorialMembers/${identity.uid}`);
  await db
    .doc(`staffAccess/${identity.uid}`)
    .set({ active: true, locked: false, roles: ["CONTENT_EDITOR"] });
  try {
    await login(page);
    await page.goto("/crm/studio/settings");
    const nav = page.getByRole("navigation", {
      name: "Các mục cài đặt",
      exact: true,
    });
    await nav.getByRole("button", { name: "Thành viên", exact: true }).click();
    const self = page.locator(".member").filter({ hasText: "Bạn ·" });
    await expect(self).toHaveCount(1);
    await expect(self.locator("button.badge")).toBeDisabled();
    await expect(
      self.getByRole("button", { name: /Thu hồi quyền/ }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Thêm thành viên", exact: true })
      .click();
    const email = `${identity.identity}@satsunicgo.example.invalid`;
    const invite = createHash("sha256").update(email).digest("hex");
    owned.add(`blogEditorialInvites/${invite}`);
    const modal = page.getByRole("dialog", {
      name: "Thêm thành viên",
      exact: true,
    });
    await modal.getByLabel("Email tài khoản", { exact: true }).fill(email);
    await modal.locator('select[name="role"]').selectOption("author");
    const memberWrite = page.waitForResponse(
      (response) =>
        isStudioPost(response.request(), "studioAdvancedCommand", {
          action: "memberSave",
        }) && response.request().postDataJSON()?.data?.payload?.email === email,
    );
    const memberRefresh = waitStudioResponse(page, "studioAdvancedRead", {
      kind: "summary",
    });
    await modal.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await memberWrite).ok()).toBe(true);
    await expect
      .poll(async () =>
        (await db.doc(`blogEditorialInvites/${invite}`).get()).get("role"),
      )
      .toBe("author");
    expect((await memberRefresh).ok()).toBe(true);
    await nav.getByRole("button", { name: "Thành viên", exact: true }).click();
    const member = page.locator(".member").filter({ hasText: email });
    await expect(member).toHaveCount(1);
    await member.locator("button.badge").click();
    const edit = page.getByRole("dialog", {
      name: "Thay đổi quyền",
      exact: true,
    });
    await edit.locator('select[name="role"]').selectOption("publisher");
    const roleWrite = page.waitForResponse((response) => {
      if (
        !isStudioPost(response.request(), "studioAdvancedCommand", {
          action: "memberSave",
        })
      )
        return false;
      const payload = response.request().postDataJSON()?.data?.payload;
      return payload?.email === email && payload.role === "publisher";
    });
    await edit.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await roleWrite).ok()).toBe(true);
    await expect
      .poll(async () =>
        (await db.doc(`blogEditorialInvites/${invite}`).get()).get("role"),
      )
      .toBe("publisher");
    expect(
      (await db.doc(`staffAccess/${identity.uid}`).get()).get("roles"),
    ).toEqual(["CONTENT_EDITOR"]);
  } finally {
    await getAuth(app()).deleteUser(identity.uid);
  }
});
test("STUDIO027 complete saved preview and blocked popup same-tab fallback preserve draft", async ({
  page,
}) => {
  const { id } = await editor(page, "preview");
  const title = `${run} preview edited`;
  await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).fill(title);
  const opened = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Xem trước", exact: true }).click();
  const popup = await opened;
  await expect(
    popup.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(title);
  await popup.close();
  await dismiss(page);
  // Explicit popup failure injection only; actual draft save/read are not mocked.
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.getByRole("link", { name: "Xem trước", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/studio/${id}/preview$`));
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(title);
});
test("STUDIO027 complete recovery reload and failed save-before-navigation preserve local text", async ({
  page,
}) => {
  const { id, payload } = await editor(page, "recovery");
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  const local = `${run} unsaved recovery`;
  await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).fill(local);
  await expect
    .poll(() =>
      page.evaluate(
        ({ uid, id }) =>
          localStorage.getItem(`satsunicgo:studio:source:${uid}:${id}`),
        { uid: operator, id },
      ),
    )
    .not.toBeNull();
  await page.clock.resume();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Phục hồi", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Phục hồi", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toHaveValue(local);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(
    payload.title,
  );
  // Explicit uncertain-delivery failure: original dirty navigation saves before leaving.
  let failed = false;
  await page.route("**/studioCommand", (route) => {
    const data = route.request().postDataJSON()?.data;
    if (!failed && data?.id === id && data.action === "save") {
      failed = true;
      return route.abort("failed");
    }
    return route.continue();
  });
  await page
    .getByRole("link", { name: "Trở về bài viết", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/crm/studio/${id}$`));
  await expect(
    page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
  ).toHaveValue(local);
  await dismiss(page);
  await page
    .getByRole("link", { name: "Trở về bài viết", exact: true })
    .click();
  await expect(page).toHaveURL(/\/crm\/studio$/);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("title")).toBe(local);
  expect(failed).toBe(true);
});
for (const target of ["approved", "rejected", "hidden"] as const)
  test(`STUDIO027 complete moderation ${target} native action updates viewed revision`, async ({
    page,
  }, info) => {
    const { id } = await post("moderation", prose("Synthetic moderated body"));
    let revision = (await db.doc(`blogDrafts/${id}`).get()).get(
      "revision",
    ) as number;
    if (
      (await db.doc("blogStudioSettings/main").get()).get("requireReview") ===
      true
    ) {
      const reviewed = await command<{ draft: StudioPost }>("studioCommand", {
        action: "review",
        id,
        expectedVersion: revision,
      });
      expect(reviewed.draft.state).toBe("review");
      expect(reviewed.draft.revision).toBeGreaterThan(revision);
      revision = reviewed.draft.revision;
      const current = await db.doc(`blogDrafts/${id}`).get();
      expect(current.get("state")).toBe("review");
      expect(current.get("revision")).toBe(revision);
    }
    await command(
      "studioCommand",
      {
        action: "publish",
        id,
        expectedVersion: revision,
      },
      { info, id },
    );
    const commentId = `000000-complete027-${randomUUID()}`;
    owned.add(`blogComments/${commentId}`);
    const text = `Synthetic ${run} ${target}`;
    const at = new Date(0).toISOString();
    await db.doc(`blogComments/${commentId}`).set({
      id: commentId,
      postId: id,
      parentId: "",
      uid: customer,
      name: run,
      text,
      status: "pending",
      revision: 1,
      createdAt: at,
      updatedAt: at,
    });
    await login(page);
    await page.goto("/crm/studio/comments?status=pending");
    await page.locator(".mod-list button").filter({ hasText: text }).click();
    await expect(page.locator(".mod-detail")).toContainText(text);
    // The source performs a real document reload after the acknowledged command.
    // Register before committing so database observation cannot race a second navigation.
    const reloaded = page.waitForNavigation({ waitUntil: "load" }).then(
      () => null,
      (error: unknown) => error,
    );
    if (target === "approved")
      await page
        .getByRole("button", { name: "Duyệt bình luận", exact: true })
        .click();
    else {
      await page
        .getByRole("button", {
          name: target === "hidden" ? "Ẩn / spam" : "Từ chối",
          exact: true,
        })
        .click();
      const modal = page.getByRole("dialog", {
        name: target === "hidden" ? "Ẩn bình luận?" : "Từ chối bình luận?",
        exact: true,
      });
      await modal
        .getByRole("button", { name: "Xác nhận", exact: true })
        .click();
    }
    await expect
      .poll(async () =>
        (await db.doc(`blogComments/${commentId}`).get()).get("status"),
      )
      .toBe(target);
    expect(
      (await db.doc(`blogComments/${commentId}`).get()).get("revision"),
    ).toBe(2);
    const reloadError = await reloaded;
    if (reloadError) throw reloadError;
    await expect(page).toHaveURL(/\/crm\/studio\/comments\?status=pending$/);
    await expect(
      page.getByRole("heading", {
        name: "Giữ cuộc trò chuyện có giá trị.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator(".mod-list button").filter({ hasText: text }),
    ).toHaveCount(0);
    await page.goto(`/crm/studio/comments?status=${target}`);
    await expect(page.locator(".mod-list")).toContainText(text);
  });
test("STUDIO027 complete original stylesheet source matches; visual baseline remains prerequisite", async ({
  browserName: _browserName,
}, info) => {
  const reference =
    "/Users/hunpeo97/Desktop/Workspace/Coder/HunpeoLabs/styles/blog-design.css";
  const [original, port] = await Promise.all([
    readFile(reference),
    readFile("src/features/content/studio/source-design.css"),
  ]);
  expect(port.equals(original)).toBe(true);
  info.annotations.push({
    type: "scope",
    description:
      "Exact stylesheet bytes only; global integration and rendered visual/state parity not certified",
  });
});
for (const width of [390, 768, 1440])
  test(`STUDIO027 complete original surfaces state captures at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    const { id } = await editor(page, `capture-${width}`);
    await capture(page, info, `editor-default-${width}`);
    await page
      .getByRole("button", { name: "Xem trước SEO & chia sẻ", exact: true })
      .click();
    await capture(page, info, `editor-seo-${width}`);
    await page.keyboard.press("Escape");
    for (const [name, url] of [
      ["dashboard", `/crm/studio?q=${run}`],
      ["settings", "/crm/studio/settings"],
      ["moderation", "/crm/studio/comments?status=pending"],
      ["account", "/crm/studio/account"],
      ["preview", `/crm/studio/${id}/preview`],
    ]) {
      await page.goto(url);
      const headings: Record<string, string> = {
        dashboard: "Bài viết của bạn",
        settings: "Cài đặt",
        moderation: "Giữ cuộc trò chuyện có giá trị.",
        account: "Tài khoản",
        preview: `${run} capture-${width}`,
      };
      await expect(
        page.getByRole("heading", { name: headings[name], exact: true }),
      ).toBeVisible();
      await capture(page, info, `${name}-${width}`);
    }
  });

test("STUDIO027 complete missing publication field fails without a public snapshot", async ({
  page,
}, info) => {
  const { id } = await editor(page, "invalid-publication");
  await page.getByRole("textbox", { name: "Tóm tắt", exact: true }).fill("");
  await save(page, id);
  await submitRequiredReview(page, id);
  await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
  const modal = page.getByRole("dialog", {
    name: "Xuất bản bài viết",
    exact: true,
  });
  await modal
    .getByRole("button", { name: "Xuất bản ngay", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
  expect((await db.doc(`blogDrafts/${id}`).get()).get("summary")).toBe("");
  await capture(page, info, "publication-validation-error");
});
test("STUDIO027 complete real author summary distinguishes unavailable pending from zero", async () => {
  const identity = await freshCustomer();
  owned.add(`users/${identity.uid}`);
  owned.add(`staffAccess/${identity.uid}`);
  owned.add(`blogEditorialMembers/${identity.uid}`);
  await db
    .doc(`staffAccess/${identity.uid}`)
    .set({ active: true, locked: false, roles: ["CONTENT_EDITOR"] });
  await db
    .doc(`blogEditorialMembers/${identity.uid}`)
    .set({ active: true, role: "author", revision: 1 });
  try {
    const result = await invoke<{ pending: number | null }>(
      "studioAdvancedRead",
      { kind: "summary" },
      identity.identity,
    );
    expect(result.pending).toBeNull();
  } finally {
    await getAuth(app()).deleteUser(identity.uid);
  }
});
test("STUDIO027 complete clicked navigation retains original per-link pending hint", async ({
  page,
}, info) => {
  // Hold actual navigation reads; preserve the original pending hint lifecycle assertion.
  await login(page);
  await page.goto("/crm/studio");
  const nav = page
    .getByRole("navigation", { name: "Studio", exact: true })
    .first();
  const link = nav.getByRole("link", { name: "Tài khoản", exact: true });
  await expect(link.locator(".studio-navigation-hint")).toHaveCount(1);
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route("**/studioAdvancedRead", async (route) => {
    if (
      !isStudioPost(route.request(), "studioAdvancedRead", { kind: "summary" })
    )
      return route.continue();
    requested();
    await held;
    await route.continue();
  });
  try {
    await link.click();
    await started;
    await expect(
      link.locator(".studio-navigation-hint.is-pending"),
    ).toBeVisible();
    await capture(page, info, "navigation-link-pending");
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
  await expect(
    page.getByRole("heading", { name: "Tài khoản", exact: true }),
  ).toBeVisible();
  await expect(link.locator(".studio-navigation-hint.is-pending")).toHaveCount(
    0,
  );
});
