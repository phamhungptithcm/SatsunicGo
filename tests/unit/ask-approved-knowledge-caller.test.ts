import { afterEach, beforeEach, expect, test, vi } from "vitest";
type Row = Record<string, unknown>;
type Ref = { path: string };
type Snap = { exists: boolean; data: () => Row | undefined };
const f = vi.hoisted(() => ({
  rows: new Map<string, Row>(),
  discovery: [] as { id: string; row: Row }[],
  reads: [] as string[],
  committed: [] as string[],
  transactions: 0,
  access: vi.fn(),
  network: vi.fn(),
  before: null as (() => void) | null,
  after: null as (() => void) | null,
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => {
    f.access();
    const snap = (path: string): Snap => {
      const row = f.rows.get(path);
      return {
        exists: row !== undefined,
        data: () => (row === undefined ? undefined : structuredClone(row)),
      };
    };
    return {
      doc: (path: string) => ({ path }),
      collection: (name: string) => {
        if (name !== "askKnowledge") throw Error("Unexpected collection");
        return {
          where: (key: string, operator: string, value: unknown) => {
            if (key !== "active" || operator !== "==" || value !== true)
              throw Error("Bad filter");
            return {
              limit: (limit: number) => {
                if (limit !== 21) throw Error("Unbounded query");
                return {
                  get: async () => ({
                    empty: !f.discovery.length,
                    docs: f.discovery
                      .slice(0, limit)
                      .map(({ id, row }) => ({
                        id,
                        data: () => structuredClone(row),
                      })),
                  }),
                };
              },
            };
          },
        };
      },
      runTransaction: async (
        work: (tx: {
          get: (ref: Ref) => Promise<Snap>;
          set: (ref: Ref, value: Row) => void;
        }) => Promise<unknown>,
      ) => {
        f.transactions++;
        f.before?.();
        const pending: [string, Row][] = [];
        const result = await work({
          get: async (ref) => {
            if (pending.length) throw Error("Read after write");
            f.reads.push(ref.path);
            return snap(ref.path);
          },
          set: (ref, value) => pending.push([ref.path, structuredClone(value)]),
        });
        for (const [path, value] of pending) {
          f.rows.set(path, value);
          f.committed.push(path);
        }
        f.after?.();
        return result;
      },
    };
  },
}));
import {
  approvedKnowledgeAnswer,
  knowledgeSource,
} from "../../functions/src/ai/approved-knowledge";
const NOW = 1900000000000,
  UID = "synthetic-customer",
  CID = "11111111-1111-4111-8111-111111111111";
const conv = `askConversations/${UID}-${CID}`,
  approval = "askKnowledge/posts-guide",
  source = "posts/guide";
const uq = `askKnowledgeQuota/${UID}-${Math.floor(NOW / 60000)}`,
  gq = `askKnowledgeQuota/global-${Math.floor(NOW / 86400000)}`,
  citation = "post:return-guide";
function admit(
  id: string,
  slug: string,
  title: string,
  body: string,
  language = "en",
) {
  const publication = { status: "published", slug, title, body },
    hash = knowledgeSource(publication)!.hash;
  const row = {
    schemaVersion: 1,
    source: "posts",
    sourceId: id,
    version: 1,
    active: true,
    language,
    effectiveFrom: NOW,
    effectiveTo: NOW + 1000,
    contentHash: hash,
    reviewedBy: "synthetic-reviewer",
    reviewedAt: NOW - 1,
  };
  f.rows.set(`posts/${id}`, publication);
  f.rows.set(`askKnowledge/posts-${id}`, row);
  f.discovery.push({ id: `posts-${id}`, row: structuredClone(row) });
}
function edit(path: string, change: Row) {
  f.rows.set(path, { ...f.rows.get(path), ...change });
}
const invoke = (
  change: Partial<Parameters<typeof approvedKnowledgeAnswer>[1]> = {},
  signal?: AbortSignal,
) =>
  approvedKnowledgeAnswer(
    UID,
    {
      question: "What about exceptions?",
      language: "en",
      images: [],
      conversationId: CID,
      ...change,
    },
    signal,
  );
