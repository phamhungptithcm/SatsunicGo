import { expect, test, vi } from "vitest";
import {
  researchPolicySchema,
  researchOfferInputSchema,
  researchOfferSchema,
  researchMerchant,
  researchDraft,
} from "../../packages/domain/ask-research";
import {
  discoverWebCandidates,
  resolveGroundingRedirect,
} from "../../functions/src/ai/research-discovery";
const now = Date.now();
const policy = {
  enabled: true,
  version: 1,
  expiresAt: now + 100000,
  merchants: [
    {
      host: "store.example",
      kind: "retailer" as const,
      market: "US" as const,
      sellerIds: ["first-party"],
    },
  ],
};
const offer = {
  title: "Synthetic headphones",
  market: "US" as const,
  variant: "Black",
  sellerId: "first-party",
  url: "https://store.example/item",
  observedAt: now - 1000,
  expiresAt: now + 60000,
  price: {
    amountMinor: 12500,
    currency: "USD" as const,
    sourceText: "$125.00 per item",
  },
  reviews: { rating: 4.7, count: 230, sourceText: "4.7/5 from 230 reviews" },
};
test("research: exact approved host, market and seller only", () => {
  const p = researchPolicySchema.parse(policy);
  expect(researchMerchant(offer.url, "US", "first-party", p)).toBe(offer.url);
  for (const url of [
    "http://store.example/item",
    "https://store.example.evil.test/item",
    "https://store.example@evil.test/item",
    "https://store.example:8443/item",
    "https://127.0.0.1/item",
    "https://store.example./item",
    "https://store.example/item#fragment",
    "javascript:alert(1)",
  ]) {
    expect(researchMerchant(url, "US", "first-party", p)).toBeNull();
    if (!url.includes("store.example.evil.test"))
      expect(
        researchOfferInputSchema.safeParse({ ...offer, url }).success,
      ).toBe(false);
  }
  expect(researchMerchant(offer.url, "JP", "first-party", p)).toBeNull();
  expect(researchMerchant(offer.url, "US", "unknown-seller", p)).toBeNull();
});
test("research: unknown price/reviews remain null; currency and expiry validated", () => {
  expect(
    researchOfferInputSchema.parse({ ...offer, price: null, reviews: null })
      .price,
  ).toBeNull();
  for (const delta of [
    { price: { ...offer.price, currency: "JPY" } },
    { price: { ...offer.price, amountMinor: 0 } },
    { reviews: { ...offer.reviews, count: 0 } },
    { expiresAt: now - 2000 },
    { expiresAt: now + 90000000 },
  ])
    expect(
      researchOfferInputSchema.safeParse({ ...offer, ...delta }).success,
    ).toBe(false);
  expect(
    researchPolicySchema.safeParse({
      ...policy,
      merchants: [{ ...policy.merchants[0], kind: "marketplace" }],
    }).success,
  ).toBe(false);
});
test("research: sourced draft has estimate notes without budget/payment authority", () => {
  const selected = researchOfferSchema.parse({
      ...offer,
      id: "qa-offer",
      version: 1,
      policyVersion: 1,
      contentHash: "a".repeat(64),
    }),
    draft = researchDraft(selected, 2);
  expect(draft.items[0]).toEqual({
    name: offer.title,
    variant: offer.variant,
    url: offer.url,
    quantity: 2,
  });
  expect(draft.notes).toContain("125.00 USD");
  expect(draft.notes).toContain("staff quotation required");
  expect(draft.notes).toContain(offer.url);
  expect(draft.budget).toBeUndefined();
  expect(() => researchDraft(selected, 0)).toThrow();
});
const response = {
  candidates: [
    {
      finishReason: "STOP",
      groundingMetadata: {
        groundingChunks: [
          { web: { uri: offer.url, title: offer.title } },
          { web: { uri: offer.url, title: "duplicate" } },
          {
            web: {
              uri: "https://evil.test/item",
              title: "Injected price 1 USD",
            },
          },
        ],
        webSearchQueries: ["headphones US"],
        searchEntryPoint: {
          renderedContent: "<div>Provider suggestions</div>",
        },
      },
    },
  ],
};
test("discovery: supplied grounding links cannot become verified price/reviews", async () => {
  const result = await discoverWebCandidates(
    { query: "headphones", market: "US" },
    policy,
    async () => response,
    new AbortController().signal,
  );
  expect(result.candidates).toEqual([
    {
      url: offer.url,
      title: offer.title,
      price: null,
      reviews: null,
      verified: false,
    },
  ]);
  expect(result.searchQueries).toHaveLength(1);
  expect(result.suggestionsHtml).toContain("Provider suggestions");
});
test("discovery: absent grounding, truncation, cancelled or disabled fail closed", async () => {
  let calls = 0;
  const transport = async () => {
    calls++;
    return response;
  };
  await expect(
    discoverWebCandidates(
      { query: "headphones", market: "US" },
      { ...policy, enabled: false },
      transport,
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(calls).toBe(0);
  const c = new AbortController();
  c.abort();
  await expect(
    discoverWebCandidates(
      { query: "headphones", market: "US" },
      policy,
      transport,
      c.signal,
    ),
  ).rejects.toThrow();
  expect(calls).toBe(0);
  for (const invalid of [
    {},
    { candidates: [{ ...response.candidates[0], finishReason: "MAX_TOKENS" }] },
    {
      candidates: [
        { finishReason: "STOP", groundingMetadata: { groundingChunks: [] } },
      ],
    },
  ])
    await expect(
      discoverWebCandidates(
        { query: "headphones", market: "US" },
        policy,
        async () => invalid,
        new AbortController().signal,
      ),
    ).rejects.toThrow();
});
test("grounding redirects: fixed Google surface resolves only admitted first-party targets", async () => {
  const proxy =
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AAAAAAAAAAAA";
  let calls = 0;
  const get = async () => {
    calls++;
    return offer.url;
  };
  expect(
    await resolveGroundingRedirect(
      proxy,
      policy,
      "US",
      get,
      new AbortController().signal,
    ),
  ).toBe(offer.url);
  expect(calls).toBe(1);
  for (const url of [
    "https://evil.test/grounding-api-redirect/AAAAAAAAAAAA",
    "https://vertexaisearch.cloud.google.com.evil.test/grounding-api-redirect/AAAAAAAAAAAA",
    "https://127.0.0.1/grounding-api-redirect/AAAAAAAAAAAA",
    proxy + "?url=https://127.0.0.1",
  ]) {
    expect(
      await resolveGroundingRedirect(
        url,
        policy,
        "US",
        get,
        new AbortController().signal,
      ),
    ).toBeNull();
  }
  expect(calls).toBe(1);
  expect(
    await resolveGroundingRedirect(
      proxy,
      policy,
      "US",
      async () => "https://evil.test/item",
      new AbortController().signal,
    ),
  ).toBeNull();
  calls = 0;
  expect(
    await resolveGroundingRedirect(
      proxy,
      policy,
      "US",
      async () => {
        calls++;
        return proxy;
      },
      new AbortController().signal,
    ),
  ).toBeNull();
  expect(calls).toBe(2);
});
test("discovery: policy expiry during provider or redirect response cannot admit a link", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(now);
  try {
    await expect(
      discoverWebCandidates(
        { query: "headphones", market: "US" },
        policy,
        async () => {
          clock.mockReturnValue(policy.expiresAt);
          return response;
        },
        new AbortController().signal,
      ),
    ).rejects.toThrow("RESEARCH_UNAVAILABLE");
    clock.mockReturnValue(now);
    expect(
      await resolveGroundingRedirect(
        "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AAAAAAAAAAAA",
        policy,
        "US",
        async () => {
          clock.mockReturnValue(policy.expiresAt);
          return offer.url;
        },
        new AbortController().signal,
      ),
    ).toBeNull();
  } finally {
    clock.mockRestore();
  }
});
