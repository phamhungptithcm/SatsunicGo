import { test, expect } from "@playwright/test";
import { seedIdentities, closeFixtures, db, operator } from "./fixtures";
import { artifactDirectory } from "./artifact-path";
import { randomUUID } from "node:crypto";
test.beforeAll(seedIdentities);
test.afterAll(closeFixtures);
for (const width of [390, 768, 1440])
  test(`STUDIO027 autosave private draft publish snapshot and edit isolation at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 390) await page.emulateMedia({ reducedMotion: "reduce" });
    await db.doc("blogStudioSettings/main").set({
      commentsEnabled: false,
      requireReview: true,
      categories: ["Hướng dẫn"],
      authors: [
        { id: operator, name: "Synthetic editor027", bio: "Synthetic only" },
      ],
      revision: 1,
    });
    await db
      .doc(`blogAuthors/${operator}`)
      .set({
        id: operator,
        name: "Synthetic editor027",
        bio: "Synthetic only",
        revision: 1,
      });
    await db
      .doc("blogCategories/guide027")
      .set({ id: "guide027", name: "Hướng dẫn", revision: 1 });
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
    await page.goto("/crm/studio");
    await page
      .getByRole("button", { name: "Viết bài mới", exact: true })
      .click();
    const title = `Studio027 ${randomUUID()}`;
    await page
      .getByRole("textbox", { name: "Tiêu đề", exact: true })
      .fill(title);
    await page
      .getByRole("textbox", { name: "Tóm tắt", exact: true })
      .fill("Synthetic clear publication summary");
    await page
      .getByRole("combobox", { name: "Tác giả", exact: true })
      .selectOption(operator);
    const category = page.getByRole("combobox", {
      name: "Chuyên mục",
      exact: true,
    });
    await category.fill("Hướng dẫn");
    await category.press("ArrowDown");
    await category.press("Enter");
    const sourceDetails = page.locator("details").filter({has: page.locator("summary").filter({hasText:"Nguồn tham khảo & ý chính"})});
    if (await sourceDetails.getAttribute("open") === null)
      await sourceDetails.locator("summary").click();
    await page
      .getByRole("textbox", {
        name: "Nguồn tham khảo — mỗi dòng: tên | URL",
        exact: true,
      })
      .fill("Synthetic source | https://example.invalid/source");
    const body = page.getByRole("textbox", {
      name: "Nội dung bài viết",
      exact: true,
    });
    await body.fill("Synthetic original public body027");
    await page
      .getByRole("button", { name: "Lưu bản nháp", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: /^Đã lưu\.$/ }),
    ).toBeVisible();
    const draftQuery = await db
      .collection("blogDrafts")
      .where("title", "==", title)
      .get();
    expect(draftQuery.size).toBe(1);
    const id = draftQuery.docs[0].id;
    expect((await db.doc(`blogPublished/${id}`).get()).exists).toBe(false);
    await page
      .getByRole("button", { name: "Gửi duyệt", exact: true })
      .first()
      .click();
    await expect
      .poll(async () => (await db.doc(`blogDrafts/${id}`).get()).data()?.state)
      .toBe("review");
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    const dialog = page.getByRole("dialog", {
      name: "Xuất bản bài viết",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Xuất bản ngay", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Bài viết của bạn", exact: true }),
    ).toBeVisible();
    await expect
      .poll(async () => (await db.doc(`blogPublished/${id}`).get()).exists)
      .toBe(true);
    const published = (await db.doc(`blogPublished/${id}`).get()).data()!;
    expect(JSON.stringify(published.body)).toContain(
      "Synthetic original public body027",
    );
    await page.locator("a.post-title").filter({ hasText: title }).click();
    await body.fill("Synthetic private revised body027");
    await expect
      .poll(async () =>
        JSON.stringify((await db.doc(`blogDrafts/${id}`).get()).data()?.body),
      )
      .toContain("Synthetic private revised body027");
    expect((await db.doc(`blogPublished/${id}`).get()).data()).toEqual(
      published,
    );
    expect(
      await page
        .locator("main")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `${artifactDirectory}/studio027-editor-${width}.png`,
    });
    await page.goto(`/posts/${published.slug}`);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic original public body027", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic private revised body027", { exact: true }),
    ).toHaveCount(0);
  });
