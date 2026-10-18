import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { Link, useSearchParams } from "react-router-dom";
import { callService } from "../../shared/firebase";
import type { CheckoutLine } from "../../../packages/domain/purchase-checkout";
import "./production-demo.css";

type Product = { id: string; title: string; price: number; options: string[] };
type DemoOrder = {
  id: string;
  stage: string;
  version: number;
  items: { name: string; quantity: number }[];
  tracking: string | null;
};
type Status = {
  session: {
    id: string;
    enabled: boolean;
    expiresAt: number;
    checkoutCount: number;
  };
  cart: {
    revision: number;
    items: { productId: string; quantity: number; variant: string }[];
    activeCheckoutId?: string;
  };
  checkouts: {
    id: string;
    state: string;
    total: number;
    lines: CheckoutLine[];
    receiptId: string | null;
  }[];
  orders: DemoOrder[];
};
type Preview = {
  id: string;
  total: number;
  previewHash: string;
  lines: CheckoutLine[];
};
const money = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
const stages: Record<string, string> = {
  QUOTE_ACCEPTED: "Chờ xử lý",
  PURCHASING: "Đang mua thử",
  PURCHASED: "Đã ghi nhận mua thử",
  ORIGIN_RECEIVED: "Đã nhận tại kho thử",
  PACKED: "Đã đóng gói thử",
  READY_TO_SHIP: "Sẵn sàng giao thử",
  IN_TRANSIT: "Đang giao thử",
  DELIVERED: "Đã giao thử",
  COMPLETED: "Đã xác nhận nhận hàng thử",
};
export function nextDemoStep(o: DemoOrder) {
  const quantity = o.items.reduce((n, i) => n + i.quantity, 0),
    lines = o.items.map((i, line) => ({ line, quantity: i.quantity }));
  const steps: Record<
    string,
    { action: string; label: string; payload: unknown }
  > = {
    QUOTE_ACCEPTED: {
      action: "claimPurchase",
      label: "Nhận xử lý đơn thử",
      payload: {},
    },
    PURCHASING: {
      action: "recordPurchase",
      label: "Ghi nhận mua hàng mô phỏng",
      payload: {
        quantity,
        lines,
        supplierOrder: `DEMO-${o.id.slice(0, 8)}`,
        evidence: "Mô phỏng, không mua hàng thật",
        actualSourceMinor: 0,
      },
    },
    PURCHASED: {
      action: "receive",
      label: "Nhận hàng vào kho thử",
      payload: {
        quantity,
        lines,
        condition: "good",
        shelf: "DEMO",
        evidence: "Mô phỏng, không nhập kho thật",
      },
    },
    ORIGIN_RECEIVED: {
      action: "pack",
      label: "Đóng gói mô phỏng",
      payload: {
        weightGrams: 1000,
        dimensionsCm: [10, 10, 10],
        evidence: "Mô phỏng, không tạo kiện thật",
        checklist: true,
      },
    },
    READY_TO_SHIP: {
      action: "dispatch",
      label: "Bắt đầu giao mô phỏng",
      payload: {},
    },
    IN_TRANSIT: {
      action: "track",
      label: "Ghi nhận đã giao mô phỏng",
      payload: { tracking: `DEMO-${o.id.slice(0, 8)}`, delivered: true },
    },
    DELIVERED: {
      action: "confirmReceipt",
      label: "Xác nhận đã nhận hàng thử",
      payload: { received: true },
    },
  };
  return steps[o.stage];
}
export function ProductionDemo({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => void;
}) {
  const [params, setParams] = useSearchParams(),
    runId = params.get("run") ?? "";
  const [status, setStatus] = useState<Status | null>(null),
    [products, setProducts] = useState<Product[]>([]),
    [productId, setProductId] = useState(""),
    [variant, setVariant] = useState(""),
    [quantity, setQuantity] = useState(1),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const generation = useRef(0),
    flight = useRef(false),
    retry = useRef<{ key: string; id: string } | null>(null);
  const product = products.find((p) => p.id === productId);
  const active =
    !!status?.session.enabled && status.session.expiresAt > Date.now();
  const operation = (key: string) => {
    if (retry.current?.key !== key)
      retry.current = { key, id: crypto.randomUUID() };
    return retry.current.id;
  };
  async function refresh(id = runId, gen = generation.current) {
    const value = await callService<Status>(
      "productionDemo",
      { action: "status", runId: id },
      "inline",
    );
    if (gen !== generation.current) return;
    setStatus(value);
    if (value.session.enabled && value.session.expiresAt > Date.now()) {
      const catalog = await callService<{ products: Product[] }>(
        "productionDemo",
        { action: "catalog", runId: id },
        "inline",
      );
      if (gen === generation.current) setProducts(catalog.products);
    }
  }
  async function act(work: () => Promise<void>) {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
      retry.current = null;
    } catch {
      setError(
        "Thao tác chưa được xác nhận. Tải lại kết quả trước khi thử lại. Nếu phiên đã hết hạn hoặc cần xác thực hai lớp, mở mục Bảo mật.",
      );
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    const gen = ++generation.current;
    setStatus(null);
    setProducts([]);
    setPreview(null);
    setError("");
    setMessage("");
    retry.current = null;
    if (user && runId) {
      void refresh(runId, gen).catch(() => {
        if (gen === generation.current)
          setError(
            "Chưa tải đủ dữ liệu demo. Kiểm tra tài khoản, mã phiên và tải lại kết quả.",
          );
      });
    }
    return () => {
      generation.current++;
    };
    // State is isolated by authenticated user and run. Never carry another account's results.
  }, [user?.uid, runId]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function start() {
    const id = operation("activate");
    await callService(
      "productionDemo",
      { action: "activate", runId: id },
      "inline",
    );
    if (mounted.current) setParams({ run: id });
  }
  async function resume() {
    const r = await callService<{ runId: string | null }>(
      "productionDemo",
      { action: "current" },
      "inline",
    );
    if (!mounted.current) return;
    if (r.runId) setParams({ run: r.runId });
    else setMessage("Chưa có phiên demo đã lưu.");
  }
  async function download(id: string) {
    const r = await callService<{ state: string; base64?: string }>(
      "purchaseReceipt",
      { id, download: true },
      "inline",
    );
    if (r.state !== "ready" || !r.base64) {
      setMessage("Biên nhận đang được tạo. Bạn có thể kiểm tra lại sau.");
      return;
    }
    const blob = new Blob(
        [Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0))],
        { type: "application/pdf" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `bien-nhan-mo-phong-${id}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Đã tải biên nhận mô phỏng.");
  }
  if (!user)
    return (
      <main className="page productionDemo">
        <h1>Demo trên production</h1>
        <p>Thanh toán và giao nhận mô phỏng, không thu tiền thật.</p>
        <button onClick={signIn}>Đăng nhập với Google</button>
      </main>
    );
  return (
    <section className="page productionDemo">
      <header>
        <div>
          <p className="demoEyebrow">SatsunicGo · Phiên thử riêng</p>
          <h1>Demo trên production</h1>
          <p>
            Không thu tiền, mua hàng hay giao hàng thật. Đơn và biên nhận được
            lưu bằng luồng xử lý của hệ thống.
          </p>
        </div>
        <Link to="/">Về trang chính</Link>
      </header>
      <p className="demoNotice" role="note">
        Đơn SePay cũ được giữ nguyên. Các bước bên dưới chỉ áp dụng cho dữ liệu
        của phiên thử này.
      </p>
      <div className="demoActions">
        <Link to="/account/security">Bảo mật · xác thực hai lớp</Link>
        <Link to="/crm">Mở CRM</Link>
        {runId && (
          <button disabled={busy} onClick={() => void act(() => refresh())}>
            Tải lại kết quả
          </button>
        )}
      </div>
      {error && (
        <p className="demoError" role="alert">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!runId ? (
        <article>
          <h2>Mở phiên demo</h2>
          <p>
            Chỉ chủ tài khoản được phép mở phiên sau khi xác thực hai lớp. Phiên
            kéo dài tối đa 4 giờ, giới hạn 5 lượt thanh toán mô phỏng.
          </p>
          <div className="demoActions">
            <button
              className="primary"
              disabled={busy}
              onClick={() => void act(start)}
            >
              Mở phiên demo 4 giờ
            </button>
            <button disabled={busy} onClick={() => void act(resume)}>
              Tiếp tục phiên đã lưu
            </button>
          </div>
        </article>
      ) : !status ? (
        <p role="status">
          {error ? "Phiên demo chưa tải được." : "Đang tải phiên demo…"}
        </p>
      ) : (
        <>
          <div className="demoSession">
            <p>
              Phiên <code>{runId.slice(0, 8)}</code> ·{" "}
              {status.session.checkoutCount}/5 lượt · Hết hạn{" "}
              {new Date(status.session.expiresAt).toLocaleString("vi-VN")}
            </p>
            <button
              disabled={busy || !active}
              onClick={() =>
                void act(async () => {
                  await callService(
                    "productionDemo",
                    { action: "disable", runId },
                    "inline",
                  );
                  await refresh();
                })
              }
            >
              Dừng phiên demo
            </button>
          </div>
          {!active && (
            <p role="status">
              Phiên đã dừng hoặc hết hạn. Kết quả đã lưu vẫn xem được.{" "}
              <Link to="/demo">Mở phiên mới</Link>
            </p>
          )}
          <article>
            <h2>1. Giỏ thử và tổng quan</h2>
            <p>
              Số tiền lấy từ sản phẩm đã công bố, chỉ dùng mô phỏng. Địa chỉ
              nhận là dữ liệu thử, không dùng giao hàng.
            </p>
            <div className="demoFields">
              <label>
                Sản phẩm
                <select
                  value={productId}
                  disabled={busy || !active || !!status.cart.activeCheckoutId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setVariant("");
                    setPreview(null);
                  }}
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {money(p.price)}
                    </option>
                  ))}
                </select>
              </label>
              {!!product?.options.length && (
                <label>
                  Phân loại
                  <select
                    value={variant}
                    disabled={busy}
                    onChange={(e) => setVariant(e.target.value)}
                  >
                    <option value="">Chọn phân loại</option>
                    {product.options.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Số lượng
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={quantity}
                  disabled={busy || !active}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="demoActions">
              <button
                disabled={
                  busy ||
                  !active ||
                  !product ||
                  !Number.isInteger(quantity) ||
                  quantity < 1 ||
                  quantity > 5 ||
                  (!!product?.options.length && !variant) ||
                  !!status.cart.activeCheckoutId
                }
                onClick={() =>
                  void act(async () => {
                    await callService(
                      "productionDemo",
                      {
                        action: "select",
                        runId,
                        operationId: operation(
                          `select-${productId}-${quantity}-${variant}`,
                        ),
                        expectedRevision: status.cart.revision,
                        productId,
                        quantity,
                        variant,
                      },
                      "inline",
                    );
                    setPreview(null);
                    await refresh();
                  })
                }
              >
                Lưu vào giỏ thử
              </button>
              <button
                disabled={
                  busy ||
                  !active ||
                  !status.cart.items.length ||
                  !!status.cart.activeCheckoutId
                }
                onClick={() =>
                  void act(async () => {
                    const p = await callService<Preview>(
                      "productionDemo",
                      {
                        action: "preview",
                        runId,
                        operationId: operation(
                          `preview-${status.cart.revision}`,
                        ),
                        expectedRevision: status.cart.revision,
                      },
                      "inline",
                    );
                    setPreview(p);
                  })
                }
              >
                Xem tổng quan
              </button>
            </div>
            {!!status.cart.items.length && (
              <p>
                Giỏ thử: {status.cart.items.reduce((s, i) => s + i.quantity, 0)}{" "}
                sản phẩm.
              </p>
            )}
            {preview && (
              <div className="demoPreview">
                <ul>
                  {preview.lines.map((l) => (
                    <li key={l.lineId}>
                      {l.name} × {l.quantity} — {money(l.total)}
                    </li>
                  ))}
                </ul>
                <strong>Tổng mô phỏng: {money(preview.total)}</strong>
                <p>Không phát sinh giao dịch ngân hàng hay đơn SePay.</p>
                <button
                  className="primary"
                  disabled={busy || !active || !!status.cart.activeCheckoutId}
                  onClick={() =>
                    void act(async () => {
                      await callService(
                        "productionDemo",
                        {
                          action: "commit",
                          runId,
                          operationId: operation(`commit-${preview.id}`),
                          previewId: preview.id,
                          previewHash: preview.previewHash,
                          confirmed: true,
                        },
                        "inline",
                      );
                      setPreview(null);
                      await refresh();
                    })
                  }
                >
                  Tạo lượt thanh toán mô phỏng
                </button>
              </div>
            )}
          </article>
          <article>
            <h2>2. Thanh toán mô phỏng và biên nhận</h2>
            {!status.checkouts.length ? (
              <p>Chưa có lượt thanh toán mô phỏng.</p>
            ) : (
              status.checkouts.map((c) => (
                <div key={c.id} className="demoRow">
                  <div>
                    <strong>{money(c.total)}</strong>
                    <p>
                      {c.state === "paid"
                        ? "Đã xác nhận thanh toán mô phỏng"
                        : c.state === "pending"
                          ? "Chờ mô phỏng thanh toán"
                          : c.state === "cancelled"
                            ? "Đã hủy lượt mô phỏng"
                            : "Cần kiểm tra kết quả mô phỏng"}
                    </p>
                    <code>{c.id.slice(0, 8)}</code>
                  </div>
                  <div className="demoActions">
                    {c.state === "pending" && (
                      <button
                        className="primary"
                        disabled={busy || !active}
                        onClick={() =>
                          void act(async () => {
                            await callService(
                              "productionDemo",
                              { action: "simulate", runId, checkoutId: c.id },
                              "inline",
                            );
                            await refresh();
                          })
                        }
                      >
                        Mô phỏng thanh toán thành công
                      </button>
                    )}
                    {c.state === "pending" && (
                      <button
                        disabled={busy || !active}
                        onClick={() =>
                          void act(async () => {
                            await callService(
                              "productionDemo",
                              { action: "cancel", runId, checkoutId: c.id },
                              "inline",
                            );
                            await refresh();
                          })
                        }
                      >
                        Hủy lượt chưa mô phỏng
                      </button>
                    )}
                    {c.state !== "paid" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void act(async () => {
                            await callService(
                              "productionDemo",
                              { action: "reconcile", runId, checkoutId: c.id },
                              "inline",
                            );
                            await refresh();
                          })
                        }
                      >
                        Kiểm tra lượt này
                      </button>
                    )}
                    {c.receiptId && (
                      <button
                        disabled={busy}
                        onClick={() => void act(() => download(c.receiptId!))}
                      >
                        Tải biên nhận mô phỏng
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            <p>
              Biên nhận mô phỏng không xác nhận đã thu tiền và không phải hóa
              đơn.
            </p>
          </article>
          <article>
            <h2>3. Xử lý đơn và giao nhận thử</h2>
            <p>
              Các bước dưới đây lưu trạng thái đơn thật trên dữ liệu thử. Không
              liên hệ nhà cung cấp, hãng vận chuyển hay tác động kho thực.
            </p>
            {!status.orders.length ? (
              <p>Đơn xuất hiện sau khi thanh toán mô phỏng được xác nhận.</p>
            ) : (
              status.orders.map((o) => {
                const step = nextDemoStep(o);
                return (
                  <div className="demoRow" key={o.id}>
                    <div>
                      <Link to={`/account/orders/${o.id}`}>
                        Đơn thử {o.id.slice(0, 8)}
                      </Link>
                      <p>{stages[o.stage] ?? "Cần kiểm tra trạng thái"}</p>
                      {o.tracking && <p>Mã theo dõi mô phỏng: {o.tracking}</p>}
                    </div>
                    {step ? (
                      <button
                        disabled={busy || !active}
                        onClick={() =>
                          void act(async () => {
                            await callService(
                              "productionDemoCommand",
                              {
                                runId,
                                operationId: operation(
                                  `${o.id}-${o.version}-${step.action}`,
                                ),
                                orderId: o.id,
                                expectedVersion: o.version,
                                action: step.action,
                                payload: step.payload,
                              },
                              "inline",
                            );
                            await refresh();
                          })
                        }
                      >
                        {step.label}
                      </button>
                    ) : o.stage === "COMPLETED" ? (
                      <strong role="status">Đã hoàn tất luồng thử</strong>
                    ) : null}
                  </div>
                );
              })
            )}
          </article>
        </>
      )}
      {busy && (
        <p className="demoWorking" role="status">
          Đang xử lý, chờ kết quả được lưu…
        </p>
      )}
    </section>
  );
}
