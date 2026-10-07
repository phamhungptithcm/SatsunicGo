import { describe, expect, it, vi } from "vitest";
import { cacheModule, routeModuleKey } from "../../src/app/route-modules";

describe("navigation code preloading", () => {
  it("shares concurrent preload/navigation work and the resolved module", async () => {
    let resolve!: (value: { component: string }) => void;
    const request = new Promise<{ component: string }>((done) => {
      resolve = done;
    });
    const load = vi.fn(() => request);
    const cached = cacheModule(load);
    const first = cached();
    expect(cached()).toBe(first);
    resolve({ component: "profile" });
    await expect(first).resolves.toEqual({ component: "profile" });
    expect(cached()).toBe(first);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("releases a failed preload for a subsequent navigation attempt", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ component: "security" });
    const cached = cacheModule(load);
    await expect(cached()).rejects.toThrow("offline");
    await expect(cached()).resolves.toEqual({ component: "security" });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("maps account query views and only the offered navigation destinations", () => {
    expect(routeModuleKey("/account", "?view=shipments&filter=all")).toBe(
      "shipments",
    );
    expect(routeModuleKey("/account", "?view=notifications")).toBe(
      "notifications",
    );
    expect(routeModuleKey("/account", "?view=untrusted")).toBeUndefined();
    expect(routeModuleKey("/account", "?filter=all")).toBeUndefined();
    expect(routeModuleKey("/account/orders/private-order")).toBeUndefined();
    expect(routeModuleKey("/crm")).toBeUndefined();
    expect(routeModuleKey("/products/private-slug")).toBeUndefined();
    expect(routeModuleKey("/posts")).toBe("content");
    expect(routeModuleKey("/products")).toBe("content");
    expect(routeModuleKey("/account/security")).toBe("security");
  });
});
