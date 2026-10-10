import { publicTrackingSchema } from "../../../packages/domain/public-order-tracking";
/** Abort releases UI immediately; a late SDK result never enters the renderer. */
export async function readWithAbort(
  read: () => Promise<unknown>,
  signal: AbortSignal,
) {
  signal.throwIfAborted();
  let rejectAbort: (() => void) | undefined;
  try {
    const aborted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(signal.reason);
      signal.addEventListener("abort", rejectAbort, { once: true });
    });
    return await Promise.race([read(), aborted]);
  } finally {
    if (rejectAbort) signal.removeEventListener("abort", rejectAbort);
  }
}

export async function readGuestTracking(
  read: () => Promise<unknown>,
  signal: AbortSignal,
) {
  return publicTrackingSchema.parse(await readWithAbort(read, signal));
}
