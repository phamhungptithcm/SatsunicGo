import { describe, it, expect } from "vitest";
import {
  emptyStudioDraft,
  studioDraftSchema,
  validatePublish,
} from "../../packages/domain/blog-studio";
import {
  createStudioFence,
  draftOf,
  parseRecovery,
  publicationChecks,
  recoveryKey,
  titleSlug,
} from "../../src/features/content/studio/state";
import {
  localScheduleInstant,
  validScheduleTime,
} from "../../src/features/content/studio/schedule-time";
import {
  matchingSlashItems,
  imageFileError,
  blockTransaction,
  slashRange,
} from "../../src/features/content/studio/editor-actions";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", group: "block" },
    text: { group: "inline" },
  },
});
const state = (texts: string[], index = 0) => {
  const doc = schema.node(
    "doc",
    null,
    texts.map((t) => schema.node("paragraph", null, t ? schema.text(t) : [])),
  );
  let pos = 1;
  for (let i = 0; i < index; i++) pos += doc.child(i).nodeSize;
  return EditorState.create({ doc, selection: TextSelection.create(doc, pos) });
};
describe("Studio027 editor contract", () => {
  it("discards responses after account/editor switch and detects edits during saves", () => {
    const f = createStudioFence(),
      e = f.epoch(),
      g = f.generation();
    expect(f.unchanged(e, g)).toBe(true);
    f.edit();
    expect(f.current(e)).toBe(true);
    expect(f.unchanged(e, g)).toBe(false);
    f.invalidate();
    expect(f.current(e)).toBe(false);
  });
  it("recovery only accepts same account/post finite recent timestamp and validated rich draft", () => {
    const now = 1000000000,
      v = {
        uid: "a",
        id: "post",
        revision: 2,
        at: now,
        draft: emptyStudioDraft,
      };
    expect(parseRecovery(JSON.stringify(v), "a", "post", now)?.revision).toBe(
      2,
    );
    for (const changed of [
      { uid: "b" },
      { id: "other" },
      { at: now + 1 },
      { at: now - 8 * 86400000 },
      { revision: 0 },
      { draft: { ...emptyStudioDraft, body: { type: "script" } } },
    ])
      expect(
        parseRecovery(JSON.stringify({ ...v, ...changed }), "a", "post", now),
      ).toBeNull();
    expect(recoveryKey("a", "x")).not.toBe(recoveryKey("b", "x"));
  });
  it("wire draft omits server metadata yet incomplete typing remains editable", () => {
    const draft = {
      ...emptyStudioDraft,
      sources: [{ title: "s", url: "https:" }],
    };
    const full = {
      ...draft,
      id: "id",
      owner: "a",
      revision: 2,
      state: "published" as const,
      updatedAt: "x",
    };
    expect(draftOf(full)).toEqual(draft);
    expect(studioDraftSchema.safeParse(draft).success).toBe(false);
    expect("owner" in draftOf(full)).toBe(false);
  });
  it("slug normalizes Vietnamese without site identity or invalid terminal dash", () => {
    expect(titleSlug("Đặt mua sản phẩm ở Mỹ!")).toBe("dat-mua-san-pham-o-my");
    expect(titleSlug("x".repeat(99) + " ? y")).not.toMatch(/-$/);
  });
  it("invalid calendar input and elapsed publish time are rejected", () => {
    expect(localScheduleInstant("2026-02-30T10:00")).toBeNull();
    expect(localScheduleInstant("2026-10-05T10:00")).not.toBeNull();
    const now = Date.parse("2026-10-05T10:00:00Z");
    expect(validScheduleTime("2026-10-05T10:00:30Z", now)).toBe(false);
    expect(validScheduleTime("2026-10-05T10:02:00Z", now)).toBe(true);
  });
  it("slash is only an entire otherwise empty paragraph, with Vietnamese search", () => {
    const doc = state(["/tiêu đề"]).doc;
    const s = EditorState.create({
      doc,
      selection: TextSelection.create(doc, doc.content.size - 1),
    });
    expect(slashRange(s)?.query).toBe("tiêu đề");
    expect(matchingSlashItems("tiêu đề").map((x) => x.id)).toContain("h2");
    const prose = state(["https://x/"]).doc;
    expect(
      slashRange(
        EditorState.create({
          doc: prose,
          selection: TextSelection.create(prose, prose.content.size - 1),
        }),
      ),
    ).toBeNull();
  });
  it("moves and duplicates selected blocks without changing other content and honors boundaries", () => {
    const s = state(["first", "second", "third"], 1);
    expect(blockTransaction(s, "up")?.doc.textContent).toBe("secondfirstthird");
    expect(blockTransaction(s, "down")?.doc.textContent).toBe(
      "firstthirdsecond",
    );
    expect(blockTransaction(s, "duplicate")?.doc.textContent).toBe(
      "firstsecondsecondthird",
    );
    expect(blockTransaction(s, "delete")?.doc.textContent).toBe("firstthird");
    expect(blockTransaction(state(["first"]), "up")).toBeNull();
  });
  it("rejects nonimages and oversize image while preserving GIF parity", () => {
    expect(imageFileError({ type: "image/gif", size: 1024 })).toBeNull();
    expect(imageFileError({ type: "image/svg+xml", size: 10 })).not.toBeNull();
    expect(
      imageFileError({ type: "image/png", size: 5 * 1024 * 1024 + 1 }),
    ).not.toBeNull();
  });
});

it("original editorial reminders do not replace mandatory publication validation", () => {
  const ready = {
    ...emptyStudioDraft,
    title: "Hướng dẫn",
    slug: "huong-dan",
    summary: "Tóm tắt",
    authorId: "author",
    category: "Tin tức",
    sources: [{ title: "Nguồn", url: "https://example.com" }],
    body: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Nội dung" }] },
      ],
    },
  };
  expect(() => validatePublish(ready)).not.toThrow();
  const baseline = publicationChecks(ready);
  for (const omitted of [{ slug: "" }, { category: "" }]) {
    const incomplete = { ...ready, ...omitted };
    expect(publicationChecks(incomplete)).toEqual(baseline);
    expect(() => validatePublish(incomplete)).toThrow("PUBLISH_REQUIRED");
  }
  for (const omitted of [
    { title: "" },
    { authorId: "" },
    { sources: [] },
    { body: emptyStudioDraft.body },
  ]) {
    expect(() => validatePublish({ ...ready, ...omitted })).toThrow(
      "PUBLISH_REQUIRED",
    );
  }
});
