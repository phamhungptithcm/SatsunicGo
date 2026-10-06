import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import sharp from "sharp";
import {
  studioDraftSchema,
  bodyText,
  type StudioPost,
} from "../../packages/domain/blog-studio";
import { draftSchema as originalDraftSchema } from "/private/tmp/release027-original-studio-reference/lib/blog/schema";
import { invoke } from "./http";

// Approved exclusive NEW spec lease. Root alone executes; captures record differences,
// they do not automatically certify visual parity. Never delete unrelated fixtures.
const referenceOrigin = "http://127.0.0.1:5193";
const run = `reference${randomUUID().replace(/[^a-z]/g, "")}`;
const identity = `parity-${randomUUID()}`;
const uid = `e2e005-${identity}`;
const email = `${identity}@satsunicgo.example.invalid`;
const name = "Nhân viên biên tập";
const owned = new Set<string>();
let app: ReturnType<typeof initializeApp>, db: ReturnType<typeof getFirestore>;
let post: StudioPost, authorId: string, categoryName: string, commentId: string;
const schemas = [originalDraftSchema, studioDraftSchema];
const timestamp = "2026-10-06T12:00:00.000Z";
async function command<T>(
  endpoint: string,
  data: Record<string, unknown>,
): Promise<T> {
  const operationId = randomUUID();
  owned.add(`blogStudioOperations/${uid}_${operationId}`);
  return invoke<T>(endpoint, { ...data, operationId }, identity);
}
async function read<T>(data: Record<string, unknown>): Promise<T> {
  return invoke<T>("studioAdvancedRead", data, identity);
}
test.beforeAll(async () => {
  if (
    process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9197" ||
    process.env.FUNCTIONS_EMULATOR !== "true"
  )
    throw Error("Dedicated local emulator required");
  app = initializeApp({ projectId: "demo-satsunicgo" }, run);
  db = getFirestore(app);
  await getAuth(app).createUser({
    uid,
    email,
    emailVerified: true,
    displayName: name,
  });
  await getAuth(app).updateUser(uid, {
    providerToLink: { providerId: "google.com", uid, email, displayName: name },
  });
  for (const [path, data] of [
    [
      `users/${uid}`,
      { ownerId: uid, displayName: name, locked: false, version: 1 },
    ],
    [
      `staffAccess/${uid}`,
      { active: true, locked: false, roles: ["OWNER"], version: 1 },
    ],
    [
      `blogEditorialMembers/${uid}`,
      { id: uid, uid, name, email, role: "admin", active: true, revision: 1 },
    ],
  ] as const) {
    owned.add(path);
    await db.doc(path).create(data);
  }

  const author = await command<{ record: { id: string } }>(
    "studioAdvancedCommand",
    {
      action: "catalogUpdate",
      payload: {
        kind: "authors",
        name: "Tác giả tham chiếu",
        bio: "Hồ sơ tác giả dùng để đối chiếu giao diện.",
      },
    },
  );
  authorId = author.record.id;
  owned.add(`blogAuthors/${authorId}`);
  categoryName = `Hướng dẫn ${run}`;
  const category = await command<{ record: { id: string } }>(
    "studioAdvancedCommand",
    {
      action: "catalogUpdate",
      payload: { kind: "taxonomy", name: categoryName },
    },
  );
  owned.add(`blogCategories/${category.record.id}`);
  const payload = {
    title: `${run} Hướng dẫn gửi hàng Mỹ – Việt Nam`,
    slug: `parity-${randomUUID()}`,
    summary: "Các bước chuẩn bị và theo dõi kiện hàng của bạn.",
    answer: "",
    assignee: "",
    authorId,
    category: categoryName,
    tags: ["Vận chuyển", "Mua hộ"],
    language: "vi",
    coverId: "",
    commentsEnabled: true,
    seoTitle: "",
    seoDescription: "",
    sources: [
      { title: "Nguồn tham khảo", url: "https://example.invalid/reference" },
    ],
    body: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Chuẩn bị kiện hàng" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Kiểm tra thông tin đơn hàng và địa chỉ nhận trước khi gửi.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Các bước cần chuẩn bị" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Kiểm tra kiện và địa chỉ nhận." },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 4 },
          content: [{ type: "text", text: "Lưu ý về kiện hàng" }],
        },
        {
          type: "orderedList",
          attrs: { start: 1 },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Theo dõi trạng thái trước khi nhận.",
                    },
                  ],
                },
              ],
            },
          ],
        },
        { type: "horizontalRule" },
      ],
    },
  };
  for (const schema of schemas)
    expect(studioDraftSchema.parse(schema.parse(payload))).toEqual(
      studioDraftSchema.parse(payload),
    );
  const id = `parity027-${randomUUID()}`;
  owned.add(`blogDrafts/${id}`);
  const result = await command<{ draft: StudioPost }>("studioCommand", {
    action: "create",
    id,
    payload,
  });
  // Fixed date belongs only to this explicitly owned synthetic document. No app datafix.
  await db.doc(`blogDrafts/${id}`).update({ updatedAt: timestamp });
  post = { ...result.draft, updatedAt: timestamp };
  commentId = `parity-comment-${randomUUID()}`;
  owned.add(`blogComments/${commentId}`);
  await db.doc(`blogComments/${commentId}`).create({
    id: commentId,
    postId: id,
    uid,
    parentId: "",
    name: "Khách tham chiếu",
    text: "Tôi có thể theo dõi kiện hàng ở đâu?",
    revision: 1,
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    moderationReasons: [],
  });
});
test.afterAll(async () => {
  if (!db) return;
  if (authorId || categoryName)
    await db.runTransaction(async (tx) => {
      const ref = db.doc("blogStudioSettings/main"),
        snap = await tx.get(ref);
      if (!snap.exists) return;
      tx.update(ref, {
        authors: (snap.get("authors") ?? []).filter(
          (a: { id: string }) => a.id !== authorId,
        ),
        categories: (snap.get("categories") ?? []).filter(
          (c: string) => c !== categoryName,
        ),
        revision: Number(snap.get("revision") ?? 1) + 1,
      });
    });
  if (post) {
    // Exact owned parent only, bounded revision children. No global scans/deletes.
    const revisions = await db
      .doc(`blogDrafts/${post.id}`)
      .collection("revisions")
      .limit(10)
      .get();
    for (const revision of revisions.docs) owned.add(revision.ref.path);
  }
  for (const path of owned) await db.doc(path).delete();
  await getAuth(app).deleteUser(uid);
  await db.terminate();
  await deleteApp(app);
});
async function login(page: Page) {
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "Tài khoản thử nghiệm", exact: true }),
  ).toBeVisible();
  await page.evaluate(
    async ({ uid, email }) => {
      const resources = performance
        .getEntriesByType("resource")
        .map((e) => e.name);
      const sdkUrl = resources.find((n) =>
        new URL(n).pathname.endsWith("/firebase_auth.js"),
      );
      const sharedUrl = resources.find((n) =>
        new URL(n).pathname.endsWith("/src/shared/firebase.ts"),
      );
      if (!sdkUrl || !sharedUrl) throw Error("Actual Auth module URLs missing");
      const sdk = await import(sdkUrl),
        shared = await import(sharedUrl);
      if (!shared.emulatorMode || !shared.auth)
        throw Error("Emulator authority required");
      const signedIn = await sdk.signInWithCredential(
        shared.auth,
        sdk.GoogleAuthProvider.credential(
          JSON.stringify({ sub: uid, email, email_verified: true }),
        ),
      );
      if (signedIn.user.uid !== uid) throw Error("Fixture UID changed");
    },
    { uid, email },
  );
  await expect(
    page.getByRole("button", { name: /Tài khoản của/ }),
  ).toBeVisible();
}
type Entry = {
  id: string;
  name?: string;
  bio?: string;
  role?: string;
  email?: string;
};
type Items = { items: Entry[]; next: string | null };
type Comment = {
  id: string;
  postId: string;
  name: string;
  text: string;
  revision: number;
  status?: string;
  createdAt?: string;
};
type Surface =
  "dashboard" | "settings" | "moderation" | "account" | "editor" | "preview";
