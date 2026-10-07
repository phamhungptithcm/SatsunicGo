export function needsRecentMfa(error: unknown) {
  const e = error as { code?: string; details?: { reason?: string } } | null;
  return (
    ["functions/failed-precondition", "functions/permission-denied"].includes(
      e?.code ?? "",
    ) && e?.details?.reason === "RECENT_MFA_REQUIRED"
  );
}
export async function runWithMfaRecovery<T>(
  execute: () => Promise<T>,
  authenticate: () => Promise<void>,
  stillCurrent: () => boolean,
) {
  try {
    return await execute();
  } catch (error) {
    if (!needsRecentMfa(error)) throw error;
    try {
      await authenticate();
    } catch {
      throw Object.assign(
        new Error("Chưa xác thực xong. Thao tác chưa được tiếp tục."),
        {
          code: "functions/failed-precondition",
          details: { reason: "ACTION_NOT_RESUMED" },
        },
      );
    }
    if (!stillCurrent())
      throw Object.assign(
        new Error("Thao tác đã dừng vì tài khoản hoặc trang đã thay đổi."),
        {
          code: "functions/failed-precondition",
          details: { reason: "ACTION_NOT_RESUMED" },
        },
      );
    return execute(); // One replay only; server rejected the original before commit.
  }
}
