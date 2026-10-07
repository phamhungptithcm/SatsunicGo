import { expect, test, vi } from "vitest";
import {
  needsRecentMfa,
  runWithMfaRecovery,
} from "../../src/shared/mfa-recovery";
import { serviceError } from "../../src/shared/service-error";
const required = {
  code: "functions/failed-precondition",
  details: { reason: "RECENT_MFA_REQUIRED" },
};
test("only structured MFA denial is recoverable", () => {
  expect(needsRecentMfa(required)).toBe(true);
  expect(needsRecentMfa({ code: "functions/permission-denied" })).toBe(false);
  expect(
    needsRecentMfa({ ...required, code: "functions/deadline-exceeded" }),
  ).toBe(false);
  expect(needsRecentMfa(serviceError(required, "fallback"))).toBe(true);
});
test("one successful MFA replays same operation once", async () => {
  const payload = { operationId: "same", amount: 100 };
  const calls: (typeof payload)[] = [];
  const execute = vi.fn(async () => {
    calls.push(payload);
    if (calls.length === 1) throw required;
    return "saved";
  });
  const auth = vi.fn(async () => {});
  expect(await runWithMfaRecovery(execute, auth, () => true)).toBe("saved");
  expect(auth).toHaveBeenCalledTimes(1);
  expect(calls[0]).toBe(calls[1]);
  expect(execute).toHaveBeenCalledTimes(2);
});
test.each([
  "functions/deadline-exceeded",
  "functions/permission-denied",
  "functions/unavailable",
])("no retry on %s", async (code) => {
  const error = { code },
    execute = vi.fn().mockRejectedValue(error),
    auth = vi.fn();
  await expect(runWithMfaRecovery(execute, auth, () => true)).rejects.toBe(
    error,
  );
  expect(execute).toHaveBeenCalledTimes(1);
  expect(auth).not.toHaveBeenCalled();
});
test("cancel or identity/page change never sends pending action", async () => {
  const execute = vi.fn().mockRejectedValue(required);
  await expect(
    runWithMfaRecovery(
      execute,
      async () => {
        throw Error("cancel");
      },
      () => true,
    ),
  ).rejects.toThrow("Chưa xác thực xong");
  expect(execute).toHaveBeenCalledTimes(1);
  await expect(
    runWithMfaRecovery(
      execute,
      async () => {},
      () => false,
    ),
  ).rejects.toThrow("đã dừng");
  expect(execute).toHaveBeenCalledTimes(2);
});
test("second MFA rejection cannot loop", async () => {
  const execute = vi.fn().mockRejectedValue(required),
    auth = vi.fn(async () => {});
  await expect(runWithMfaRecovery(execute, auth, () => true)).rejects.toBe(
    required,
  );
  expect(execute).toHaveBeenCalledTimes(2);
  expect(auth).toHaveBeenCalledTimes(1);
});
