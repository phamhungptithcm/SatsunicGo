import { describe, expect, it } from "vitest";
import {
  beginProgress,
  overlayProgressSnapshot,
  progressSnapshot,
  withProgress,
} from "../../src/shared/feedback";
describe("foreground and background loading ownership", () => {
  it("a background read cannot blur the page or finish another foreground load", () => {
    const foreground = beginProgress(),
      background = beginProgress({ overlay: false });
    expect(progressSnapshot()).toBe(2);
    expect(overlayProgressSnapshot()).toBe(1);
    background();
    background();
    expect(progressSnapshot()).toBe(1);
    expect(overlayProgressSnapshot()).toBe(1);
    foreground();
    foreground();
    expect(progressSnapshot()).toBe(0);
    expect(overlayProgressSnapshot()).toBe(0);
  });
  it("two overlapping foreground loads remain visible until both settle", () => {
    const first = beginProgress(),
      second = beginProgress();
    first();
    expect(overlayProgressSnapshot()).toBe(1);
    second();
    expect(overlayProgressSnapshot()).toBe(0);
  });
  it("rejected background operations release their own token", async () => {
    const foreground = beginProgress();
    await expect(
      withProgress(
        async () => {
          throw Error("denied");
        },
        { overlay: false },
      ),
    ).rejects.toThrow("denied");
    expect(progressSnapshot()).toBe(1);
    expect(overlayProgressSnapshot()).toBe(1);
    foreground();
  });
  it("foreground failure does not keep blur active", async () => {
    await expect(
      withProgress(async () => {
        throw Error("timeout");
      }),
    ).rejects.toThrow("timeout");
    expect(progressSnapshot()).toBe(0);
    expect(overlayProgressSnapshot()).toBe(0);
  });
});