const surfaces: Surface[] = [
  "dashboard",
  "settings",
  "moderation",
  "account",
  "editor",
  "preview",
];
async function matchedFixture(surface: Surface) {
  const summary = await read<Record<string, number | null>>({
    kind: "summary",
  });
  // Only aggregate count primitives are recorded; never attach source response objects.
  for (const key of ["published", "draft", "review", "archived", "pending"]) {
    const value = summary[key];
    expect(value === null || (Number.isInteger(value) && value >= 0)).toBe(
      true,
    );
  }
  const author = (await db.doc(`blogAuthors/${authorId}`).get()).data()!;
  const categoryPath = [...owned].find((p) => p.startsWith("blogCategories/"))!;
  const category = (await db.doc(categoryPath).get()).data()!;
  let authors: Entry[] = [
    { id: authorId, name: String(author.name), bio: String(author.bio ?? "") },
  ];
  let taxonomy: Entry[] = [
    { id: categoryPath.split("/")[1], name: String(category.name) },
  ];
  let members: Entry[] = [{ id: uid, name, role: "admin", email }];
  let items: Comment[] = [],
    foreign = false;
  if (surface === "settings") {
    const a = await read<Items>({ kind: "catalog", catalog: "authors" });
    const c = await read<Items>({ kind: "catalog", catalog: "taxonomy" });
    const m = await read<Items>({ kind: "members" });
    foreign = Boolean(
      a.next ||
      c.next ||
      m.next ||
      a.items.some((x) => !owned.has(`blogAuthors/${x.id}`)) ||
      c.items.some((x) => !owned.has(`blogCategories/${x.id}`)) ||
      m.items.some((x) => x.id !== uid),
    );
    if (!foreign) {
      authors = a.items;
      taxonomy = c.items;
      members = m.items;
    }
  }
  if (surface === "moderation") {
    const result = await invoke<{ items: Comment[]; next: string | null }>(
      "studioRead",
      { kind: "moderation", status: "pending" },
      identity,
    );
    foreign = Boolean(
      result.next ||
      result.items.some((x) => !owned.has(`blogComments/${x.id}`)),
    );
    if (!foreign) items = result.items;
  }
  const list =
    surface === "dashboard"
      ? await read<{ items: StudioPost[]; next: string | null }>({
          kind: "list",
          q: run,
        })
      : { items: [post], next: null };
  if (list.items.some((x) => !owned.has(`blogDrafts/${x.id}`))) foreign = true;
  const snapshot = await db.doc(`blogDrafts/${post.id}`).get();
  expect(snapshot.get("owner")).toBe(uid);
  expect(snapshot.get("revision")).toBe(1);
  const actual = snapshot.data() as StudioPost;
  const draft = Object.fromEntries(
    Object.keys(studioDraftSchema.shape).map((key) => [
      key,
      actual[key as keyof StudioPost],
    ]),
  );
  expect(studioDraftSchema.parse(originalDraftSchema.parse(draft))).toEqual(
    studioDraftSchema.parse(draft),
  );
  return {
    foreign,
    fixture: {
      viewer: { id: uid, name, role: "admin", email },
      authors,
      taxonomy,
      members,
      post: actual,
      posts: list.items,
      next: list.next,
      query: { q: run },
      summary,
      items,
      reports: [],
      comment: {
        id: commentId,
        postId: post.id,
        name: "Khách tham chiếu",
        text: "Tôi có thể theo dõi kiện hàng ở đâu?",
        revision: 1,
        status: "pending",
        createdAt: timestamp,
      },
      accountEmbedded: surface === "account",
      readingMinutes: Math.max(
        1,
        Math.ceil(
          bodyText(actual.body).split(/\s+/).filter(Boolean).length / 220,
        ),
      ),
    },
  };
}
async function capture(page: Page, info: TestInfo, label: string) {
  const surface = page.locator(".blog-surface");
  await expect(surface).toBeVisible();
  const geometry = await surface.evaluate((root) => {
    const boundary = root.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 100) / 100;
    const offenders = Array.from(root.querySelectorAll("*"))
      .map((node) => {
        const rect = node.getBoundingClientRect(),
          style = getComputedStyle(node);
        const excess = Math.max(
          0,
          boundary.left - rect.left,
          rect.right - boundary.right,
          node.scrollWidth - node.clientWidth,
        );
        return {
          tag: node.tagName,
          classNames: Array.from(node.classList)
            .filter(
              (value) =>
                !/(?:parity|reference|e2e005|[a-f0-9]{8}-[a-f0-9]{4})/i.test(
                  value,
                ),
            )
            .slice(0, 8)
            .join(" ")
            .slice(0, 200),
          width: round(rect.width),
          left: round(rect.left),
          right: round(rect.right),
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          excess: round(excess),
          maxWidth: style.maxWidth,
          minWidth: style.minWidth,
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          fontSize: style.fontSize,
          whiteSpace: style.whiteSpace,
          overflowWrap: style.overflowWrap,
        };
      })
      .filter((item) => item.width > 0 && item.excess > 1)
      .sort((a, b) => b.excess - a.excess)
      .slice(0, 10);
    return {
      surface: {
        width: round(boundary.width),
        left: round(boundary.left),
        right: round(boundary.right),
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
      },
      offenders,
    };
  });
  const geometryPath = info.outputPath(`${label}-geometry.json`);
  await writeFile(geometryPath, JSON.stringify(geometry, null, 2));
  await info.attach(`${label}-bounded-geometry`, {
    path: geometryPath,
    contentType: "application/json",
  });
  await expect
    .poll(() => surface.evaluate((el) => el.scrollWidth <= el.clientWidth + 1))
    .toBe(true);
  const path = info.outputPath(`${label}.png`);
  await surface.screenshot({ path, animations: "disabled" });
  await info.attach(label, { path, contentType: "image/png" });
  return {
    path,
    buffer: await readFile(path),
    text: await surface.innerText(),
  };
}
for (const width of [390, 768, 1440])
  for (const surface of surfaces) {
    test(`STUDIO027 matched original reference evidence ${surface} at ${width}`, async ({
      page,
      context,
    }, info) => {
      const { foreign, fixture } = await matchedFixture(surface);
      test.skip(
        foreign,
        "NOT_RUN: full panel contains records outside this task's synthetic allowlist; no export, masking, overwrite or deletion",
      );
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await login(page);
      let mutationRequests = 0;
      const mutationDiagnostics: Record<string, unknown>[] = [];
      const responseTasks: Promise<void>[] = [];
      page.on("request", (req) => {
        if (
          req.method() === "POST" &&
          /\/(studioCommand|studioAdvancedCommand|studioMediaUpload)$/.test(
            new URL(req.url()).pathname,
          )
        ) {
          mutationRequests++;
          const task = (async () => {
            let input: Record<string, unknown> = {};
            try {
              input = req.postDataJSON()?.data ?? {};
            } catch {
              /* Malformed transport must not expose its payload. */
            }
            const action = [
              "save",
              "create",
              "publish",
              "submit",
              "archive",
              "restore",
              "delete",
              "schedule",
              "moderate",
            ].includes(String(input.action))
              ? input.action
              : "UNRECOGNIZED";
            const response = await req.response();
            const result = response ? await response.json() : null;
            mutationDiagnostics.push({
              endpoint: new URL(req.url()).pathname.split("/").pop(),
              method: req.method(),
              action,
              expectedRevision:
                typeof input.expectedVersion === "number"
                  ? input.expectedVersion
                  : null,
              resultRevision:
                typeof result?.result?.draft?.version === "number"
                  ? result.result.draft.version
                  : typeof result?.result?.draft?.revision === "number"
                    ? result.result.draft.revision
                    : null,
              success: response
                ? response.ok() && !!result?.result && !result?.error
                : false,
              terminalResponse: !!response,
            });
          })().catch(() => {
            mutationDiagnostics.push({ settlement: "FAILED" });
          });
          responseTasks.push(task);
        }
      });
      const fixturePath = info.outputPath(
        `matched-fixture-${surface}-${width}.json`,
      );
      await writeFile(fixturePath, JSON.stringify(fixture, null, 2));
      await info.attach("matched-task-owned-synthetic-fixture", {
        path: fixturePath,
        contentType: "application/json",
      });
      const suffix =
        surface === "editor"
          ? `/${post.id}`
          : surface === "preview"
            ? `/${post.id}/preview`
            : surface === "settings"
              ? "/settings"
              : surface === "moderation"
                ? "/comments?status=pending"
                : surface === "account"
                  ? "/account"
                  : `?q=${run}`;
      await page.goto(`/crm/studio${suffix}`);
      const heading =
        surface === "dashboard"
          ? "Bài viết của bạn"
          : surface === "settings"
            ? "Cài đặt"
            : surface === "moderation"
              ? "Giữ cuộc trò chuyện có giá trị."
              : surface === "account"
                ? "Tài khoản"
                : post.title;
      if (surface === "editor")
        await expect(
          page.getByRole("textbox", { name: "Tiêu đề", exact: true }),
        ).toHaveValue(post.title);
      else
        await expect(
          page.getByRole("heading", { name: heading, exact: true }),
        ).toBeVisible();
      const reference = await context.newPage();
      try {
        await reference.setViewportSize({ width, height: 1000 });
        await reference.emulateMedia({ reducedMotion: "reduce" });
        await reference.route("**/*", (route) =>
          new URL(route.request().url()).origin === referenceOrigin
            ? route.continue()
            : route.abort("blockedbyclient"),
        );
        await reference.addInitScript((value) => {
          (
            window as unknown as { __referenceFixtureOverride: unknown }
          ).__referenceFixtureOverride = value;
        }, fixture);
        const originalSuffix =
          surface === "editor"
            ? "/reference-post"
            : surface === "preview"
              ? "/reference-post/preview"
              : surface === "settings"
                ? "/settings"
                : surface === "moderation"
                  ? "/comments"
                  : surface === "account"
                    ? "/account"
                    : `?q=${run}`;
        await reference.goto(`${referenceOrigin}/admin/blog${originalSuffix}`);
        if (surface === "editor") {
          await expect(
            reference.getByRole("textbox", { name: "Tiêu đề", exact: true }),
          ).toHaveValue(post.title);
          for (const p of [page, reference])
            await expect(
              p.getByRole("textbox", { name: "Tóm tắt", exact: true }),
            ).toHaveValue(post.summary);
        } else
          await expect(
            reference.getByRole("heading", { name: heading, exact: true }),
          ).toBeVisible();
        if (surface === "editor")
          for (const p of [page, reference]) {
            await expect(
              p.getByRole("textbox", {
                name: "Nội dung bài viết",
                exact: true,
              }),
            ).toContainText(
              "Kiểm tra thông tin đơn hàng và địa chỉ nhận trước khi gửi.",
            );
          }
        if (surface === "preview")
          for (const p of [page, reference]) {
            await expect(
              p.getByText(post.summary, { exact: true }),
            ).toBeVisible();
            await expect(
              p.getByRole("heading", {
                name: "Chuẩn bị kiện hàng Copy section link",
                exact: true,
              }),
            ).toBeVisible();
          }
        if (surface === "preview")
          for (const p of [page, reference]) {
            await expect(
              p
                .getByRole("heading", {
                  name: "Chuẩn bị kiện hàng Copy section link",
                  exact: true,
                })
                .getByRole("button", {
                  name: "Copy section link",
                  exact: true,
                }),
            ).toBeVisible();
          }
        const brandMarks = async (target: Page) =>
          target.locator(".blog-surface a.brand").evaluateAll((links) => {
            const properties = (element: Element, pseudo?: string) => {
              const style = getComputedStyle(element, pseudo);
              return Object.fromEntries(
                [
                  "display",
                  "gridTemplateColumns",
                  "gap",
                  "color",
                  "backgroundColor",
                  "width",
                  "height",
                  "fontFamily",
                  "fontSize",
                  "fontWeight",
                  "lineHeight",
                  "letterSpacing",
                  "transform",
                  "transformOrigin",
                  "scale",
                  "content",
                  "position",
                  "top",
                  "left",
                  "right",
                  "bottom",
                ].map((key) => [
                  key,
                  style.getPropertyValue(
                    key.replace(
                      /[A-Z]/g,
                      (letter) => `-${letter.toLowerCase()}`,
                    ),
                  ),
                ]),
              );
            };
            return links.map((link) => {
              const mark = link.querySelector(".brand__mark");
              if (!mark) throw Error("Original BrandMark structure missing");
              const rect = mark.getBoundingClientRect();
              return {
                label: link.getAttribute("aria-label"),
                href: link.getAttribute("href"),
                markHidden: mark.getAttribute("aria-hidden"),
                linkStyle: properties(link),
                markStyle: properties(mark),
                geometry: { width: rect.width, height: rect.height },
                bars: [...mark.children].map((bar) => ({
                  style: properties(bar),
                  before: properties(bar, "::before"),
                  after: properties(bar, "::after"),
                })),
              };
            });
          });
        const originalBrands = await brandMarks(reference);
        const goBrands = await brandMarks(page);
        expect(goBrands).toHaveLength(originalBrands.length);
        for (let index = 0; index < originalBrands.length; index++) {
          const originalBrand = originalBrands[index];
          const mappedHref = originalBrand.href
            ?.replace(/^\/admin\/blog(?=\/|$)/, "/crm/studio")
            .replace(/^\/resources\/blog(?=\/|$)/, "/posts");
          expect(originalBrand.bars).toHaveLength(2);
          expect(goBrands[index]).toEqual({
            ...originalBrand,
            href: mappedHref,
          });
          const originalLink = reference
            .locator(".blog-surface a.brand")
            .nth(index);
          const goLink = page.locator(".blog-surface a.brand").nth(index);
          const originalVisible = await originalLink.isVisible();
          expect(await goLink.isVisible()).toBe(originalVisible);
          const accessibleName = originalVisible
            ? (originalBrand.label ?? "")
            : "";
          await expect(originalLink).toHaveAccessibleName(accessibleName);
          await expect(goLink).toHaveAccessibleName(accessibleName);
        }
        await info.attach("matched-original-brand-mark", {
          body: JSON.stringify({ original: originalBrands, go: goBrands }),
          contentType: "application/json",
        });
        if (surface === "preview") {
          const typography = async (target: Page) =>
            target.locator(".author-card h3").evaluate((heading) => {
              const style = getComputedStyle(heading);
              return {
                fontFamily: style.fontFamily,
                fontWeight: style.fontWeight,
                fontSize: style.fontSize,
                lineHeight: style.lineHeight,
                fontSynthesis: style.fontSynthesis,
              };
            });
          const originalHeading = await typography(reference);
          const goHeading = await typography(page);
          await info.attach("matched-author-heading-typography", {
            body: JSON.stringify({ original: originalHeading, go: goHeading }),
            contentType: "application/json",
          });
          const dependencies = async (target: Page) =>
            target.locator(".article-body").evaluate((article) =>
              [
                ".article-prose h3",
                ".article-prose h4",
                ".article-prose ul",
                ".article-prose ol",
                ".article-prose hr",
                "#sources ol",
              ].map((selector) => {
                const element = article.querySelector(selector);
                if (!element)
                  throw Error("Required original dependency node missing");
                const style = getComputedStyle(element);
                return {
                  selector,
                  fontWeight: style.fontWeight,
                  fontSize: style.fontSize,
                  fontSynthesis: style.fontSynthesis,
                  listStyleType: style.listStyleType,
                  marginBlockStart: style.marginBlockStart,
                  marginBlockEnd: style.marginBlockEnd,
                  paddingInlineStart: style.paddingInlineStart,
                  borderTopWidth: style.borderTopWidth,
                  borderTopStyle: style.borderTopStyle,
                  borderTopColor: style.borderTopColor,
                  color: style.color,
                  backgroundColor: style.backgroundColor,
                };
              }),
            );
          const originalDependencies = await dependencies(reference);
          const goDependencies = await dependencies(page);
          await info.attach("matched-original-style-dependencies", {
            body: JSON.stringify({
              original: originalDependencies,
              go: goDependencies,
            }),
            contentType: "application/json",
          });
          for (let index = 0; index < originalDependencies.length; index++) {
            const expected = originalDependencies[index],
              actual = goDependencies[index];
            expect(actual.selector).toBe(expected.selector);
            expect(actual.fontWeight).toBe(expected.fontWeight);
            expect(actual.fontSize).toBe(expected.fontSize);
            expect(actual.fontSynthesis).toBe(expected.fontSynthesis);
            expect(actual.listStyleType).toBe(expected.listStyleType);
            expect(actual.paddingInlineStart).toBe(expected.paddingInlineStart);
            expect(actual.marginBlockStart).toBe(expected.marginBlockStart);
            expect(actual.marginBlockEnd).toBe(expected.marginBlockEnd);
            expect(actual.borderTopWidth).toBe(expected.borderTopWidth);
            expect(actual.borderTopStyle).toBe(expected.borderTopStyle);
            expect(actual.borderTopColor).toBe(expected.borderTopColor);
            expect(actual.color).toBe(expected.color);
            expect(actual.backgroundColor).toBe(expected.backgroundColor);
          }
          expect(goHeading.fontSynthesis).toBe(originalHeading.fontSynthesis);
          expect(goHeading.fontWeight).toBe(originalHeading.fontWeight);
          expect(goHeading.fontSize).toBe(originalHeading.fontSize);
          expect(goHeading.lineHeight).toBe(originalHeading.lineHeight);
        }
        const original = await capture(
          reference,
          info,
          `original-${surface}-${width}`,
        );
        const go = await capture(page, info, `go-${surface}-${width}`);
        const a = await sharp(original.buffer)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const b = await sharp(go.buffer)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const sameDimensions =
          a.info.width === b.info.width && a.info.height === b.info.height;
        let changedPixels: number | null = null;
        if (sameDimensions) {
          changedPixels = 0;
          for (let i = 0; i < a.data.length; i += 4)
            if (
              [0, 1, 2, 3].some(
                (channel) => a.data[i + channel] !== b.data[i + channel],
              )
            )
              changedPixels++;
        }
        const report = {
          evidence: "MATCHED_SYNTHETIC_CAPTURE",
          status: "REVIEW_REQUIRED",
          surface,
          viewport: { width, height: 1000 },
          original: {
            width: a.info.width,
            height: a.info.height,
            sha256: createHash("sha256").update(original.buffer).digest("hex"),
          },
          go: {
            width: b.info.width,
            height: b.info.height,
            sha256: createHash("sha256").update(go.buffer).digest("hex"),
          },
          sameDimensions,
          changedPixels,
          textEqual: original.text === go.text,
          summaryCounts: fixture.summary,
          limitations: [
            "Original API transport always503; Go actual callable reads",
            "Next router/pending/SSR/auth are harness adaptations",
            "Original BrandMark structure/paint/geometry measured; route mappings and host dimensions remain unmasked adapters",
            "Account embedded=true intentionally matches Go host language/layout",
            "Default-state evidence only; no automatic parity certificate",
          ],
        };
        const path = info.outputPath(`comparison-${surface}-${width}.json`);
        await writeFile(path, JSON.stringify(report, null, 2));
        await info.attach("comparison-review-required", {
          path,
          contentType: "application/json",
        });
        expect(mutationRequests).toBe(0);
        expect((await db.doc(`blogDrafts/${post.id}`).get()).data()).toEqual(
          fixture.post,
        );
        expect((await db.doc(`blogPublished/${post.id}`).get()).exists).toBe(
          false,
        );
      } finally {
        try {
          await Promise.allSettled(responseTasks);
          const after = (await db.doc(`blogDrafts/${post.id}`).get()).data();
          const bodyShape = (value: unknown) => {
            const counts: Record<string, number> = {};
            const visit = (node: unknown) => {
              if (!node || typeof node !== "object") return;
              const item = node as { type?: unknown; content?: unknown[] };
              const allowed = [
                "doc",
                "paragraph",
                "heading",
                "text",
                "horizontalRule",
                "image",
                "bulletList",
                "orderedList",
                "listItem",
                "blockquote",
                "codeBlock",
                "hardBreak",
              ];
              const type = allowed.includes(String(item.type))
                ? String(item.type)
                : "OTHER";
              counts[type] = (counts[type] ?? 0) + 1;
              if (Array.isArray(item.content)) item.content.forEach(visit);
            };
            visit(value);
            const content = (
              value as { content?: { type?: string }[] } | undefined
            )?.content;
            return {
              counts,
              finalTypes:
                content
                  ?.slice(-3)
                  .map((node) =>
                    [
                      "paragraph",
                      "horizontalRule",
                      "heading",
                      "image",
                      "bulletList",
                      "orderedList",
                    ].includes(node.type ?? "")
                      ? node.type
                      : "OTHER",
                  ) ?? [],
            };
          };
          await info.attach("zero-write-terminal-diagnostic", {
            body: JSON.stringify({
              rpc: mutationDiagnostics,
              registeredResponses: responseTasks.length,
              changedTopLevelFields: Object.keys(fixture.post).filter(
                (key) =>
                  JSON.stringify(after?.[key]) !==
                  JSON.stringify(
                    (fixture.post as unknown as Record<string, unknown>)[key],
                  ),
              ),
              before: bodyShape(fixture.post.body),
              after: bodyShape(after?.body),
            }),
            contentType: "application/json",
          });
        } catch {
          info.annotations.push({
            type: "diagnostic",
            description:
              "Own-post terminal diagnostic unavailable; primary assertions retained",
          });
        }
        await reference.close();
      }
    });
  }

