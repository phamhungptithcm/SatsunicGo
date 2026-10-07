// Firebase callable SDK adds HTTP metadata to its message; keep it in the
// structured error code rather than displaying it as customer guidance.
export function serviceError(
  error: unknown,
  fallback: string,
): Error & { code?: string; details?: unknown } {
  const { message, code, details } = (error ?? {}) as {
    message?: string;
    code?: string;
    details?: unknown;
  };
  const text = typeof message === "string" ? message : fallback;
  const display =
    typeof code === "string" && code.startsWith("functions/")
      ? text.replace(
          / \[(?:400|401|403|404|409|429|499|500|501|503|504)\]$/,
          "",
        )
      : text;
  return Object.assign(new Error(display), { code, details });
}
