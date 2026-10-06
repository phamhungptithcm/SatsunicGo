export type SourceRequest = <T>(
  url: string,
  method?: string,
  payload?: unknown,
) => Promise<T>;
export type SourceRouter = { push: (url: string) => void; refresh: () => void };
export const sourceMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Chưa thực hiện được thao tác.";
export function googleAvatar(url?: string) {
  try {
    const u = new URL(url ?? "");
    return u.protocol === "https:" &&
      (u.hostname === "googleusercontent.com" ||
        u.hostname.endsWith(".googleusercontent.com")) &&
      !u.username &&
      !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function isSourceRevisionConflict(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    ((error as { code?: string }).code === "functions/aborted" ||
      (error as { message?: string }).message === "REVISION_CONFLICT")
  );
}
export function sourceReportItem<
  T extends {
    revision: number;
    comment?: { revision: number; text: string } | null;
  },
>(report: T) {
  return {
    ...report,
    reportRevision: report.revision,
    revision: report.comment?.revision ?? 0,
    text: report.comment?.text ?? "Bình luận hiện không hiển thị.",
  };
}

/** Only explicit callable rejections are terminal; delivery failures retain identity. */
export function isSourceTerminalFailure(error: unknown) {
  const code =
    error && typeof error === "object"
      ? (error as { code?: string }).code
      : undefined;
  return [
    "functions/invalid-argument",
    "functions/failed-precondition",
    "functions/permission-denied",
    "functions/unauthenticated",
    "functions/not-found",
    "functions/already-exists",
    "functions/out-of-range",
    "functions/aborted",
  ].includes(code ?? "");
}
export function confirmedSourceSave(error: unknown) {
  return error && typeof error === "object"
    ? (error as { confirmedSave?: { revision: number; state: string } })
        .confirmedSave
    : undefined;
}
