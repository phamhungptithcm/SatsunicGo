/** Preserve actionable business errors; SDK/network failures need customer guidance. */
export function purchaseFeedback(error: unknown, fallback: string): string {
  const value = error as { code?: unknown; message?: unknown } | null;
  if (
    [
      "functions/deadline-exceeded",
      "functions/unavailable",
      "functions/internal",
      "functions/cancelled",
      "auth/network-request-failed",
    ].includes(String(value?.code)) ||
    typeof value?.message !== "string" ||
    !value.message.trim() ||
    /^(?:deadline-exceeded|unavailable|internal|INTERNAL)$/.test(value.message)
  )
    return fallback;
  return value.message;
}
