import { describe, expect, it } from "vitest";
import {
  commentHash,
  commentRetry,
  commentStatus,
} from "../../src/features/content/comments-ui/state";
describe("comment recovery and public links", () => {
  it("replays an uncertain write and blocks a changed payload until resolved", () => {
    const retry = commentRetry();
    expect(retry.begin({ text: "A" }, () => "first")).toBe("first");
    expect(retry.begin({ text: "A" }, () => "second")).toBe("first");
    expect(() => retry.begin({ text: "B" })).toThrow("COMMENT_RETRY_REQUIRED");
    retry.clear();
    expect(retry.begin({ text: "B" }, () => "second")).toBe("second");
  });
  it("only accepts bounded exact comment fragments", () => {
    expect(commentHash("#comment-safe_01")).toBe("safe_01");
    expect(commentHash("#comment-<script>")).toBeNull();
    expect(commentHash(`#comment-${"a".repeat(161)}`)).toBeNull();
    expect(commentHash("#comment-safe?private=value")).toBeNull();
  });
  it("does not mislabel unknown moderation state as approved", () => {
    expect(commentStatus("pending")).toBe("Chờ duyệt");
    expect(commentStatus("manual_review")).toBe("Chưa xác định");
  });
});
