import { expect, test } from "vitest";
import { sourceLink } from "../../src/features/ask/knowledge";
import {
  consumeAskStream,
  askRateLimited,
} from "../../src/features/ask/transport";
const answer = {
  language: "vi",
  title: "Thông tin",
  paragraphs: ["Đã kiểm tra"],
  bullets: [],
  sourceIds: ["fees"],
  action: "request",
};
async function* chunks(values: unknown[]) {
  yield* values;
}
test("stream preserves validated status and final answer; ordinary response fallback works", async () => {
  expect(sourceLink("membership").href).toBe("/membership");
  const events: unknown[] = [];
  await expect(
    consumeAskStream(
      {
        stream: chunks([
          { type: "status", phase: "retrieving" },
          { type: "status", phase: "selecting" },
          { type: "answer", answer },
        ]),
        data: Promise.resolve(answer),
      },
      (event) => events.push(event),
      new AbortController().signal,
    ),
  ).resolves.toEqual(answer);
  expect(events).toHaveLength(3);
  await expect(
    consumeAskStream(
      { stream: chunks([]), data: Promise.resolve(answer) },
      () => {},
      new AbortController().signal,
    ),
  ).resolves.toEqual(answer);
});
test("invalid, duplicate, oversized and excessive stream events are rejected", async () => {
  for (const values of [
    [
      { type: "answer", answer },
      { type: "answer", answer },
    ],
    [{ type: "status", phase: "invented" }],
    Array.from({ length: 13 }, () => ({ type: "status", phase: "retrieving" })),
    [{ type: "answer", answer: { ...answer, title: "x".repeat(30001) } }],
  ]) {
    await expect(
      consumeAskStream(
        { stream: chunks(values), data: Promise.resolve(answer) },
        () => {},
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  }
});
test("cancellation and provider errors cannot publish an answer", async () => {
  const controller = new AbortController();
  controller.abort();
  let received = false;
  await expect(
    consumeAskStream(
      {
        stream: chunks([{ type: "answer", answer }]),
        data: Promise.resolve(answer),
      },
      () => {
        received = true;
      },
      controller.signal,
    ),
  ).rejects.toThrow();
  expect(received).toBe(false);
  await expect(
    consumeAskStream(
      {
        stream: chunks([]),
        data: Promise.reject({ code: "functions/resource-exhausted" }),
      },
      () => {},
      new AbortController().signal,
    ),
  ).rejects.toMatchObject({ code: "functions/resource-exhausted" });
  expect(askRateLimited({ code: "functions/resource-exhausted" })).toBe(true);
  expect(askRateLimited({ code: "functions/unavailable" })).toBe(false);
});

test("bad case: conflicting stream and final answers never publish an answer", async () => {
  const events: unknown[] = [];
  await expect(
    consumeAskStream(
      {
        stream: chunks([{ type: "answer", answer }]),
        data: Promise.resolve({ ...answer, title: "Different" }),
      },
      (event) => events.push(event),
      new AbortController().signal,
    ),
  ).rejects.toThrow("INVALID_RESPONSE");
  expect(events).toEqual([]);
});

test("bad case: provider fails after a streamed answer; no success is published", async () => {
  const events: unknown[] = [];
  await expect(
    consumeAskStream(
      {
        stream: chunks([{ type: "answer", answer }]),
        data: Promise.reject(new Error("provider failed")),
      },
      (event) => events.push(event),
      new AbortController().signal,
    ),
  ).rejects.toThrow("provider failed");
  expect(events).toEqual([]);
});

test.each(["stream", "final"])(
  "bad case: cancellation interrupts a stalled %s",
  async (phase) => {
    const controller = new AbortController();
    const events: unknown[] = [];
    let returned = false;
    const never = new Promise<never>(() => {});
    const stream: AsyncIterable<unknown> =
      phase === "stream"
        ? {
            [Symbol.asyncIterator]: () => ({
              next: () => never,
              return: async () => {
                returned = true;
                return { done: true, value: undefined };
              },
            }),
          }
        : chunks([{ type: "answer", answer }]);
    const pending = consumeAskStream(
      { stream, data: phase === "final" ? never : Promise.resolve(answer) },
      (event) => events.push(event),
      controller.signal,
    );
    await Promise.resolve();
    controller.abort(new Error("cancelled"));
    await expect(pending).rejects.toThrow("cancelled");
    expect(events).toEqual([]);
    if (phase === "stream") expect(returned).toBe(true);
  },
);
