import { describe, it, expect, vi, beforeEach } from "vitest";
const service = vi.hoisted(() => vi.fn());
vi.mock("../../src/shared/firebase", () => ({ callService: service }));
import {
  studioCommands,
  readStudio,
} from "../../src/features/content/studio/api";
describe("Studio027 callable identities", () => {
  beforeEach(() => service.mockReset());
  it("retries an uncertain submitted version with the same operation then clears only on success", async () => {
    const commands = studioCommands();
    service
      .mockRejectedValueOnce(Error("unavailable"))
      .mockResolvedValue({ draft: { revision: 3 } });
    await expect(
      commands.send("save", "post", 2, { title: "a" }),
    ).rejects.toThrow("unavailable");
    await commands.send("save", "post", 2, { title: "a" });
    const first = service.mock.calls[0][1],
      retry = service.mock.calls[1][1];
    expect(retry).toEqual(first);
    expect(first.expectedVersion).toBe(2);
    expect(service.mock.calls[0][0]).toBe("studioCommand");
    await commands.send("save", "post", 3, { title: "a" });
    expect(service.mock.calls[2][1].operationId).not.toBe(first.operationId);
  });
  it("never reuses a receipt for another action or payload and keeps private reads in the private callable", async () => {
    const commands = studioCommands();
    service.mockRejectedValueOnce(Error("timeout")).mockResolvedValue({});
    await expect(commands.send("publish", "post", 1)).rejects.toThrow();
    await commands.send("unpublish", "post", 1);
    expect(service.mock.calls[1][1].operationId).not.toBe(
      service.mock.calls[0][1].operationId,
    );
    await readStudio({ kind: "get", id: "post" });
    expect(service.mock.calls[2]).toEqual([
      "studioRead",
      { kind: "get", id: "post" },
    ]);
  });
});
