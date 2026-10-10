import { afterEach, describe, expect, test, vi } from "vitest";
import { sendResend } from "../../functions/src/email/resend";
import { selfTestContent } from "../../functions/src/email/self-test-content";

const providerId = "9303e799-9923-47e8-aa31-996b9a5d17ab";
const message = { from: "onboarding@resend.dev", to: "operator@example.invalid", ...selfTestContent };
const syntheticKey = "re_synthetic_only_1234567890";
const operation = "satsunicgo-email-test/9303e799-9923-47e8-aa31-996b9a5d17ab/self-test-v1";
afterEach(() => vi.useRealTimers());

describe("bounded Resend transport", () => {
  test("fixed HTTPS request and idempotency, valid ID means accepted, not delivered", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: providerId }));
    expect(await sendResend(message, syntheticKey, operation, fetcher)).toEqual({ state: "accepted", providerId });
    expect(fetcher).toHaveBeenCalledOnce();
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options?.redirect).toBe("error");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Authorization: `Bearer ${syntheticKey}`, "Content-Type": "application/json", "Idempotency-Key": operation });
    expect(JSON.parse(options?.body as string)).toEqual(message);
    expect(Object.keys(JSON.parse(options?.body as string))).not.toContain("tracking");
  });
  test.each([400, 401, 403, 404, 422, 429])("known rejection %i is sanitized, never retried", async status => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("sensitive upstream details", { status }));
    expect(await sendResend(message, syntheticKey, operation, fetcher)).toEqual({ state: "rejected", reason: "provider_rejected" });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  test.each([301, 409, 500, 502, 503])("uncertain response %i cannot be called unsent", async status => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("internal detail", { status }));
    expect(await sendResend(message, syntheticKey, operation, fetcher)).toEqual({ state: "unknown", reason: "provider_unknown" });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  test.each(["", "not-json", "{}", '{"id":"not-uuid"}', "x".repeat(4097)])("malformed or oversized success is uncertain", async body => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    expect(await sendResend(message, syntheticKey, operation, fetcher)).toEqual({ state: "unknown", reason: "provider_unknown" });
  });
  test("stream is cancelled at the response byte limit", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(4097)); }, cancel });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(stream));
    expect((await sendResend(message, syntheticKey, operation, fetcher)).state).toBe("unknown");
    expect(cancel).toHaveBeenCalledOnce();
  });
  test("successful HTTP response without a body cannot prove acceptance", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    expect(await sendResend(message, syntheticKey, operation, fetcher)).toEqual({ state: "unknown", reason: "provider_unknown" });
  });
  test("connection and redirect errors do not leak or trigger retry", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("sensitive connection details"));
    expect(await sendResend(message, syntheticKey, operation, fetcher)).toEqual({ state: "unknown", reason: "provider_unknown" });
    expect(fetcher).toHaveBeenCalledOnce();
  });
  test("10 second timeout aborts the request and clears its timer", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    const result = sendResend(message, syntheticKey, operation, fetcher);
    await vi.advanceTimersByTimeAsync(10_000);
    expect((await result).state).toBe("unknown");
    expect(vi.getTimerCount()).toBe(0);
  });
  test("timeout includes a provider response whose body never finishes", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const body = new ReadableStream({ start(controller) {
        options?.signal?.addEventListener("abort", () => controller.error(new Error("aborted body")));
      } });
      return new Response(body);
    });
    const result = sendResend(message, syntheticKey, operation, fetcher);
    await vi.advanceTimersByTimeAsync(10_000);
    expect((await result).state).toBe("unknown");
    expect(vi.getTimerCount()).toBe(0);
  });
  test.each([
    [{ ...message, to: "victim@example.invalid\r\nBcc:bad@example.invalid" }, syntheticKey, operation],
    [{ ...message, subject: "subject\r\ninjection" }, syntheticKey, operation],
    [{ ...message, text: "x".repeat(16_001) }, syntheticKey, operation],
    [message, "", operation], [message, "re_invalid\nkey", operation],
    [message, syntheticKey, "id\nheader"],
  ])("invalid configuration prevents provider I/O", async (input, key, id) => {
    const fetcher = vi.fn<typeof fetch>();
    expect(await sendResend(input as typeof message, key as string, id as string, fetcher)).toEqual({ state: "rejected", reason: "configuration" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
