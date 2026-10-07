import { describe, expect, it } from "vitest";
import {
  calculateShippingRate,
  shippingRateConfigSchema,
  vietCargoReferenceRates as rates,
  type ShippingQuoteInput,
} from "../../packages/domain/shipping-rates";
const quote = (
  weightGrams: number,
  service: ShippingQuoteInput["service"] = "standard",
) =>
  calculateShippingRate(rates, {
    direction: "VN_US",
    warehouse: "vietnam",
    service,
    weightGrams,
  });
describe("RATES027 official exact source semantics", () => {
  it("reference seed parses at module startup and all generated IDs keep strict grammar", () => {
    expect(shippingRateConfigSchema.safeParse(rates).success).toBe(true);
    expect(rates.rows.every((r) => /^[a-z0-9-]{1,64}$/.test(r.id))).toBe(true);
  });
  it("preserves all44 VN rows and92 US warehouse rows including source duplicate", () => {
    expect(rates.rows.filter((r) => r.direction === "VN_US")).toHaveLength(44);
    expect(rates.rows.filter((r) => r.direction === "US_VN")).toHaveLength(92);
  });
  it.each([
    [1000, 1300000, 1549999],
    [5000, 2450000, 2849999],
    [10500, 4250000, 4749999],
  ])(
    "exact %i gram total prices do not multiply weight",
    (grams, standard, express) => {
      expect(quote(grams)).toMatchObject({
        status: "estimate",
        freightMinor: standard,
        currency: "VND",
      });
      expect(quote(grams, "express")).toMatchObject({
        status: "estimate",
        freightMinor: express,
      });
    },
  );
  it.each([999, 1001, 5250, 5500, 11000, 20000, 20500])(
    "unpublished or current quote-only %i grams has no approximation",
    (grams) => {
      expect(quote(grams)).toEqual({ status: "quote_required" });
    },
  );
  it.each([
    [21000, 239999],
    [44000, 239999],
    [45000, 229999],
    [70000, 229999],
    [71000, 219999],
    [99000, 219999],
    [100000, 209999],
    [100001, 209999],
  ])("bulk %i at exact published perkg %i", (grams, price) => {
    const result = quote(grams, "cargo");
    if (Number.isSafeInteger((grams * price) / 1000))
      expect(result).toMatchObject({
        status: "estimate",
        freightMinor: (grams * price) / 1000,
      });
    else expect(result).toEqual({ status: "quote_required" });
  });
  it.each([44001, 70500, 99500])(
    "bulk interval gap %i is quote-only",
    (grams) =>
      expect(quote(grams, "cargo")).toEqual({ status: "quote_required" }),
  );
  it("US minimum1kg and USD cents freight excludes clearance/FX", () => {
    expect(
      calculateShippingRate(rates, {
        direction: "US_VN",
        warehouse: "texas_cali",
        service: "cargo",
        rowId: "us-texas-cali-laptop",
        weightGrams: 500,
      }),
    ).toMatchObject({
      status: "estimate",
      currency: "USD",
      freightMinor: 990,
      chargeableGrams: 1000,
    });
  });
  it.each([
    "us-texas-cali-iphone-11-16",
    "us-texas-cali-phones",
    "us-texas-cali-tablet",
    "us-texas-cali-watches",
  ])("ambiguous units/tiers %s never quoted deterministically", (rowId) =>
    expect(
      calculateShippingRate(rates, {
        direction: "US_VN",
        warehouse: "texas_cali",
        service: "cargo",
        rowId,
        weightGrams: 1000,
      }),
    ).toEqual({ status: "quote_required" }),
  );
  it("Oregon keeps table10.9 and11.9,29→30tobacco and99phone exactly without extra2doublecount", () => {
    expect(rates.rows.find((r) => r.id === "us-oregon-food")?.amountMinor).toBe(
      1090,
    );
    expect(
      rates.rows.find((r) => r.id === "us-oregon-laptop")?.amountMinor,
    ).toBe(1190);
    expect(
      rates.rows.find((r) => r.id === "us-oregon-tobacco")?.amountMinor,
    ).toBe(3000);
    expect(
      rates.rows.find((r) => r.id === "us-oregon-phones")?.priceDisplay,
    ).toContain("99 USD");
    expect(
      calculateShippingRate(rates, {
        direction: "US_VN",
        warehouse: "oregon",
        service: "cargo",
        rowId: "us-oregon-food",
        weightGrams: 1000,
      }),
    ).toEqual({ status: "quote_required" });
  });
  it("ambiguous overlapping configured prices fail calculator closed", () => {
    const changed = structuredClone(rates);
    changed.rows.push({ ...changed.rows[0], id: "duplicate-weight" });
    expect(
      calculateShippingRate(changed, {
        direction: "VN_US",
        warehouse: "vietnam",
        service: "standard",
        weightGrams: 1000,
      }),
    ).toEqual({ status: "quote_required" });
  });
  it.each([0, -1, 1.5, Infinity, 1000000001])(
    "invalidweight%i rejected",
    (weightGrams) => expect(() => quote(weightGrams)).toThrow(),
  );
  it("strict config rejects arbitrary sources,duplicateIDs,nullnumericprices,and wrongwarehousecurrency", () => {
    for (const mutate of [
      (c: typeof rates) => {
        c.sourceUrls = ["https://evil.example/"];
      },
      (c: typeof rates) => {
        c.rows[1].id = c.rows[0].id;
      },
      (c: typeof rates) => {
        c.rows[0].amountMinor = null;
      },
      (c: typeof rates) => {
        c.rows[0].warehouse = "oregon";
      },
      (c: typeof rates) => {
        c.rows[0].currency = "USD";
      },
    ]) {
      const c = structuredClone(rates);
      mutate(c);
      expect(shippingRateConfigSchema.safeParse(c).success).toBe(false);
    }
  });
});

