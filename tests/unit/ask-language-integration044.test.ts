import { test, expect } from "vitest";
import { detectLanguage } from "../../src/features/ask/knowledge";
test("actual frontend locale preserves Vietnamese mixed product conversation", () => {
  for (const q of [
    "CeraVe moisturizer cho chị",
    "how much phí gửi về Việt Nam em",
    "em muốn buy kem dưỡng",
  ])
    expect(detectLanguage(q, "en")).toBe("vi");
  expect(detectLanguage("track my order", "vi")).toBe("en");
  expect(detectLanguage("answer in English cho chị", "vi")).toBe("en");
  expect(detectLanguage("trả lời bằng tiếng Việt please", "en")).toBe("vi");
  expect(detectLanguage("x".repeat(1001), "vi")).toBe("vi");
});
