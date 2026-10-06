import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  db,
  customer,
  operator,
} from "./fixtures";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
import { invoke } from "./http";
const prefix = `large027-${randomUUID()}`;
const owned: string[] = [];
const reportId = `000000-${prefix}`;
test.beforeAll(async () => {
  await seedIdentities();
  await invoke("studioCommand", {
    action: "create",
    id: prefix,
    operationId: randomUUID(),
    payload: {
      ...emptyStudioDraft,
      title: "Synthetic large moderation027",
      authorId: operator,
    },
  });
  const rows = [];
  for (const status of ["pending", "approved"])
    for (let index = 0; index < 1001; index++) {
      const id = `${prefix}-${status}-${index}`;
      const at = new Date(Date.now() + index).toISOString();
      owned.push(`blogComments/${id}`);
      rows.push({
        id,
        postId: prefix,
        parentId: "",
        uid: customer,
        name: "Synthetic reader027",
        text: `Synthetic ${status} moderation027 ${index}`,
        status,
        revision: 1,
        createdAt: at,
        updatedAt: at,
      });
    }
  for (let offset = 0; offset < rows.length; offset += 500) {
    const batch = db.batch();
    for (const row of rows.slice(offset, offset + 500))
      batch.set(db.doc(`blogComments/${row.id}`), row);
    await batch.commit();
  }
  owned.push(`blogCommentReports/${reportId}`);
  await db.doc(`blogCommentReports/${reportId}`).set({
    commentId: `${prefix}-approved-0`,
    reason: `Synthetic scoped report ${prefix}`,
    reporter: customer,
    state: "open",
    revision: 1,
    createdAt: new Date().toISOString(),
  });
});

for (const droppedAction of ["moderate", "reportResolve"] as const)
  test(`STUDIO027 hide-report recovery replays only the uncertain ${droppedAction} step`, async ({
    page,
  }) => {
    const id = `000000-recovery-${randomUUID()}`;
    const commentId = `recovery027-${randomUUID()}`;
    expect(commentId.length).toBeLessThanOrEqual(80);
    const reason = `Synthetic report recovery ${id}`;
    owned.push(`blogComments/${commentId}`, `blogCommentReports/${id}`);
    const at = new Date().toISOString();
    await db.doc(`blogComments/${commentId}`).set({
      id: commentId,
      postId: prefix,
      parentId: "",
      uid: customer,
      name: "Synthetic reader027",
      text: "Synthetic recovery comment027",
      status: "approved",
      revision: 1,
      createdAt: at,
      updatedAt: at,
    });
    await db.doc(`blogCommentReports/${id}`).set({
      commentId,
      reason,
      reporter: customer,
      state: "open",
      revision: 1,
      createdAt: at,
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
    await page.goto("/crm/studio/comments?status=reports");
    const card = page.locator("section.state-card").filter({
      has: page.getByRole("heading", { name: reason, exact: true }),
    });
    const commands: Record<string, unknown>[] = [];
    let dropped = false;
    await page.route(
      /\/(studioCommand|studioAdvancedCommand)$/,
      async (route) => {
        const data = route.request().postDataJSON().data;
        if (data.id !== id && data.id !== commentId) return route.continue();
        commands.push(data);
        if (!dropped && data.action === droppedAction) {
          dropped = true;
          expect((await (await route.fetch()).json()).result).toBeTruthy();
          return route.abort("failed");
        }
        return route.continue();
      },
    );
    const hide = card.getByRole("button", {
      name: "Ẩn và xử lý báo cáo",
      exact: true,
    });
    await hide.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await hide.click();
    await expect
      .poll(async () =>
        (await db.doc(`blogCommentReports/${id}`).get()).get("state"),
      )
      .toBe("resolved");
    expect(
      (await db.doc(`blogComments/${commentId}`).get()).get("status"),
    ).toBe("hidden");
    const uncertain = commands.filter(
      (command) => command.action === droppedAction,
    );
    expect(uncertain).toHaveLength(2);
    expect(uncertain[1]).toEqual(uncertain[0]);
    expect(
      commands.filter(
        (command) =>
          command.action ===
          (droppedAction === "moderate" ? "reportResolve" : "moderate"),
      ),
    ).toHaveLength(1);
  });
test.afterAll(async () => {
  for (let offset = 0; offset < owned.length; offset += 500) {
    const batch = db.batch();
    for (const path of owned.slice(offset, offset + 500))
      batch.delete(db.doc(path));
    await batch.commit();
  }
  await closeFixtures();
});
test("STUDIO027 over1000 moderation queues open with bounded pages and reports hydrate only referenced comments", async ({
  page,
}) => {
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
  const reads: { kind?: string; status?: string }[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/(studioRead|studioAdvancedRead)$/.test(new URL(request.url()).pathname)
    )
      reads.push(request.postDataJSON().data);
  });
  await page.goto("/crm/studio/comments");
  await expect(
    page.getByRole("heading", {
      name: "Giữ cuộc trò chuyện có giá trị.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("30 mục trên trang này", { exact: true }),
  ).toBeVisible();
  const initial = reads.filter((row) => row.kind === "moderation");
  expect(initial.length).toBeGreaterThan(0);
  expect(initial.length).toBeLessThanOrEqual(2); // React StrictMode can issue the abandoned initial read.
  await page.getByRole("link", { name: "Trang tiếp", exact: true }).click();
  await expect(page).toHaveURL(/cursor=/);
  await expect(
    page.getByText("30 mục trên trang này", { exact: true }),
  ).toBeVisible();
  reads.length = 0;
  await page.goto("/crm/studio/comments?status=reports");
  const report = page.locator("section.state-card").filter({
    has: page.getByRole("heading", {
      name: `Synthetic scoped report ${prefix}`,
      exact: true,
    }),
  });
  await expect(report).toBeVisible();
  await expect(report.locator("blockquote")).toHaveText(
    "Synthetic approved moderation027 0",
  );
  expect(reads.filter((row) => row.kind === "moderation")).toHaveLength(0);
  expect(
    reads.filter((row) => row.kind === "reports").length,
  ).toBeLessThanOrEqual(2);
});