// Public read must never revive disabled, malformed or unreachable tariffs.
describe("RATES030 public snapshot failure boundaries", () => {
  async function readWith(exists: boolean, value: Record<string, unknown>) {
    const { readPublicShippingRates } =
      await import("../../functions/src/shipping-rates");
    const db = {
      doc: (path: string) => {
        expect(path).toBe("shippingRatePublic/current");
        return { get: async () => ({ exists, data: () => value }) };
      },
    };
    return readPublicShippingRates(
      db as unknown as Parameters<typeof readPublicShippingRates>[0],
    );
  }
  it("absent snapshot is explicitly reference, never published", async () => {
    await expect(readWith(false, {})).resolves.toMatchObject({
      origin: "reference",
      version: null,
      config: rates,
    });
  });
  it("disabled snapshot does not fall back to reference", async () => {
    await expect(
      readWith(true, { version: 3, disabled: true }),
    ).resolves.toEqual({ origin: "unavailable", version: 3, config: null });
  });
  it("published snapshot retains version and safe configuration", async () => {
    await expect(
      readWith(true, { version: 4, config: rates }),
    ).resolves.toEqual({ origin: "published", version: 4, config: rates });
  });
  it("malformed configuration and unsafe version fail closed", async () => {
    await expect(
      readWith(true, { version: 4, config: {} }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    await expect(
      readWith(true, { version: -1, config: rates }),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  });
  it("Firestore read failure is propagated without reference prices", async () => {
    const { readPublicShippingRates } =
      await import("../../functions/src/shipping-rates");
    const db = {
      doc: () => ({
        get: async () => {
          throw Error("Synthetic unavailable read");
        },
      }),
    };
    await expect(
      readPublicShippingRates(
        db as unknown as Parameters<typeof readPublicShippingRates>[0],
      ),
    ).rejects.toThrow("Synthetic unavailable read");
  });
});
