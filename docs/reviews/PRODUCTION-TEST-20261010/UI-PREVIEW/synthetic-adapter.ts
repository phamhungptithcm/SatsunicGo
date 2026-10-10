const base = {
  ownerId: "preview-synthetic-owner",
  market: "US",
  stage: "QUOTE_ACCEPTED",
  purchaseKind: "custom",
  version: 1,
  createdAt: Date.UTC(2026, 9, 10),
  collected: 490000,
  refunded: 0,
  deposit: 490000,
  checkoutId: "10000000-0000-4000-8000-000000000010",
  items: [{ name: "Áo thun · dữ liệu giả", variant: "Trắng · M", quantity: 1 }],
};
const provenance = {
  executionMode: "production_test",
  executionPolicyVersion: 1,
  testRunId: "20000000-0000-4000-8000-000000000001",
};
export const fixtureRows = [
  { ...base, id: "10000000-0000-4000-8000-000000000001", items: [{ ...base.items[0], name: "Đơn test · dữ liệu giả" }], ...provenance },
  { ...base, id: "10000000-0000-4000-8000-000000000002", items: [{ ...base.items[0], name: "Đơn thật · dữ liệu giả" }] },
  { ...base, id: "10000000-0000-4000-8000-000000000003", items: [{ ...base.items[0], name: "Demo cũ · dữ liệu giả" }], paymentProvider: "demo" },
  { ...base, id: "10000000-0000-4000-8000-000000000004", items: [{ ...base.items[0], name: "Metadata chưa đầy đủ · dữ liệu giả" }], executionPolicyVersion: 1 },
];
export type Scenario = "mixed" | "test" | "live" | "empty" | "error" | "loading";
export const previewState: { scenario: Scenario; readCalls: number; deniedMutations: number } = { scenario: "mixed", readCalls: 0, deniedMutations: 0 };
export const auth = { currentUser: { uid: "preview-synthetic-owner" } };
export const db = Object.freeze({ previewOnly: true });
export const notificationRows = [
  { id: "preview-notification-test", orderId: fixtureRows[0].id, action: "paymentReceived", title: "Đã nhận cập nhật thanh toán · dữ liệu giả", read: true, createdAt: base.createdAt, ...provenance },
  { id: "preview-notification-live", action: "replyTicket", title: "Nhân viên đã trả lời · dữ liệu giả", read: true, createdAt: base.createdAt },
  { id: "preview-notification-demo", orderId: fixtureRows[2].id, action: "paymentReceived", title: "Cập nhật demo cũ · dữ liệu giả", read: true, createdAt: base.createdAt, paymentProvider: "demo" },
  { id: "preview-notification-partial", orderId: fixtureRows[3].id, action: "paymentReceived", title: "Cập nhật chưa đầy đủ · dữ liệu giả", read: true, createdAt: base.createdAt, executionPolicyVersion: 1 },
];

export async function callService(name: string, payload: Record<string, unknown> = {}) {
  const scenario = previewState.scenario;
  if (name === "listWork" && payload.kind === "orders") {
    previewState.readCalls++;
    if (scenario === "loading") await new Promise((resolve) => setTimeout(resolve, 3000));
    if (scenario === "error") throw Error("Dữ liệu giả: chưa tải được danh sách. Chọn trạng thái khác để thử lại.");
    const rows = scenario === "empty" ? [] : scenario === "test" ? [fixtureRows[0]] : scenario === "live" ? [fixtureRows[1]] : fixtureRows;
    return { rows: payload.id ? rows.filter((row) => row.id === payload.id) : structuredClone(rows), next: null };
  }
  if (name === "orderHistory") return { timeline: [], entries: [], order: fixtureRows[0] };
  if (name === "readOrderOperations") return { ...provenance, testMode: true, recipient: null, receiving: null, packing: null, purchase: null };
  if (name === "listOrderImages") return { rows: [] };
  if (name === "readOrderConversation") return { messages: [], next: null, version: 1, assignment: null };
  previewState.deniedMutations++;
  throw Error("Preview chỉ đọc: không thực hiện thao tác.");
}
export async function sendCommand() {
  previewState.deniedMutations++;
  throw Error("Preview chỉ đọc: không thực hiện thao tác.");
}
