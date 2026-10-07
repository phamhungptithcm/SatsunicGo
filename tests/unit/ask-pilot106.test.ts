import { afterEach, beforeEach, expect, test, vi } from "vitest";
type Ref = {
  path: string;
  collection: (name: string) => { doc: (id: string) => Ref };
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
  update: (data: unknown) => Promise<void>;
};
type Transaction = {
  get: (ref: Ref) => ReturnType<Ref["get"]>;
  set: (ref: Ref, data: { reservedVnd: number }) => void;
  create: (ref: Ref, data: unknown) => void;
};
const state = vi.hoisted(() => ({
  reserved: 0,
  events: [] as unknown[],
  serial: Promise.resolve(),
  enabled: true,
}));
vi.mock("firebase-admin/app", () => ({
  getApp: () => ({
    options: {
      credential: {
        getAccessToken: async () => ({ access_token: "synthetic-auth" }),
      },
    },
  }),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => {
    const doc = (path: string): Ref => ({
      path,
      collection: (name: string) => ({
        doc: (id: string) => doc(`${path}/${name}/${id}`),
      }),
      get: async () => ({
        exists: path !== "aiPilotBudget/lifetime" || state.reserved !== 0,
        data: () =>
          path === "settings/askPaidPilot"
            ? {
                enabled: state.enabled,
                pilotUid: "owner",
                maxBudgetVnd: 10000,
                version: 1,
                expiresAt: Date.now() + 10000,
              }
            : path === "aiPilotBudget/lifetime"
              ? { reservedVnd: state.reserved }
              : { active: true, roles: ["OWNER"] },
      }),
      update: async (data: unknown) => {
        state.events.push(data);
      },
    });
    return {
      doc,
      runTransaction: (work: (tx: Transaction) => Promise<unknown>) => {
        const result = state.serial.then(() =>
          work({
            get: (ref: Ref) => ref.get(),
            set: (_ref: Ref, data: { reservedVnd: number }) => {
              state.reserved = data.reservedVnd;
            },
            create: (_ref: unknown, data: unknown) => state.events.push(data),
          }),
        );
        state.serial = result.then(
          () => {},
          () => {},
        );
        return result;
      },
    };
  },
}));
import {
  checkPilot,
  nextReservation,
  pilotRequest,
  generatePilot,
  pilotLimits,
} from "../../functions/src/ai/ask-pilot";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-07T18:00:00Z"));
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  state.reserved = 0;
  state.events = [];
  state.enabled = true;
  state.serial = Promise.resolve();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
test("policy denies wrong owner, expiry, disabled and corrupt budget; no reset/topup", () => {
  const policy = {
    enabled: true,
    pilotUid: "owner",
    maxBudgetVnd: 10000,
    version: 1,
    expiresAt: Date.now() + 10000,
  };
  expect(() => checkPilot(policy, "other", Date.now())).toThrow();
  expect(() =>
    checkPilot({ ...policy, enabled: false }, "owner", Date.now()),
  ).toThrow();
  expect(() =>
    checkPilot({ ...policy, expiresAt: Date.now() }, "owner", Date.now()),
  ).toThrow();
  expect(() =>
    checkPilot(policy, "owner", pilotLimits.pricingExpiresAt),
  ).toThrow();
  for (const value of [
    null,
    undefined,
    -1,
    1.5,
    NaN,
    10000,
    Number.MAX_SAFE_INTEGER,
  ])
    expect(() => nextReservation(value)).toThrow();
  expect(nextReservation(9000)).toBe(10000);
});
test("request caps full bytes and includes output/thinking configuration with no tools", () => {
  const body = JSON.parse(pilotRequest("System", "Prompt"));
  expect(body.generationConfig.maxOutputTokens).toBe(800);
  expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
  expect(body.tools).toBeUndefined();
  expect(() => pilotRequest("x".repeat(32768), "x")).toThrow();
});
test("concurrent attempts reserve at most lifetime ceiling and dispatch once each", async () => {
  const body = pilotRequest("System", "Prompt");
  let attempts = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      if (url.endsWith(":countTokens")) {
        const counted = JSON.parse(String(options.body));
        expect(counted).toEqual(JSON.parse(body));
        return { ok: true, json: async () => ({ totalTokens: 100 }) };
      }
      attempts++;
      expect(options.body).toBe(body);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            { finishReason: "STOP", content: { parts: [{ text: "{}" }] } },
          ],
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 1,
            totalTokenCount: 101,
          },
        }),
      };
    }),
  );
  const results = await Promise.allSettled(
    Array.from({ length: 12 }, () =>
      generatePilot("owner", body, new AbortController().signal),
    ),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
  expect(attempts).toBe(10);
  expect(state.reserved).toBe(10000);
});
test("unknown dispatch failure retains reservation and never retries", async () => {
  let attempts = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith(":countTokens"))
        return { ok: true, json: async () => ({ totalTokens: 20 }) };
      attempts++;
      throw Error("Synthetic network failure");
    }),
  );
  await expect(
    generatePilot(
      "owner",
      pilotRequest("System", "Prompt"),
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(state.reserved).toBe(1000);
  expect(attempts).toBe(1);
});
test("failed token count prevents reservation and paid dispatch", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ totalTokens: 10001 }),
    })),
  );
  await expect(
    generatePilot(
      "owner",
      pilotRequest("System", "Prompt"),
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(state.reserved).toBe(0);
  expect(fetch).toHaveBeenCalledTimes(1);
});
