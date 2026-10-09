import { expect, it } from "vitest";
import { askConversationSchema } from "../../packages/domain/ask-workflow";
const valid = {
  ownerId: "qa-owner",
  version: 1,
  updatedAt: 1000,
  turns: [],
  draft: {},
};
it("validates existing shape and strips compatible extra stored fields", () =>
  expect(
    askConversationSchema.parse({ ...valid, operatorNote: "not displayed" }),
  ).toEqual({ ...valid, draft: { notes: "" } }));
it.each([
  { version: NaN },
  { version: Infinity },
  { version: -1 },
  { version: 1.5 },
  { version: Number.MAX_SAFE_INTEGER + 1 },
  { ownerId: "" },
  { updatedAt: "bad" },
  { turns: null },
  { turns: [{}] },
  { draft: { goods: 100 } },
  { orderId: "../other" },
  { pendingOperation: "not-an-operation" },
])("rejects malformed snapshot %j", (patch) =>
  expect(askConversationSchema.safeParse({ ...valid, ...patch }).success).toBe(
    false,
  ),
);
