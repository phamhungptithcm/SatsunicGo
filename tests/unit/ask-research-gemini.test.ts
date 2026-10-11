import { test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  geminiResearch,
  researchReservation,
  researchGeminiLimits,
} from "../../functions/src/ai/research-gemini";
// Deterministic historical admission for mocked transport; production expiry stays fixed.
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(
    researchGeminiLimits.pricingExpiresAt - 60000,
  );
});
afterEach(() => vi.restoreAllMocks());

const policy = {
  version: 1,
  enabled: true,
  expiresAt: researchGeminiLimits.pricingExpiresAt,
  merchants: [
    {
      host: "store.example",
      market: "US",
      kind: "retailer",
      sellerIds: ["first-party"],
    },
  ],
};
const response = {
  usageMetadata: {
    promptTokenCount: 100,
    candidatesTokenCount: 80,
    totalTokenCount: 180,
  },
  candidates: [
    {
      finishReason: "STOP",
      groundingMetadata: {
        groundingChunks: [
          {
            web: {
              uri: "https://store.example/item",
              title: "Synthetic headphones",
              domain: "store.example",
            },
          },
        ],
        webSearchQueries: ["Synthetic headphones"],
        searchEntryPoint: { renderedContent: "<div>Search Suggestions</div>" },
      },
    },
  ],
};
test("Gemini: full request counted, reserve before network, fixed endpoint and generation bounds", async () => {
  const steps: string[] = [];
  const result = await geminiResearch(
    { query: "Synthetic headphones", market: "US" },
    policy,
    async () => {
      steps.push("reserve");
    },
    async (url, body) => {
      steps.push(url.endsWith(":countTokens") ? "count" : "generate");
      expect(url).toMatch(
        /^https:\/\/us-central1-aiplatform.googleapis.com\/v1\/projects\/satsunicgo\//,
      );
      const request = JSON.parse(body);
      expect(request.tools).toEqual([{ googleSearch: {} }]);
      expect(request.generationConfig).toMatchObject({
        candidateCount: 1,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 },
      });
      return url.endsWith(":countTokens") ? { totalTokens: 100 } : response;
    },
    new AbortController().signal,
  );
  expect(steps).toEqual(["reserve", "count", "generate"]);
  expect(result.candidates[0].verified).toBe(false);
  expect(result.usage.totalTokenCount).toBe(180);
});
test("Gemini: budget admission denies third call, invalid ledger and expired price", () => {
  expect(researchReservation(0)).toBe(25000);
  expect(researchReservation(25000)).toBe(50000);
  for (const value of [50000, -1, NaN, "0", 0.1])
    expect(() => researchReservation(value)).toThrow();
  expect(() =>
    researchReservation(0, researchGeminiLimits.pricingExpiresAt),
  ).toThrow();
});
test("Gemini: private inputs, unknown merchants and denied reserve cause zero network calls", async () => {
  let calls = 0,
    reserves = 0;
  const send = async () => {
    calls++;
    return response;
  };
  for (const query of [
    "email me owner@example.com",
    "address: 123 Private Street",
    "https://unknown.test/item",
  ]) {
    await expect(
      geminiResearch(
        { query, market: "US" },
        policy,
        async () => {
          reserves++;
        },
        send,
        new AbortController().signal,
      ),
    ).rejects.toThrow();
  }
  expect(calls).toBe(0);
  expect(reserves).toBe(0);
  await expect(
    geminiResearch(
      { query: "Headphones", market: "JP" },
      policy,
      async () => {},
      send,
      new AbortController().signal,
    ),
  ).rejects.toThrow("RESEARCH_NO_MERCHANT");
  await expect(
    geminiResearch(
      { query: "Headphones", market: "US" },
      policy,
      async () => {
        throw Error("budget");
      },
      send,
      new AbortController().signal,
    ),
  ).rejects.toThrow("budget");
  expect(calls).toBe(0);
});
test("Gemini: failed count/generation never auto-retry or release reservation", async () => {
  let calls = 0,
    reserves = 0;
  await expect(
    geminiResearch(
      { query: "Headphones", market: "US" },
      policy,
      async () => {
        reserves++;
      },
      async () => {
        calls++;
        throw Error("unknown network outcome");
      },
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(calls).toBe(1);
  expect(reserves).toBe(1);
  calls = 0;
  await expect(
    geminiResearch(
      { query: "Headphones", market: "US" },
      policy,
      async () => {},
      async (url) => {
        calls++;
        return url.endsWith(":countTokens") ? { totalTokens: 10001 } : response;
      },
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(calls).toBe(1);
});
test("Gemini: production test policy revoked during count prevents generation after permanent reservation", async () => {
  let admitted = true;
  const phases: string[] = [];
  const reserve = vi.fn(async () => {});
  await expect(
    geminiResearch(
      { query: "Headphones", market: "US" },
      policy,
      reserve,
      async (url) => {
        phases.push(url.endsWith(":countTokens") ? "count" : "generate");
        admitted = false;
        return { totalTokens: 100 };
      },
      new AbortController().signal,
      undefined,
      async () => {
        if (!admitted) throw Error("RESEARCH_UNAVAILABLE");
      },
    ),
  ).rejects.toThrow("RESEARCH_UNAVAILABLE");
  expect(phases).toEqual(["count"]);
  expect(reserve).toHaveBeenCalledTimes(1);
});

test("Gemini: expiry during admission/count prevents any later provider dispatch", async () => {
  for (const expiry of ["policy", "pricing"] as const)
    for (const phase of ["reserve", "count"] as const) {
      const initial = researchGeminiLimits.pricingExpiresAt - 2000;
      let now = initial;
      const clock = vi.spyOn(Date, "now").mockImplementation(() => now);
      const calls: string[] = [];
      let reservations = 0;
      try {
        await expect(
          geminiResearch(
            { query: "Headphones", market: "US" },
            {
              ...policy,
              expiresAt:
                expiry === "policy"
                  ? initial + 1000
                  : researchGeminiLimits.pricingExpiresAt + 1000,
            },
            async () => {
              reservations++;
              if (phase === "reserve") now += 2000;
            },
            async (url) => {
              calls.push(url.endsWith(":countTokens") ? "count" : "generate");
              now += 2000;
              return { totalTokens: 100 };
            },
            new AbortController().signal,
          ),
        ).rejects.toThrow("RESEARCH_UNAVAILABLE");
        expect(reservations).toBe(1);
        expect(calls).toEqual(phase === "reserve" ? [] : ["count"]);
      } finally {
        clock.mockRestore();
      }
    }
});

test.each(["policy", "pricing"] as const)(
  "Gemini: already expired %s admission rejects before reserve or transport",
  async (expiry) => {
    const now = researchGeminiLimits.pricingExpiresAt - 1000;
    vi.spyOn(Date, "now").mockReturnValue(
      expiry === "pricing" ? researchGeminiLimits.pricingExpiresAt : now,
    );
    const reserve = vi.fn(async () => {});
    const send = vi.fn(async () => response);
    await expect(
      geminiResearch(
        { query: "Headphones", market: "US" },
        { ...policy, expiresAt: expiry === "policy" ? now : policy.expiresAt },
        reserve,
        send,
        new AbortController().signal,
      ),
    ).rejects.toThrow("RESEARCH_UNAVAILABLE");
    expect(reserve).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(() =>
      researchReservation(0, researchGeminiLimits.pricingExpiresAt),
    ).toThrow("RESEARCH_BUDGET_UNAVAILABLE");
  },
);
