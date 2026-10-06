import { expect, it, vi } from "vitest";
import { LatestDocumentRequest } from "../../src/features/invoices/document-requests";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it("opening another document wins even when the previous response arrives last", async () => {
  const requests = new LatestDocumentRequest(),
    a = deferred<string>(),
    b = deferred<string>();
  const shown = vi.fn(),
    failed = vi.fn();
  const first = requests.run(() => a.promise, shown, failed);
  const second = requests.run(() => b.promise, shown, failed);
  b.resolve("document B");
  await second;
  a.resolve("document A");
  await first;
  expect(shown.mock.calls).toEqual([["document B"]]);
  expect(failed).not.toHaveBeenCalled();
});

it("leaving a screen prevents late success and error from publishing private document state", async () => {
  for (const error of [false, true]) {
    const requests = new LatestDocumentRequest(),
      read = deferred<string>();
    const shown = vi.fn(),
      failed = vi.fn();
    const work = requests.run(() => read.promise, shown, failed);
    requests.invalidate();
    if (error) read.reject(new Error("old request"));
    else read.resolve("old document");
    await work;
    expect(shown).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
  }
});

it("a superseded failure cannot hide a new selection, while current failure permits retry", async () => {
  const requests = new LatestDocumentRequest(),
    old = deferred<string>();
  const shown = vi.fn(),
    failed = vi.fn();
  const first = requests.run(() => old.promise, shown, failed);
  await requests.run(async () => "current", shown, failed);
  old.reject(new Error("superseded"));
  await first;
  expect(failed).not.toHaveBeenCalled();
  await requests.run(
    async () => {
      throw Error("temporary");
    },
    shown,
    failed,
  );
  expect(failed).toHaveBeenCalledOnce();
  await requests.run(async () => "recovered", shown, failed);
  expect(shown.mock.calls).toEqual([["current"], ["recovered"]]);
});
