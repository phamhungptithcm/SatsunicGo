import { describe, expect, it } from "vitest";
import { assertDemoEnvironment } from "../../scripts/demo-guard.mjs";
import {
  normalizeCustomerName,
  localDateTime,
  appointmentTimestamp,
  customerNotesSchema,
} from "../../packages/domain/crm";
describe("CRM search and appointment input", () => {
  it("normalizes Vietnamese prefixes without losing spaces", () => {
    expect(normalizeCustomerName("  ĐẶNG   Nguyễn Ánh ")).toBe(
      "dang nguyen anh",
    );
    expect(normalizeCustomerName("Đặng")).toBe(normalizeCustomerName("dang"));
  });
  it("roundtrips a scheduled local appointment without clearing it", () => {
    const timestamp = new Date(2026, 9, 4, 11, 35).getTime();
    expect(new Date(localDateTime(timestamp)).getTime()).toBe(timestamp);
    expect(localDateTime(0)).toBe("");
    const withSeconds = timestamp + 10321;
    expect(appointmentTimestamp(localDateTime(withSeconds), withSeconds)).toBe(
      withSeconds,
    );
    expect(appointmentTimestamp("", withSeconds)).toBe(0);
  });
  it("rejects invalid appointments and client-injected authority", () => {
    const input = {
      id: "customer-a",
      operationId: "35b59687-a342-4df9-818a-5dbd337a9190",
      tags: [],
      notes: "",
      assigneeId: "",
      followUpAt: 0,
    };
    expect(
      customerNotesSchema.safeParse({ ...input, followUpAt: NaN }).success,
    ).toBe(false);
    expect(
      customerNotesSchema.safeParse({ ...input, roles: ["OWNER"] }).success,
    ).toBe(false);
  });
});
it("demo seed refuses production, missing and non-loopback emulator targets", () => {
  const allowed = {
    GCLOUD_PROJECT: "demo-satsunicgo",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9198",
    FIRESTORE_EMULATOR_HOST: "127.0.0.1:8181",
  };
  expect(() => assertDemoEnvironment(allowed)).not.toThrow();
  for (const bad of [
    {},
    { ...allowed, GCLOUD_PROJECT: "satsunicgo" },
    { ...allowed, FIRESTORE_EMULATOR_HOST: "remote.example:8181" },
    { ...allowed, FIREBASE_AUTH_EMULATOR_HOST: "" },
  ])
    expect(() => assertDemoEnvironment(bad)).toThrow();
});