function clarify(answer: Awaited<ReturnType<typeof invoke>>) {
  expect(answer).toMatchObject({
    language: "en",
    action: "none",
    sourceIds: [],
  });
  expect(answer?.paragraphs.join(" ")).not.toContain("PRIOR_ANSWER_SENTINEL");
}
function quotas() {
  expect(f.rows.get(uq)).toMatchObject({
    count: 1,
    expiresAt: new Date(NOW + 120000),
  });
  expect(f.rows.get(gq)).toMatchObject({
    count: 1,
    expiresAt: new Date(NOW + 172800000),
  });
  expect(f.committed).toEqual([uq, gq]);
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  f.rows.clear();
  f.discovery = [];
  f.reads = [];
  f.committed = [];
  f.transactions = 0;
  f.before = null;
  f.after = null;
  f.access.mockClear();
  f.network.mockReset().mockRejectedValue(Error("Network forbidden"));
  vi.stubGlobal("fetch", f.network);
  f.rows.set(`users/${UID}`, {});
  admit(
    "guide",
    "return-guide",
    "Return guidance",
    "Exception: custom goods are excluded.",
  );
  f.rows.set(conv, {
    ownerId: UID,
    version: 3,
    updatedAt: NOW - 1,
    turns: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        question: "Returns?",
        answer: {
          language: "en",
          title: "Old guidance",
          paragraphs: ["PRIOR_ANSWER_SENTINEL"],
          bullets: [],
          sourceIds: [citation],
          action: "workflow",
        },
      },
    ],
  });
});
afterEach(() => {
  try {
    expect(f.network).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
});
test("real customer caller uses freshly admitted public evidence without OWNER role", async () => {
  const answer = await invoke();
  expect(answer?.sourceIds).toEqual([citation]);
  expect(answer?.paragraphs).toContain(
    "Return guidance\nException: custom goods are excluded.",
  );
  expect(answer?.paragraphs.join(" ")).not.toContain("PRIOR_ANSWER_SENTINEL");
  expect(f.reads).toContain(conv);
  quotas();
});
test.each([
  ["foreign conversation", conv, { ownerId: "other" }],
  ["locked user", `users/${UID}`, { locked: true }],
  ["locked staff", `staffAccess/${UID}`, { locked: true }],
] as const)("%s rejects without writes", async (_name, path, change) => {
  edit(path, change);
  await expect(invoke()).rejects.toMatchObject({ code: "permission-denied" });
  expect(f.committed).toEqual([]);
});
test("wrong discovery locale skips transaction", async () => {
  expect(await invoke({ language: "vi" })).toBeNull();
  expect(f.transactions).toBe(0);
});
test("discovery expiry end is exclusive", async () => {
  vi.setSystemTime(NOW + 1000);
  expect(await invoke()).toBeNull();
  expect(f.transactions).toBe(0);
});
test.each([
  ["revoked", { active: false, version: 2 }],
  ["new revision", { version: 2 }],
  ["locale changed", { language: "vi" }],
  ["wrong hash", { contentHash: "0".repeat(64) }],
  ["source changed", { source: "blogPublished" }],
  ["source ID changed", { sourceId: "other" }],
] as const)(
  "%s during transaction cannot supply evidence",
  async (_name, change) => {
    f.before = () => edit(approval, change);
    clarify(await invoke());
    quotas();
  },
);
test.each([{ body: "CHANGED_SOURCE_SENTINEL exception" }, { status: "draft" }])(
  "changed source invalidates approved hash %j",
  async (change) => {
    f.before = () => edit(source, change);
    const answer = await invoke();
    clarify(answer);
    expect(answer?.paragraphs.join(" ")).not.toContain(
      "CHANGED_SOURCE_SENTINEL",
    );
    quotas();
  },
);
test("expiry during transaction rechecked", async () => {
  f.before = () => vi.setSystemTime(NOW + 1000);
  clarify(await invoke());
  quotas();
});
test("missing persisted conversation cannot borrow another guide", async () => {
  f.rows.delete(conv);
  admit(
    "other",
    "other-guide",
    "Other guidance",
    "Exception: another synthetic condition.",
  );
  clarify(await invoke());
  quotas();
});
test.each([
  "shipping rates",
  "The shipping rate for Japan",
  "The catalog payment policy",
])("explicit topic searches fresh pool: %s", async (question) => {
  admit(
    "shipping",
    "shipping-guide",
    "Shipping and catalog payment",
    "Shipping rate for Japan: synthetic instructions. Catalog payment policy: synthetic terms.",
  );
  const answer = await invoke({ question });
  expect(answer?.sourceIds).toContain("post:shipping-guide");
  expect(answer?.paragraphs.join(" ")).not.toContain("PRIOR_ANSWER_SENTINEL");
});
test.each([
  [uq, 4],
  [gq, 500],
  [uq, -1],
  [gq, -1],
  [uq, 1.5],
  [gq, Number.MAX_SAFE_INTEGER + 1],
] as const)("quota %s=%s blocks writes", async (path, count) => {
  f.rows.set(path, { count });
  await expect(invoke()).rejects.toMatchObject({ code: "resource-exhausted" });
  expect(f.committed).toEqual([]);
  expect(f.rows.get(path)).toEqual({ count });
});
test("last available slots admit once", async () => {
  f.rows.set(uq, { count: 3 });
  f.rows.set(gq, { count: 499 });
  expect((await invoke())?.sourceIds).toEqual([citation]);
  expect(f.rows.get(uq)?.count).toBe(4);
  expect(f.rows.get(gq)?.count).toBe(500);
  await expect(invoke()).rejects.toMatchObject({ code: "resource-exhausted" });
  expect(f.committed).toEqual([uq, gq]);
});
test("entry abort does not touch Firestore", async () => {
  const c = new AbortController();
  c.abort();
  await expect(invoke({}, c.signal)).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(f.access).not.toHaveBeenCalled();
  expect(f.committed).toEqual([]);
});
test("post-commit abort suppresses output and keeps committed quotas", async () => {
  const c = new AbortController();
  f.after = () => c.abort();
  await expect(invoke({}, c.signal)).rejects.toMatchObject({
    name: "AbortError",
  });
  quotas();
});
