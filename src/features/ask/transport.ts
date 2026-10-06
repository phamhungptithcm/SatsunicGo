import {
  askAnswerSchema,
  askStreamEventSchema,
  type AskStreamEvent,
} from "../../../packages/domain/ask-stream";
import type { AskAnswer } from "./knowledge";

type StreamResult = { stream: AsyncIterable<unknown>; data: Promise<unknown> };
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
  for await (const value of result.stream) {
    signal.throwIfAborted();
    bytes += new TextEncoder().encode(JSON.stringify(value)).byteLength;
    if (++count > 12 || bytes > 30_000 || answered)
      throw Error("INVALID_RESPONSE");
    const event = askStreamEventSchema.parse(value);
    if (event.type === "answer") answered = true;
    onEvent(event);
  }
  signal.throwIfAborted();
  const settled = await final;
  if ("error" in settled) throw settled.error;
  return askAnswerSchema.parse(settled.value);
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
