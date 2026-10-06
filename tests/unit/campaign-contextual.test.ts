import { describe, expect, it } from "vitest";
import { campaignClipboardText } from "../../src/features/content/Campaigns";

describe("campaign clipboard preserves destination meaning", () => {
  const row = {
    path: "/products/camera?variant=blue#details",
    source: "facebook",
    medium: "social",
    campaign: "summer",
    caption: "Xem máy ảnh",
  };
  it("retains product selection query and anchor alongside UTM fields", () => {
    const text = campaignClipboardText(row, "https://example.test");
    expect(text.startsWith("Xem máy ảnh\n")).toBe(true);
    const url = new URL(text.split("\n")[1]);
    expect(url.searchParams.get("variant")).toBe("blue");
    expect(url.hash).toBe("#details");
    expect(url.searchParams.get("utm_source")).toBe("facebook");
    expect(url.searchParams.get("utm_medium")).toBe("social");
    expect(url.searchParams.get("utm_campaign")).toBe("summer");
  });
  it("replaces old UTM values once without dropping other destination parameters", () => {
    const url = new URL(
      campaignClipboardText(
        { ...row, path: "/posts/guide?utm_source=old&locale=vi" },
        "https://example.test",
      ).split("\n")[1],
    );
    expect(url.searchParams.getAll("utm_source")).toEqual(["facebook"]);
    expect(url.searchParams.get("locale")).toBe("vi");
  });
});