for (const width of [390, 768, 1440])
  test(`STUDIO027 Go-only focus without edits preserves trailing-rule draft at ${width}`, async ({
    page,
  }, info) => {
    const payload = studioDraftSchema.parse(
      Object.fromEntries(
        Object.keys(studioDraftSchema.shape).map((key) => [
          key,
          post[key as keyof StudioPost],
        ]),
      ),
    );
    for (const schema of schemas)
      expect(studioDraftSchema.parse(schema.parse(payload))).toEqual(payload);
    expect(payload.body.content?.at(-1)?.type).toBe("horizontalRule");
    const id = `parity027-focus-${randomUUID()}`;
    owned.add(`blogDrafts/${id}`);
    const result = await command<{ draft: StudioPost }>("studioCommand", {
      action: "create",
      id,
      payload,
    });
    const before = (await db.doc(`blogDrafts/${id}`).get()).data();
    expect(before?.revision).toBe(result.draft.revision);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page);
    let mutationRequests = 0;
    const rpc: Record<string, unknown>[] = [];
    const tasks: Promise<void>[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        /\/(studioCommand|studioAdvancedCommand|studioMediaUpload)$/.test(
          new URL(request.url()).pathname,
        )
      ) {
        mutationRequests++;
        tasks.push(
          (async () => {
            const data = request.postDataJSON()?.data ?? {};
            const response = await request.response();
            const result = response ? await response.json() : null;
            rpc.push({
              endpoint: new URL(request.url()).pathname.split("/").pop(),
              method: request.method(),
              action: [
                "save",
                "create",
                "publish",
                "submit",
                "archive",
              ].includes(data.action)
                ? data.action
                : "OTHER",
              expectedRevision:
                typeof data.expectedVersion === "number"
                  ? data.expectedVersion
                  : null,
              resultRevision:
                typeof result?.result?.draft?.revision === "number"
                  ? result.result.draft.revision
                  : null,
              terminalResponse: !!response,
              success: !!response?.ok() && !!result?.result && !result?.error,
            });
          })().catch(() => {
            rpc.push({ settlement: "FAILED" });
          }),
        );
      }
    });
    try {
      await page.goto(`/crm/studio/${id}`);
      const body = page.getByRole("textbox", {
        name: "Nội dung bài viết",
        exact: true,
      });
      await expect(body).toBeVisible();
      await body.focus();
      await page.getByRole("textbox", { name: "Tiêu đề", exact: true }).focus();
      // Observe the real 1800ms autosave debounce after focus/blur; no text command.
      await page.waitForTimeout(2100);
      expect(mutationRequests).toBe(0);
      const after = (await db.doc(`blogDrafts/${id}`).get()).data();
      expect(after?.body).toEqual(before?.body);
      expect(after?.revision).toBe(before?.revision);
    } finally {
      try {
        await Promise.allSettled(tasks);
        const after = (await db.doc(`blogDrafts/${id}`).get()).data();
        const shape = (value: unknown) => {
          const counts: Record<string, number> = {};
          const visit = (node: unknown) => {
            if (!node || typeof node !== "object") return;
            const item = node as { type?: string; content?: unknown[] };
            const type = [
              "doc",
              "paragraph",
              "text",
              "heading",
              "horizontalRule",
              "bulletList",
              "orderedList",
              "listItem",
            ].includes(item.type ?? "")
              ? item.type!
              : "OTHER";
            counts[type] = (counts[type] ?? 0) + 1;
            if (Array.isArray(item.content)) item.content.forEach(visit);
          };
          visit(value);
          const content = (
            value as { content?: { type?: string }[] } | undefined
          )?.content;
          return {
            counts,
            finalTypes:
              content
                ?.slice(-3)
                .map((node) =>
                  [
                    "paragraph",
                    "horizontalRule",
                    "heading",
                    "bulletList",
                    "orderedList",
                  ].includes(node.type ?? "")
                    ? node.type
                    : "OTHER",
                ) ?? [],
          };
        };
        await info.attach("focus-only-terminal-diagnostic", {
          body: JSON.stringify({
            rpc,
            registeredResponses: tasks.length,
            beforeRevision: before?.revision,
            afterRevision: after?.revision,
            before: shape(before?.body),
            after: shape(after?.body),
          }),
          contentType: "application/json",
        });
      } catch {
        info.annotations.push({
          type: "diagnostic",
          description:
            "Focus-only own-record diagnostic unavailable; primary assertion preserved",
        });
      }
    }
  });
