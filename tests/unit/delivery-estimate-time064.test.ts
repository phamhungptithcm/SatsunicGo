import { it, expect } from "vitest";
import {
  localInstants,
  chooseLocalInstant,
  estimateWindow,
  offsetLabel,
  formatEstimateInstant,
} from "../../src/features/shipping/delivery-estimate-time";
it("requires explicit choice for each repeated Chicago hour", () => {
  const candidates = localInstants("2026-11-01T01:30", "America/Chicago");
  expect(candidates).toEqual([
    { at: Date.parse("2026-11-01T06:30:00Z"), offsetMinutes: -300 },
    { at: Date.parse("2026-11-01T07:30:00Z"), offsetMinutes: -360 },
  ]);
  expect(() =>
    chooseLocalInstant("2026-11-01T01:30", "America/Chicago", ""),
  ).toThrow("ambiguous");
  for (const c of candidates)
    expect(
      chooseLocalInstant("2026-11-01T01:30", "America/Chicago", String(c.at)),
    ).toBe(c.at);
});
it("rejects nonexistent local hour and malformed calendar rather than normalizing", () => {
  for (const date of [
    "2027-03-14T02:30",
    "2027-02-30T12:00",
    "2027-01-01T24:00",
    "2027-13-01T12:00",
    "wrong",
  ])
    expect(localInstants(date, "America/Chicago")).toEqual([]);
});
it("resolves fixed and quarter-hour offsets without assuming whole hours", () => {
  expect(localInstants("2027-01-01T12:00", "Asia/Ho_Chi_Minh")).toEqual([
    { at: Date.parse("2027-01-01T05:00Z"), offsetMinutes: 420 },
  ]);
  expect(localInstants("2027-01-01T12:00", "Asia/Kathmandu")).toEqual([
    { at: Date.parse("2027-01-01T06:15Z"), offsetMinutes: 345 },
  ]);
  expect(offsetLabel(345)).toBe("UTC+05:45");
  expect(offsetLabel(-300)).toBe("UTC−05:00");
});
it("orders exact UTC instants across a repeated hour instead of wall text order", () => {
  const input = {
    start: "2026-11-01T01:45",
    end: "2026-11-01T01:15",
    zone: "America/Chicago",
    startChoice: String(Date.parse("2026-11-01T06:45Z")),
    endChoice: String(Date.parse("2026-11-01T07:15Z")),
  };
  expect(
    estimateWindow(input, input.zone, Date.parse("2026-10-01T00:00Z")),
  ).toEqual({
    startAt: Date.parse("2026-11-01T06:45Z"),
    endAt: Date.parse("2026-11-01T07:15Z"),
  });
  expect(() =>
    estimateWindow(
      { ...input, startChoice: String(Date.parse("2026-11-01T07:45Z")) },
      input.zone,
      1,
    ),
  ).toThrow("range");
});
it("rejects stale offset choice, changed zone, elapsed and absent endpoint", () => {
  const input = {
    start: "2027-01-01T12:00",
    end: "2027-01-01T13:00",
    zone: "Asia/Ho_Chi_Minh",
    startChoice: "",
    endChoice: "",
  };
  expect(() => estimateWindow(input, "America/Chicago", 1)).toThrow("zone");
  expect(() =>
    estimateWindow({ ...input, startChoice: "123" }, input.zone, 1),
  ).toThrow("ambiguous");
  expect(() => estimateWindow({ ...input, end: "" }, input.zone, 1)).toThrow(
    "missing",
  );
  expect(() =>
    estimateWindow(input, input.zone, Date.parse("2028-01-01T00:00Z")),
  ).toThrow("elapsed");
  expect(localInstants(input.start, "invalid zone")).toEqual([]);
});
it("UTC window is detached from draft after conversion for immutable command replay", () => {
  const draft = {
    start: "2027-01-01T12:00",
    end: "2027-01-01T13:00",
    zone: "Asia/Ho_Chi_Minh",
    startChoice: "",
    endChoice: "",
  };
  const issued = estimateWindow(draft, draft.zone, 1),
    before = JSON.stringify(issued);
  draft.start = "2027-01-02T12:00";
  draft.zone = "America/Chicago";
  expect(JSON.stringify(issued)).toBe(before);
});
it("formats each endpoint with explicit locale, IANA zone and offset", () => {
  const first = formatEstimateInstant(
    Date.parse("2026-11-01T06:30Z"),
    "en",
    "America/Chicago",
  );
  const second = formatEstimateInstant(
    Date.parse("2026-11-01T07:30Z"),
    "en",
    "America/Chicago",
  );
  expect(first).toContain("America/Chicago (UTC−05:00)");
  expect(second).toContain("America/Chicago (UTC−06:00)");
  expect(
    formatEstimateInstant(
      Date.parse("2027-01-01T06:15Z"),
      "vi",
      "Asia/Kathmandu",
    ),
  ).toContain("Asia/Kathmandu (UTC+05:45)");
});
