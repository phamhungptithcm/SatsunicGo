import { it, expect } from "vitest";
import { commentRetry } from "../../src/features/content/comments-ui/state";
it("lost-ACK payload fenced until resolved; reuses key, changed payload blocked, account cleanup clears", () => {
  const retry = commentRetry();
  expect(retry.begin({ rating: 1 }, () => "op-a")).toBe("op-a");
  expect(retry.begin({ rating: 1 }, () => "op-b")).toBe("op-a");
  expect(() => retry.begin({ rating: 5 })).toThrow("COMMENT_RETRY_REQUIRED");
  retry.clear();
  expect(retry.pending()).toBe(false);
  expect(retry.begin({ rating: 5 }, () => "op-c")).toBe("op-c");
});
