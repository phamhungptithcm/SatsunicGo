import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  seedIdentities,
  closeFixtures,
  db,
  customer,
  otherCustomer,
} from "./fixtures";
import { artifactDirectory } from "./artifact-path";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
test("COMMENTS027 newest thread private edit delete and report use real demo services", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const postId = randomUUID(),
    slug = `comments027-${postId}`,
    oldId = randomUUID(),
    newId = randomUUID(),
    ownId = randomUUID(),
    replyId = randomUUID();
  await db.doc("blogStudioSettings/main").set({
    commentsEnabled: true,
    requireReview: true,
    categories: ["Hướng dẫn"],
    authors: [],
    revision: 1,
  });
  await db.doc(`blogPublished/${postId}`).set({
    id: postId,
    title: `Synthetic comments027 ${postId}`,
    slug,
    status: "published",
    revision: 1,
    summary: "Synthetic public only",
    commentsEnabled: true,
    commentCount: 2,
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Synthetic published body027" }],
        },
      ],
    },
  });
  const at = (n: number) => new Date(Date.now() - n).toISOString();
  const comment = (
    id: string,
    text: string,
    createdAt: string,
    uid = otherCustomer,
    parentId = "",
    status = "approved",
  ) => ({
    id,
    postId,
    parentId,
    uid,
    name: "Synthetic public name",
    text,
    status,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
  });
  await db
    .doc(`blogComments/${oldId}`)
    .set(comment(oldId, "Synthetic older027", at(20000)));
  await db.doc(`blogComments/${newId}`).set({
    ...comment(newId, "Synthetic newer027", at(10000)),
    approvedReplyCount: 1,
  });
  await db
    .doc(`blogComments/${replyId}`)
    .set(
      comment(
        replyId,
        "Synthetic public reply027",
        at(5000),
        otherCustomer,
        newId,
      ),
    );
  await db
    .doc(`blogComments/${ownId}`)
    .set(
      comment(
        ownId,
        "Synthetic pending own027",
        at(1000),
        customer,
        "",
        "pending",
      ),
    );
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
  await page.goto(`/posts/${slug}`);
  const region = page.getByRole("region", {
    name: "Bình luận bài viết",
    exact: true,
  });
  await expect(region).toBeVisible();
  const comments = region.locator(":scope > article");
  await expect(comments).toHaveCount(2);
  await expect(comments.first()).toContainText("Synthetic newer027");
  await comments
    .first()
    .getByRole("button", { name: "Xem trả lời", exact: true })
    .click();
  await expect(comments.first()).toContainText("Synthetic public reply027");
  const own = region.locator(".own-comments");
  await expect(own).toContainText("Synthetic pending own027");
  await own.getByRole("button", { name: "Sửa", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Sửa bình luận", exact: true });
  await edit
    .getByRole("textbox", { name: "Nội dung bình luận", exact: true })
    .fill("Synthetic edited pending027");
  await edit
    .getByRole("button", { name: "Gửi bản sửa để duyệt", exact: true })
    .click();
  await expect(own).toContainText("Synthetic edited pending027");
  expect((await db.doc(`blogComments/${ownId}`).get()).data()?.status).toBe(
    "pending",
  );
  await expect(
    comments.filter({ hasText: "Synthetic edited pending027" }),
  ).toHaveCount(0);
  await own.getByRole("button", { name: "Xóa", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Xóa bình luận này?", exact: true })
    .getByRole("button", { name: "Xác nhận xóa", exact: true })
    .click();
  await expect
    .poll(
      async () => (await db.doc(`blogComments/${ownId}`).get()).data()?.status,
    )
    .toBe("deleted_private");
  await expect(region.locator(`:scope > article#comment-${ownId}`)).toHaveCount(
    0,
  );
  await expect(comments).toHaveCount(2);
  await region
    .locator(`article#comment-${newId}`)
    .getByRole("button", { name: "Báo cáo", exact: true })
    .first()
    .click();
  const report = page.getByRole("dialog", {
    name: "Báo cáo bình luận",
    exact: true,
  });
  await report
    .getByRole("textbox", { name: "Lý do báo cáo", exact: true })
    .fill("Synthetic moderation report027");
  await report
    .getByRole("button", { name: "Gửi báo cáo", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: /^Đã gửi báo cáo\.$/ }),
  ).toBeVisible();
  await page.goto(`/posts/${slug}#comment-${replyId}`);
  await expect(
    region.getByRole("complementary", {
      name: "Bình luận được chia sẻ",
      exact: true,
    }),
  ).toContainText("Synthetic public reply027");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${artifactDirectory}/comments027-390.png` });
});

test("STUDIO027 one-character published post slug remains readable", async ({
  page,
}) => {
  // One stable, explicitly owned synthetic fixture; no broad cleanup or data reset.
  await db.doc("blogPublished/single-character-post027").set({
    id: "single-character-post027",
    title: "Synthetic one character slug027",
    slug: "z",
    status: "published",
    revision: 1,
    commentsEnabled: false,
    body: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Synthetic one character body027" }],
        },
      ],
    },
  });
  await page.goto("/posts/z");
  await expect(
    page.getByRole("heading", {
      name: "Synthetic one character slug027",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Synthetic one character body027", { exact: true }),
  ).toBeVisible();
});
