import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import {
  fixture,
  parseReferenceFixture,
} from "../fixtures/studio-reference/fixture";
import { draftSchema as originalDraftSchema } from "../fixtures/studio-reference/lib/blog/schema";
import {
  studioDraftSchema,
  studioSettingsSchema,
} from "../../packages/domain/blog-studio";

// Isolated actual-component capture only; actual CRM routes remain NOT_RUN.
// A passing capture is REVIEW_REQUIRED, never automatic visual parity acceptance.
const id = `component${randomUUID().replaceAll("-", "")}`;
const value = structuredClone(fixture);
value.viewer.id = `${id}-member`;
value.viewer.email = `${id}@example.invalid`;
value.members[0] = {
  ...value.members[0],
  id: value.viewer.id,
  email: value.viewer.email,
};
value.authors[0].id = `${id}-author`;
value.taxonomy[0].id = `${id}-category`;
value.post.id = `${id}-post`;
value.post.owner = value.viewer.id;
value.post.authorId = value.authors[0].id;
value.comment.id = `${id}-comment`;
value.comment.postId = value.post.id;
const second = {
  ...value.comment,
  id: `${id}-second`,
  name: "Khách thứ hai",
  text: "Tôi cần chuẩn bị giấy tờ nào?",
};
const shared = { ...value, items: [value.comment, second], reports: [] };
parseReferenceFixture(shared);
studioDraftSchema.parse(originalDraftSchema.parse(shared.post));
studioSettingsSchema.parse({
  commentsEnabled: true,
  requireReview: true,
  categories: shared.taxonomy.map((t) => t.name),
  authors: shared.authors,
});

async function prepare(page: Page, origin: string, route: string) {
  const blocked: string[] = [];
  await page.route("**/*", async (r) => {
    const url = new URL(r.request().url());
    if (
      url.origin === origin ||
      url.protocol === "data:" ||
      url.protocol === "blob:"
    )
      await r.continue();
    else {
      blocked.push(url.origin);
      await r.abort("blockedbyclient");
    }
  });
  await page.addInitScript((f) => {
    (
      window as unknown as { __referenceFixtureOverride: typeof f }
    ).__referenceFixtureOverride = f;
  }, shared);
  await page.goto(`${origin}${route}`);
  await expect(
    page.getByRole("heading", {
      name: route.endsWith("settings")
        ? "Cài đặt"
        : "Giữ cuộc trò chuyện có giá trị.",
      exact: true,
    }),
  ).toBeVisible();
  if (origin.endsWith("5194"))
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { __componentFirebaseNull: boolean })
            .__componentFirebaseNull,
      ),
    ).toBe(true);
  return blocked;
}
async function capture(page: Page, info: TestInfo, label: string) {
  await page.screenshot({
    path: info.outputPath(`${label}.png`),
    fullPage: true,
  });
  return page.evaluate(() => {
    const main = document.querySelector(".studio-main")!;
    const rect = main.getBoundingClientRect();
    return {
      text: main.textContent,
      geometry: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      controls: [
        ...main.querySelectorAll("button,input,select,textarea,a"),
      ].map((el) => ({
        tag: el.tagName,
        text: el.textContent,
        label: el.getAttribute("aria-label"),
        disabled: el.hasAttribute("disabled"),
        font: getComputedStyle(el).font,
        color: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor,
      })),
      typography: [
        ...main.querySelectorAll("strong,label,h1,h2,h3,h4,h5,h6,.primary"),
      ].map((el) => {
        const style = getComputedStyle(el);
        const bounds = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: el.textContent,
          primary: el.classList.contains("primary"),
          font: style.font,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSynthesis: style.fontSynthesis,
          boxShadow: style.boxShadow,
          geometry: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
          },
        };
      }),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
}
for (const width of [390, 768, 1440]) {
  for (const screen of ["settings", "comments"] as const) {
    test(`COMPONENT032 ${screen} ${width} isolated capture REVIEW_REQUIRED`, async ({
      browser,
    }, info) => {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
      });
      const pages = [await context.newPage(), await context.newPage()];
      try {
        const blocked = [];
        blocked.push(
          await prepare(
            pages[0],
            "http://127.0.0.1:5193",
            `/admin/blog/${screen}`,
          ),
        );
        blocked.push(
          await prepare(
            pages[1],
            "http://127.0.0.1:5194",
            `/crm/studio/${screen}`,
          ),
        );
        const evidence: Record<string, unknown> = {
          status: "REVIEW_REQUIRED",
          actualCrmRoute: "NOT_RUN",
          width,
          screen,
          fixtureHash: createHash("sha256")
            .update(JSON.stringify(shared))
            .digest("hex"),
        };
        if (screen === "settings") {
          for (const section of [
            "Tác giả",
            "Chuyên mục",
            "Thành viên",
            "Xuất nội dung",
          ]) {
            for (const [index, page] of pages.entries()) {
              await page
                .getByRole("navigation", { name: "Các mục cài đặt" })
                .getByRole("button", { name: section, exact: true })
                .click();
              await expect(
                page
                  .getByRole("navigation", { name: "Các mục cài đặt" })
                  .getByRole("button", { name: section, exact: true }),
              ).toHaveAttribute("aria-pressed", "true");
              const snapshot = await capture(
                page,
                info,
                `${index === 0 ? "original" : "go"}-${section}`,
              );
              expect(snapshot.overflow).toBe(false);
              evidence[`${index}-${section}`] = snapshot;
            }
          }
        } else {
          for (const [index, page] of pages.entries()) {
            await expect(page.locator(".mod-item")).toHaveCount(2);
            await page.locator(".mod-item").nth(1).click();
            await expect(page.locator(".mod-detail")).toContainText(
              second.text,
            );
            const snapshot = await capture(
              page,
              info,
              `${index === 0 ? "original" : "go"}-selected`,
            );
            expect(snapshot.overflow).toBe(false);
            evidence[`${index}-selected`] = snapshot;
          }
        }
        expect(blocked.flat()).toEqual([]);
        expect(
          await pages[1].evaluate(
            () =>
              (window as unknown as { __componentCalls: unknown[] })
                .__componentCalls,
          ),
        ).toEqual([]);
        expect(
          await pages[0].evaluate(
            () =>
              (window as unknown as { __referenceCalls: unknown[] })
                .__referenceCalls,
          ),
        ).toEqual([]);
        evidence.sourceHashes = await Promise.all(
          [
            "source-settings.tsx",
            "source-moderation.tsx",
            "source-shell.tsx",
            "source-design.css",
            "source-host-compat.css",
          ].map(async (file) => ({
            file,
            sha256: createHash("sha256")
              .update(await readFile(`src/features/content/studio/${file}`))
              .digest("hex"),
          })),
        );
        await writeFile(
          info.outputPath("comparison.json"),
          JSON.stringify(evidence, null, 2),
        );
        await info.attach("comparison", {
          path: info.outputPath("comparison.json"),
          contentType: "application/json",
        });
      } finally {
        await context.close();
      }
    });
  }
}
