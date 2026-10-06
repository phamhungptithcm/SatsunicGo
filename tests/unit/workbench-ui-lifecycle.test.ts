import { describe, expect, it, vi } from "vitest";
import { createRequestSequence } from "../../src/features/content/editor-state";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("private workbench mutation lifecycle contract", () => {
  it.each(["success", "failure"])(
    "ignores a late %s after identity change",
    async (outcome) => {
      const scope = createRequestSequence(),
        old = deferred();
      const revision = scope.next();
      const publish = vi.fn(),
        failure = vi.fn(),
        unlock = vi.fn();
      const work = (async () => {
        try {
          await old.promise;
          if (scope.current(revision)) publish();
        } catch {
          if (scope.current(revision)) failure();
        } finally {
          if (scope.current(revision)) unlock();
        }
      })();
      scope.invalidate();
      const current = scope.next();
      if (outcome === "success") old.resolve();
      else old.reject(new Error("old request"));
      await work;
      expect(publish).not.toHaveBeenCalled();
      expect(failure).not.toHaveBeenCalled();
      expect(unlock).not.toHaveBeenCalled();
      expect(scope.current(current)).toBe(true);
    },
  );

  it("does not submit a file read after leaving the order, and allows current recovery", async () => {
    const scope = createRequestSequence(),
      file = deferred();
    const revision = scope.next(),
      submit = vi.fn();
    const work = (async () => {
      await file.promise;
      if (scope.current(revision)) submit();
    })();
    scope.invalidate();
    file.resolve();
    await work;
    expect(submit).not.toHaveBeenCalled();
    const retry = scope.next();
    await Promise.resolve();
    if (scope.current(retry)) submit();
    expect(submit).toHaveBeenCalledOnce();
  });
});
