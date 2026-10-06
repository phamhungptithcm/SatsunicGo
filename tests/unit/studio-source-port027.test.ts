import { expect, it } from "vitest";
import { emptyStudioDraft } from "../../packages/domain/blog-studio";
import { parseRecovery } from "../../src/features/content/studio/source-recovery";
import { openSavedPreview } from "../../src/features/content/studio/open-preview";
it("source recovery binds UID and post and strips editable metadata", () => {
  const raw = JSON.stringify({
    uid: "one",
    postId: "post",
    revision: 1,
    at: Date.now(),
    draft: {
      ...emptyStudioDraft,
      id: "post",
      owner: "one",
      state: "draft",
      revision: 1,
    },
  });
  expect(parseRecovery(raw, "one", "post")?.draft).toEqual(emptyStudioDraft);
  expect(parseRecovery(raw, "two", "post")).toBeNull();
  expect(parseRecovery(raw, "one", "other")).toBeNull();
});
it("source preview closes placeholder when save fails", async () => {
  let closed = false,
    navigated = false;
  await openSavedPreview({
    url: "/crm/studio/post/preview",
    open: () => ({
      closed: false,
      close: () => {
        closed = true;
      },
      location: {
        replace: () => {
          navigated = true;
        },
      },
    }),
    prepare: async () => false,
    navigate: () => {
      navigated = true;
    },
    onError: () => {},
  });
  expect(closed).toBe(true);
  expect(navigated).toBe(false);
});
it("source preview popup fallback navigates only after save", async () => {
  const order: string[] = [];
  await openSavedPreview({
    url: "/crm/studio/post/preview",
    open: () => null,
    prepare: async () => {
      order.push("saved");
      return true;
    },
    navigate: () => {
      order.push("navigate");
    },
    onError: () => {},
  });
  expect(order).toEqual(["saved", "navigate"]);
});
