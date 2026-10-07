// LOCAL_SYNTHETIC: no backend, bank, provider, auth or publication requests.
export const auth = null;
export const configured = false;
export const emulatorMode = false;
const documentRow = {
  id: "synthetic-invoice095",
  sourceOrderId: "synthetic-order095",
  version: 1,
  state: "draft",
  seller: {
    name: "Doanh nghiệp kiểm thử",
    address: "Địa chỉ kiểm thử",
    contact: "Liên hệ kiểm thử",
  },
  lines: [{ name: "Sản phẩm kiểm thử", variant: "Màu xanh", quantity: 2 }],
  total: 1200000,
  netCollected: 200000,
  remainingDue: 1000000,
  overpayment: 0,
  termsVersion: "synthetic095",
  purchaseKind: "custom",
  createdAt: 1791340000000,
};
const query = new URLSearchParams(location.search);
const mode = query.get("mode") ?? "empty";
export async function callService<T>(
  name: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (mode === "loading")
    await new Promise((resolve) => setTimeout(resolve, 2000));
  if (mode === "error") throw new Error("Synthetic095 unavailable");
  if (mode === "denied")
    throw Object.assign(new Error("Synthetic095 denied"), {
      code: "functions/permission-denied",
    });
  if (name.endsWith("Command") || name === "financeReview") {
    throw Object.assign(
      new Error("Synthetic095 uncertain; no real command sent"),
      { code: "functions/unavailable" },
    );
  }
  if (name === "invoiceList")
    return {
      rows: mode === "populated" ? [documentRow] : [],
      next: null,
      canIssue: true,
      canConfigure: true,
      seller: { seller: documentRow.seller, version: 1 },
    } as T;
  if (name === "invoiceDetail") return documentRow as T;
  if (name === "orderHistory") return { order: { version: 1 } } as T;
  if (name === "websiteBannerAdmin")
    return {
      rows: [],
      next: null,
      modes: { home: "auto", products: "auto" },
      manifestVersion: 1,
      owner: true,
      serverNow: Date.now(),
    } as T;
  if (name === "listWork") {
    let rows: unknown[] = [];
    if (mode === "populated") {
      if (payload.kind === "refunds")
        rows = [
          {
            id: "synthetic-refund095",
            orderId: "synthetic-order095",
            amount: 240000,
            reason: "Lý do kiểm thử",
            state: "pending",
          },
        ];
      if (payload.kind === "campaigns")
        rows = [
          {
            id: "synthetic-campaign095",
            version: 1,
            title: "Chiến dịch kiểm thử",
            caption: "Nội dung kiểm thử để xem bố cục.",
            path: "/products",
            source: "facebook",
            medium: "social",
            campaign: "synthetic095",
            status: "draft",
          },
        ];
      if (payload.kind === "transferReviews")
        rows = [
          {
            id: "synthetic-transfer095",
            orderId: "synthetic-order095",
            amount: 240000,
            reference: "synthetic-bank095",
            status: "pending",
          },
        ];
    }
    return { rows, next: null } as T;
  }
  throw new Error(`Unsupported synthetic service: ${name}`);
}
export async function sendCommand() {
  throw new Error("No real commands in synthetic095");
}
