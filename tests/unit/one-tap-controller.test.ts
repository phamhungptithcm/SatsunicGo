import { describe, expect, it, vi } from "vitest";
import {
  createOneTapController,
  type OneTapIdentity,
} from "../../src/features/auth/one-tap-controller";
describe("One Tap credential lifecycle", () => {
  function sdk() {
    let callback!: Parameters<OneTapIdentity["initialize"]>[0]["callback"];
    const identity = {
      initialize: vi.fn(
        (options: Parameters<OneTapIdentity["initialize"]>[0]) => {
          callback = options.callback;
        },
      ),
      prompt: vi.fn(),
      cancel: vi.fn(),
    };
    return { identity, send: (credential: string) => callback({ credential }) };
  }
  it("deduplicates concurrent exchanges and cancels after success", async () => {
    const x = sdk();
    let resolve!: () => void;
    const exchange = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    const error = vi.fn();
    createOneTapController(x.identity, "client", exchange, error);
    const pending = x.send("fixture");
    await x.send("duplicate");
    expect(exchange).toHaveBeenCalledTimes(1);
    resolve();
    await pending;
    expect(x.identity.cancel).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });
  it("allows retry after failure and ignores disposed callbacks", async () => {
    const x = sdk();
    const exchange = vi.fn().mockRejectedValue(Error("fixture"));
    const error = vi.fn();
    const dispose = createOneTapController(
      x.identity,
      "client",
      exchange,
      error,
    );
    await x.send("");
    expect(exchange).not.toHaveBeenCalled();
    await x.send("fixture");
    expect(error).toHaveBeenCalledTimes(1);
    await x.send("retry");
    expect(exchange).toHaveBeenCalledTimes(2);
    dispose();
    await x.send("late");
    expect(exchange).toHaveBeenCalledTimes(2);
  });
  it("does not report a late exchange failure after disposal", async () => {
    const x = sdk();
    let reject!: (error: Error) => void;
    const error = vi.fn();
    const dispose = createOneTapController(
      x.identity,
      "client",
      () =>
        new Promise((_, r) => {
          reject = r;
        }),
      error,
    );
    const pending = x.send("fixture");
    dispose();
    reject(Error("late"));
    await pending;
    expect(error).not.toHaveBeenCalled();
  });
});
