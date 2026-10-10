import { afterEach, beforeEach, expect, test, vi } from "vitest";

const ports = vi.hoisted(() => ({ run: vi.fn(), db: vi.fn(), key: vi.fn(), log: vi.fn(), options: {} as Record<string, unknown> }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: ports.db }));
vi.mock("firebase-functions/params", () => ({ defineSecret: (name: string) => ({ name, value: ports.key }) }));
vi.mock("firebase-functions/logger", () => ({ info: ports.log, warn: ports.log }));
vi.mock("firebase-functions/v2/https", () => ({ onRequest: (options: Record<string, unknown>, handler: unknown) => { ports.options = options; return handler; } }));
vi.mock("../../functions/src/email/self-test-service", async importOriginal => ({
  ...await importOriginal<typeof import("../../functions/src/email/self-test-service")>(), runSelfTest: ports.run,
}));
import { emailSelfTest } from "../../functions/src/email/self-test";
import { SelfTestError } from "../../functions/src/email/self-test-service";

const operationId = "9303e799-9923-47e8-aa31-996b9a5d17ab";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo"); vi.stubEnv("FUNCTIONS_EMULATOR", "false");
  vi.stubEnv("EMAIL_TEST_ENABLED", "true"); vi.stubEnv("EMAIL_TEST_RECIPIENT", "operator@example.invalid");
  ports.run.mockResolvedValue({ state: "accepted", operationId, replay: false, providerId: operationId });
});
afterEach(() => vi.unstubAllEnvs());
async function invoke(overrides: Record<string, unknown> = {}) {
  const req = { method: "POST", is: () => true, body: { operationId }, rawBody: Buffer.from(JSON.stringify({ operationId })), ...overrides };
  const res = { set: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  await emailSelfTest(req as never, res as never);
  return res;
}
test("private IAM, bounded runtime and only confirmed secret binding", () => {
  expect(ports.options).toMatchObject({ invoker: "private", cors: false, maxInstances: 1, concurrency: 1, timeoutSeconds: 30 });
  expect(ports.options.secrets).toEqual([{ name: "SFTP_PASSWORD", value: ports.key }]);
});
test("accepted response and logs contain no recipient or secret", async () => {
  const res = await invoke(); expect(res.status).toHaveBeenCalledWith(200);
  expect(ports.run).toHaveBeenCalledOnce();
  expect(JSON.stringify([res.json.mock.calls, ports.log.mock.calls])).not.toContain("operator@example.invalid");
  expect(ports.key).not.toHaveBeenCalled(); // Orchestrator reads after the durable claim.
});
test.each([["FUNCTIONS_EMULATOR", "true"], ["GCLOUD_PROJECT", "demo-satsunicgo"], ["EMAIL_TEST_ENABLED", "false"]])("%s gate blocks all ports", async (key, value) => {
  vi.stubEnv(key, value); expect((await invoke()).status).toHaveBeenCalledWith(403);
  expect(ports.db).not.toHaveBeenCalled(); expect(ports.run).not.toHaveBeenCalled(); expect(ports.key).not.toHaveBeenCalled();
});
test.each([
  { method: "GET" }, { is: () => false }, { rawBody: Buffer.alloc(513) },
  { body: { operationId, to: "victim@example.invalid" } },
  { body: { operationId, html: "<img src='https://bad.invalid'>" } },
  { body: { operationId: "../../customer" } },
])("bad request rejects before state or secret access", async overrides => {
  const res = await invoke(overrides); expect(res.status.mock.calls[0][0]).toBeGreaterThanOrEqual(400);
  expect(ports.run).not.toHaveBeenCalled(); expect(ports.db).not.toHaveBeenCalled();
});
test("missing recipient config blocks state and secret", async () => {
  vi.stubEnv("EMAIL_TEST_RECIPIENT", ""); expect((await invoke()).status).toHaveBeenCalledWith(503);
  expect(ports.db).not.toHaveBeenCalled(); expect(ports.run).not.toHaveBeenCalled();
});
test.each([["COOLDOWN", 429], ["DAILY_LIMIT", 429], ["OPERATION_CONFLICT", 409], ["INVALID_STATE", 503]] as const)("%s has safe status", async (code, status) => {
  ports.run.mockRejectedValue(new SelfTestError(code)); expect((await invoke()).status).toHaveBeenCalledWith(status);
});
test("database errors are sanitized", async () => {
  ports.run.mockRejectedValue(new Error("sensitive data"));
  const res = await invoke(); expect(res.json).toHaveBeenCalledWith({ code: "STATE_UNAVAILABLE" });
});
test.each([["processing", 202], ["unknown", 202], ["rejected", 422]] as const)("%s is not reported as acceptance", async (state, status) => {
  ports.run.mockResolvedValue({ operationId, replay: false, state }); expect((await invoke()).status).toHaveBeenCalledWith(status);
});
