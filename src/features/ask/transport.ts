import {
  askAnswerSchema,
  askStreamEventSchema,
  type AskStreamEvent,
} from "../../../packages/domain/ask-stream";
import type { AskAnswer } from "./knowledge";

type StreamResult = { stream: AsyncIterable<unknown>; data: Promise<unknown> };
function cancellable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const aborted = () => {
      signal.removeEventListener("abort", aborted);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", aborted, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", aborted);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", aborted);
        reject(error);
      },
    );
    if (signal.aborted) aborted();
  });
}
export async function consumeAskStream(
  result: StreamResult,
  onEvent: (event: AskStreamEvent) => void,
  signal: AbortSignal,
): Promise<AskAnswer> {
  // Observe the final promise immediately, including when a stream fails first.
  const final = result.data.then(
    (value) => ({ value }),
    (error) => ({ error }),
  );
  let bytes = 0,
    count = 0,
    answered = false;
  let streamedAnswer: AskStreamEvent | undefined;
  const iterator = result.stream[Symbol.asyncIterator]();
  try {
    while (true) {
      signal.throwIfAborted();
      const next = await cancellable(iterator.next(), signal);
      if (next.done) break;
      const value = next.value;
      signal.throwIfAborted();
      bytes += new TextEncoder().encode(JSON.stringify(value)).byteLength;
      if (++count > 12 || bytes > 30_000 || answered)
        throw Error("INVALID_RESPONSE");
      const event = askStreamEventSchema.parse(value);
      if (event.type === "answer") {
        answered = true;
        streamedAnswer = event;
      } else onEvent(event);
    }
    signal.throwIfAborted();
    const settled = await cancellable(final, signal);
    signal.throwIfAborted();
    if ("error" in settled) throw settled.error;
    const answer = askAnswerSchema.parse(settled.value);
    if (streamedAnswer?.type === "answer") {
      if (JSON.stringify(streamedAnswer.answer) !== JSON.stringify(answer))
        throw Error("INVALID_RESPONSE");
      onEvent(streamedAnswer);
    }
    return answer;
  } finally {
    // A provider may never settle next()/return(); cleanup must not block cancel.
    try {
      void iterator.return?.().catch(() => {});
    } catch {
      /* already closed */
    }
  }
}
export function askRateLimited(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "functions/resource-exhausted"
  );
}
export async function askService(
  data: unknown,
  signal: AbortSignal,
  onEvent: (event: AskStreamEvent) => void,
): Promise<AskAnswer> {
  const [{ functions }, { httpsCallable }] = await Promise.all([
    import("../../shared/firebase"),
    import("firebase/functions"),
  ]);
  signal.throwIfAborted();
  if (!functions || !navigator.onLine) throw Error("ASK_UNAVAILABLE");
  const callable = httpsCallable<unknown, unknown, unknown>(functions, "ask");
  // SDK supports streaming; ordinary server responses remain valid through data.
  const result = await callable.stream(data, { signal });
  return consumeAskStream(result, onEvent, signal);
}
