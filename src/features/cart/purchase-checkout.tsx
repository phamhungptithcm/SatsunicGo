import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { User } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { callService, db } from "../../shared/firebase";
import { useCart } from "./cart-store";
import { LoadingState } from "../../shared/Loading";
import type {
  CheckoutRecipient,
  CheckoutSnapshot,
} from "../../../packages/domain/purchase-checkout";
import {
  admitPurchaseCheckoutAcknowledgement,
  checkoutRecipientSchema,
} from "../../../packages/domain/purchase-checkout";
import type {
  ShippingRateConfig,
  ShippingQuoteInput,
} from "../../../packages/domain/shipping-rates";
import "./purchase-checkout.css";
import { PurchaseThumbnail } from "./purchase-thumbnail";
const money = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
type Province = {
  code: string;
  name: string;
  communes: { code: string; name: string }[];
};
type Setup = {
  regions: Province[];
  shipping: ShippingRateConfig | null;
  shippingOrigin: string;
  pricing: unknown;
};
type Preview = CheckoutSnapshot & { previewHash: string };
type SavedAddress = {
  id: string;
  recipient: string;
  phone?: string;
  address: string;
  provinceCode?: string;
  communeCode?: string;
};
type Commit = {
  action: "commit";
  operationId: string;
  previewId: string;
  previewHash: string;
  confirmed: true;
};
const blank: CheckoutRecipient = {
  recipient: "",
  phone: "",
  country: "VN",
  provinceCode: "",
  communeCode: "",
  province: "",
  commune: "",
  street: "",
  note: "",
};
export function PurchaseJourney({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav className="purchaseSteps" aria-label="Các bước hoàn tất đơn">
      {["Nhận hàng", "Tổng quan", "Thanh toán"].map((label, index) => (
        <div
          key={label}
          className={
            index + 1 === current
              ? "isCurrent"
              : index + 1 < current
                ? "isComplete"
                : ""
          }
          aria-current={index + 1 === current ? "step" : undefined}
        >
          <span aria-hidden="true">
            {index + 1 < current ? "✓" : index + 1}
          </span>
          <span>{label}</span>
        </div>
      ))}
    </nav>
  );
}
export function PurchaseCheckout({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => void;
}) {
  const { cart, loading: cartLoading, cached, refresh } = useCart(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const orderId = params.get("order"),
    balance = Boolean(orderId);
  const [setup, setSetup] = useState<Setup | null>(null),
    [recipient, setRecipient] = useState<CheckoutRecipient>(blank),
    [addresses, setAddresses] = useState<SavedAddress[]>([]),
    [saved, setSaved] = useState("");
  const [step, setStep] = useState<1 | 2>(balance ? 2 : 1),
    [preview, setPreview] = useState<Preview | null>(null),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [warehouse, setWarehouse] = useState<"texas_cali" | "oregon">(
      "texas_cali",
    ),
    [category, setCategory] = useState(""),
    [weight, setWeight] = useState("");
  const heading = useRef<HTMLHeadingElement>(null),
    flight = useRef(false),
    pending = useRef<Commit | null>(null),
    generation = useRef(0);
  const key = `purchase-commit:${user?.uid ?? "guest"}:${balance ? `balance-${orderId}` : "initial"}`;
  useEffect(() => {
    let active = true;
    pending.current = null;
    setPreview(null);
    setConfirmed(false);
    setStep(balance ? 2 : 1);
    if (!user) return;
    void callService<Setup>("purchaseCheckoutSetup", {})
      .then((s) => {
        if (active) setSetup(s);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    if (db)
      void getDocs(
        query(
          collection(db, "addresses"),
          where("ownerId", "==", user.uid),
          limit(20),
        ),
      )
        .then((s) => {
          if (active)
            setAddresses(
              s.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedAddress),
            );
        })
        .catch(() => {
          if (active)
            setError(
              "Chưa tải được địa chỉ đã lưu. Bạn vẫn có thể nhập địa chỉ mới.",
            );
        });
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) ?? "null");
      if (
        stored?.action === "commit" &&
        /^[0-9a-f-]{36}$/i.test(stored.operationId) &&
        /^[0-9a-f-]{36}$/i.test(stored.previewId) &&
        /^[a-f0-9]{64}$/.test(stored.previewHash) &&
        stored.confirmed === true
      ) {
        pending.current = stored;
        setError(
          "Có lần gửi thanh toán chưa rõ kết quả. Kiểm tra lại cùng lần đã gửi để tránh trùng.",
        );
      }
    } catch {
      setError(
        "Chưa đọc được lần gửi trước. Kiểm tra giỏ và lịch sử đơn trước khi tiếp tục.",
      );
    }
    return () => {
      active = false;
      generation.current++;
    };
  }, [user?.uid, key]);
  useEffect(() => {
    if (!balance && cart.activeCheckoutId)
      navigate(`/checkout/payment/${cart.activeCheckoutId}`, { replace: true });
  }, [cart.activeCheckoutId, navigate, balance]);
  useEffect(() => {
    if (preview && !balance && preview.cartRevision !== cart.revision) {
      setPreview(null);
      setConfirmed(false);
      setStep(1);
      setError("Giỏ đã đổi. Xem lại tổng quan trước khi thanh toán.");
    }
  }, [cart.revision, preview, balance]);
  useEffect(() => {
    if (!balance || !user) return;
    let active = true;
    void callService<{ version: number; balanceCheckoutId: string | null }>(
      "purchaseOrderRead",
      { orderId },
    )
      .then((order) => {
        if (!active) return null;
        if (order.balanceCheckoutId) {
          navigate(`/checkout/payment/${order.balanceCheckoutId}`, {
            replace: true,
          });
          return null;
        }
        return callService<Preview>("purchaseBalanceCheckout", {
          action: "preview",
          orderId,
          expectedVersion: order.version,
          operationId: crypto.randomUUID(),
        });
      })
      .then((p) => {
        if (active && p) {
          setPreview(p);
          setRecipient(p.recipient);
        }
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
    };
  }, [balance, orderId, user?.uid, navigate]);
  function edit(patch: Partial<CheckoutRecipient>) {
    setRecipient((r) => ({ ...r, ...patch }));
    setSaved("");
    setConfirmed(false);
    setPreview(null);
  }
  function freightInput(): ShippingQuoteInput | undefined {
    if (!weight.trim()) return undefined;
    if (!/^\d+(?:[.,]\d{1,3})?$/.test(weight) || !category)
      throw Error(
        "Chọn loại hàng và nhập cân nặng hợp lệ, hoặc để trống để chốt cước sau.",
      );
    const grams = Number(weight.replace(",", ".")) * 1000;
    if (!Number.isSafeInteger(grams) || grams <= 0 || grams > 1000000000)
      throw Error("Cân nặng cần lớn hơn 0, tối đa 3 số lẻ.");
    return {
      direction: "US_VN",
      warehouse,
      service:
        setup?.shipping?.rows.find(
          (r) =>
            r.id === category &&
            r.warehouse === warehouse &&
            r.direction === "US_VN",
        )?.service ?? "cargo",
      rowId: category,
      weightGrams: grams,
    };
  }
  async function overview() {
    if (flight.current || !user) return;
    setError("");
    const parsed = checkoutRecipientSchema.safeParse(recipient);
    if (!parsed.success) {
      setError(
        "Nhập người nhận, số điện thoại, tỉnh/thành, phường/xã và địa chỉ nhận hàng.",
      );
      heading.current?.focus();
      return;
    }
    let shipping;
    try {
      shipping = freightInput();
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    flight.current = true;
    setBusy(true);
    const request = ++generation.current;
    try {
      const p = await callService<Preview>("purchaseCheckout", {
        action: "preview",
        operationId: crypto.randomUUID(),
        expectedRevision: cart.revision,
        recipient: parsed.data,
        ...(shipping ? { shipping } : {}),
      });
      if (request !== generation.current) return;
      setPreview(p);
      setRecipient(p.recipient);
      setConfirmed(false);
      setStep(2);
      requestAnimationFrame(() => heading.current?.focus());
    } catch (e) {
      if (request === generation.current) setError((e as Error).message);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  }
  async function commit() {
    if (
      flight.current ||
      !user ||
      (!pending.current && (!preview || !confirmed))
    )
      return;
    setError("");
    const command = pending.current ?? {
      action: "commit" as const,
      operationId: crypto.randomUUID(),
      previewId: preview!.id,
      previewHash: preview!.previewHash,
      confirmed: true as const,
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(command));
    } catch {
      setError(
        "Trình duyệt chưa lưu được lần gửi để kiểm tra lại an toàn. Cho phép lưu phiên rồi thử lại.",
      );
      return;
    }
    pending.current = command;
    flight.current = true;
    setBusy(true);
    const request = generation.current;
    try {
      const result = admitPurchaseCheckoutAcknowledgement(
        await callService<unknown>(
          balance ? "purchaseBalanceCheckout" : "purchaseCheckout",
          command,
        ),
        command.previewId,
      );
      if (request !== generation.current) return;
      sessionStorage.removeItem(key);
      pending.current = null;
      await refresh();
      if (request !== generation.current) return;
      navigate(`/checkout/payment/${result.id}`);
    } catch (e) {
      if (request !== generation.current) return;
      const code = (e as { code?: string }).code ?? "";
      if (
        [
          "functions/aborted",
          "functions/failed-precondition",
          "functions/permission-denied",
          "functions/invalid-argument",
          "functions/already-exists",
        ].includes(code)
      ) {
        sessionStorage.removeItem(key);
        pending.current = null;
        setConfirmed(false);
        setPreview(null);
        if (!balance) setStep(1);
        setError((e as Error).message);
      } else
        setError(
          "Chưa rõ kết quả. Kiểm tra lại cùng lần đã gửi; không tạo thanh toán mới.",
        );
    } finally {
      flight.current = false;
      if (request === generation.current) setBusy(false);
    }
  }
  const province = setup?.regions.find(
      (p) => p.code === recipient.provinceCode,
    ),
    rows =
      setup?.shipping?.rows.filter(
        (r) => r.direction === "US_VN" && r.warehouse === warehouse,
      ) ?? [];
  if (!user)
    return (
      <section className="page purchaseCheckout">
        <h1>Hoàn tất đơn mua hộ</h1>
        <p>Đăng nhập để dùng giỏ và địa chỉ của bạn.</p>
        <button className="primary" onClick={signIn}>
          Đăng nhập để tiếp tục
        </button>
      </section>
    );
  return (
    <section className="page purchaseCheckout">
      <Link
        className="purchaseBack"
        to={balance ? `/account/orders/${orderId}` : "/cart"}
      >
        {balance ? "← Đơn hàng" : "← Giỏ hàng"}
      </Link>
      <header className="purchaseHeader">
        <h1 ref={heading} tabIndex={-1}>
          {balance
            ? "Duyệt khoản trả thêm"
            : step === 1
              ? "Thông tin nhận hàng"
              : "Tổng quan đơn hàng"}
        </h1>
        <p>
          {step === 1
            ? "Nhập địa chỉ nhận hàng, rồi xem tổng quan trước khi thanh toán."
            : "Kiểm tra món, địa chỉ, cước và số tiền. Xác nhận thông tin để chuyển sang thanh toán."}
        </p>
      </header>
      <PurchaseJourney current={step} />
      {error && (
        <div className="purchaseError" role="alert">
          <p>{error}</p>
          {pending.current && (
            <button disabled={busy} onClick={() => void commit()}>
              Kiểm tra lần đã gửi
            </button>
          )}
        </div>
      )}
      {cartLoading || (!setup && !error) || (balance && !preview && !error) ? (
        <LoadingState>Đang tải thông tin đơn mua…</LoadingState>
      ) : !balance && !cart.items.length ? (
        <p>
          Giỏ chưa có món. <Link to="/products">Chọn sản phẩm</Link> hoặc{" "}
          <Link to="/request">thêm món cần mua hộ</Link>.
        </p>
      ) : balance && !preview ? (
        <p>
          Chưa tải được khoản trả thêm.{" "}
          <button onClick={() => window.location.reload()}>Tải lại</button>
        </p>
      ) : (
        <div className="purchaseGrid">
          {step === 1 ? (
            <form
              className="purchaseCard recipientForm"
              onSubmit={(e) => {
                e.preventDefault();
                void overview();
              }}
              noValidate
            >
              <h2>Một địa chỉ cho các món đã chọn</h2>
              <label>
                Địa chỉ đã lưu
                <select
                  value={saved}
                  disabled={busy || Boolean(pending.current)}
                  onChange={(e) => {
                    setSaved(e.target.value);
                    const a = addresses.find((a) => a.id === e.target.value);
                    setRecipient(
                      a
                        ? {
                            ...blank,
                            recipient: a.recipient,
                            phone: a.phone ?? "",
                            street: a.address,
                            provinceCode: a.provinceCode ?? "",
                            communeCode: a.communeCode ?? "",
                            province:
                              setup?.regions.find(
                                (p) => p.code === a.provinceCode,
                              )?.name ?? "",
                            commune:
                              setup?.regions
                                .find((p) => p.code === a.provinceCode)
                                ?.communes.find((c) => c.code === a.communeCode)
                                ?.name ?? "",
                          }
                        : blank,
                    );
                    setConfirmed(false);
                    setPreview(null);
                  }}
                >
                  <option value="">Nhập địa chỉ mới</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.recipient} · {a.address}
                    </option>
                  ))}
                </select>
              </label>
              <p className="purchaseHint">
                Địa chỉ này dùng cho tất cả món bạn đã chọn.
              </p>
              <fieldset disabled={busy || Boolean(pending.current)}>
                <div className="purchaseFields">
                  <label>
                    Người nhận
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                    <input
                      autoComplete="shipping name"
                      value={recipient.recipient}
                      onChange={(e) => edit({ recipient: e.target.value })}
                      maxLength={120}
                      required
                    />
                  </label>
                  <label>
                    Số điện thoại
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                    <input
                      autoComplete="shipping tel"
                      type="tel"
                      value={recipient.phone}
                      onChange={(e) =>
                        edit({ phone: e.target.value.replace(/\s/g, "") })
                      }
                      maxLength={20}
                      required
                    />
                  </label>
                  <label>
                    Quốc gia
                    <input value="Việt Nam" readOnly />
                  </label>
                  <label>
                    Tỉnh / thành phố
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                    <select
                      required
                      value={recipient.provinceCode}
                      onChange={(e) => {
                        const p = setup?.regions.find(
                          (p) => p.code === e.target.value,
                        );
                        edit({
                          provinceCode: e.target.value,
                          province: p?.name ?? "",
                          communeCode: "",
                          commune: "",
                        });
                      }}
                    >
                      <option value="">Chọn tỉnh / thành phố</option>
                      {setup?.regions.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Phường / xã
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                    <select
                      required
                      disabled={!province}
                      value={recipient.communeCode}
                      onChange={(e) =>
                        edit({
                          communeCode: e.target.value,
                          commune:
                            province?.communes.find(
                              (c) => c.code === e.target.value,
                            )?.name ?? "",
                        })
                      }
                    >
                      <option value="">
                        {province
                          ? "Chọn phường / xã"
                          : "Chọn tỉnh / thành phố trước"}
                      </option>
                      {province?.communes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="purchaseWide">
                    Số nhà, đường, tòa nhà / căn hộ
                    <span className="requiredMark" aria-hidden="true">
                      *
                    </span>
                    <input
                      required
                      autoComplete="shipping street-address"
                      value={recipient.street}
                      onChange={(e) => edit({ street: e.target.value })}
                      maxLength={300}
                    />
                  </label>
                  <label className="purchaseWide">
                    Ghi chú giao hàng <small>Không bắt buộc</small>
                    <textarea
                      value={recipient.note}
                      onChange={(e) => edit({ note: e.target.value })}
                      maxLength={500}
                    />
                  </label>
                </div>
              </fieldset>
              {!setup?.regions.length && (
                <p role="status">
                  Danh mục khu vực chưa tải được.{" "}
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Tải lại
                  </button>
                </p>
              )}
              <button
                type="submit"
                className="primary"
                disabled={
                  busy ||
                  cached ||
                  Boolean(pending.current) ||
                  !setup?.regions.length
                }
              >
                Xem tổng quan →
              </button>
            </form>
          ) : (
            <section className="purchaseCard purchaseReview">
              <div className="purchaseSectionHeading">
                <div>
                  <h2>{balance ? "Món liên quan" : "Món đã chọn"}</h2>
                  <small>
                    {preview?.lines.length ?? 0} dòng ·{" "}
                    {preview?.lines.reduce((s, l) => s + l.quantity, 0) ?? 0}{" "}
                    món
                  </small>
                </div>
                <Link to={balance ? `/account/orders/${orderId}` : "/cart"}>
                  {balance ? "Xem đơn hàng" : "Sửa giỏ hàng"}
                </Link>
              </div>
              {preview?.lines.map((line) => (
                <div key={line.lineId} className="purchaseItem">
                  <PurchaseThumbnail
                    draftId={line.draftId}
                    itemIndex={line.itemIndex}
                    mediaId={line.mediaId}
                  />
                  <div>
                    <strong>{line.name}</strong>
                    <small>
                      {line.quantity} sản phẩm ·{" "}
                      {line.kind === "custom" ? "Cần tìm mua" : "Giá niêm yết"}
                    </small>
                  </div>
                  <strong>{money(line.total)}</strong>
                </div>
              ))}
              <div className="purchaseDelivery">
                <div className="purchaseSectionHeading">
                  <h3>Giao đến</h3>
                  {!balance && (
                    <button
                      type="button"
                      disabled={busy || Boolean(pending.current)}
                      onClick={() => {
                        setStep(1);
                        setConfirmed(false);
                        requestAnimationFrame(() => heading.current?.focus());
                      }}
                    >
                      Sửa địa chỉ
                    </button>
                  )}
                </div>
                <p>
                  {recipient.recipient} · {recipient.phone}
                  <br />
                  {recipient.street}, {recipient.commune}, {recipient.province},
                  Việt Nam
                </p>
              </div>
              {!balance && (
                <p className="purchaseTerms">
                  Giá niêm yết giữ trọn gói. Món cần tìm mua có thể phát sinh
                  giá và cước; bạn duyệt khoản trả thêm trước khi gửi.
                </p>
              )}
            </section>
          )}
          <aside className="purchaseCard purchaseSummary">
            <h2>Chi tiết thanh toán</h2>
            {preview ? (
              <>
                <div className="purchaseRow">
                  <span>
                    {balance ? "Đã thanh toán trước đó" : "Sản phẩm niêm yết"}
                  </span>
                  <strong>
                    {money(
                      balance ? (preview.previouslyPaid ?? 0) : preview.listed,
                    )}
                  </strong>
                </div>
                <div className="purchaseRow">
                  <span>
                    {balance ? "Khoản cần trả thêm" : "Giá hàng cần tìm mua"}
                  </span>
                  <strong>{money(preview.goods)}</strong>
                </div>
                {!balance && (
                  <div className="purchaseRow">
                    <span>Phí mua hộ</span>
                    <strong>{money(preview.service)}</strong>
                  </div>
                )}
                <div className="purchaseTotal">
                  <span>
                    {balance ? "Thanh toán thêm" : "Thanh toán ban đầu"}
                  </span>
                  <p>{money(preview.total)}</p>
                </div>
              </>
            ) : (
              <p className="purchaseHint">
                Số tiền được kiểm tra lại khi bạn xem tổng quan.
              </p>
            )}
            <p className="purchaseHint">
              {balance
                ? preview?.balanceReason === "sourcing"
                  ? "Khoản chênh lệch giá mua đã được bạn duyệt. Nhân viên chỉ mua vượt giá ban đầu khi đã đủ tiền; cước được chốt trước khi gửi."
                  : "Khoản này dựa trên chi phí cuối bạn đã duyệt. Nhân viên chỉ gửi hàng khi đủ tiền."
                : "100% giá hàng và phí mua hộ. Giá niêm yết đã gồm cước; món cần tìm mua chốt cước trước khi gửi."}
            </p>
            {!balance && cart.items.some((i) => i.kind === "custom") && (
              <section
                className="purchaseShipping"
                aria-labelledby="purchaseShippingHeading"
              >
                <div className="purchaseSectionHeading">
                  <h3 id="purchaseShippingHeading">Cước vận chuyển</h3>
                  <Link to="/fees">Biểu phí ↗</Link>
                </div>
                <div className="purchaseFreight">
                  <div>
                    <span>
                      Quốc tế dự tính
                      {preview?.shipping.state === "reference"
                        ? " · tham khảo"
                        : ""}{" "}
                      · chưa thu
                    </span>
                    <strong>
                      {preview?.shipping.amountUsdMinor !== undefined
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "USD",
                          }).format(preview.shipping.amountUsdMinor / 100)
                        : preview?.shipping.state === "quote_required"
                          ? "Cần báo giá"
                          : preview?.shipping.state === "unavailable"
                            ? "Chưa có cước"
                            : "Chưa tính"}
                    </strong>
                  </div>
                  <p>
                    {preview?.shipping.amountUsdMinor !== undefined
                      ? "Cước dự tính theo loại hàng và cân nặng đã nhập. Chưa gồm thông quan và giao nội địa."
                      : "Chưa biết cân nặng? Có thể chốt cước sau, trước khi gửi."}
                  </p>
                </div>
                <div className="purchaseRegion">
                  <div>
                    <span>Giao nội địa</span>
                    <strong>
                      {recipient.commune && recipient.province
                        ? `${recipient.commune}, ${recipient.province}`
                        : "Chọn địa chỉ ở bước Nhận hàng"}
                    </strong>
                  </div>
                  <small>Phí cần xác nhận</small>
                </div>
                <details>
                  <summary>Xem / điều chỉnh cước</summary>
                  <fieldset disabled={busy || Boolean(pending.current)}>
                    <label>
                      Kho xuất gửi
                      <select
                        value={warehouse}
                        onChange={(e) => {
                          setWarehouse(e.target.value as typeof warehouse);
                          setCategory("");
                          setConfirmed(false);
                          setPreview(null);
                          setStep(1);
                        }}
                      >
                        <option value="texas_cali">Texas / California</option>
                        <option value="oregon">Oregon</option>
                      </select>
                    </label>
                    <label>
                      Loại hàng để ước tính
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setConfirmed(false);
                          setPreview(null);
                          setStep(1);
                        }}
                      >
                        <option value="">Chọn loại hàng</option>
                        {rows.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tổng cân nặng dự kiến (kg)
                      <input
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => {
                          setWeight(e.target.value);
                          setConfirmed(false);
                          setPreview(null);
                          setStep(1);
                        }}
                        placeholder="Ví dụ: 1,5"
                        maxLength={12}
                      />
                    </label>
                  </fieldset>
                  <p className="purchaseHint">
                    Cước tối thiểu 1 kg; hàng cồng kềnh dùng cân quy đổi khi cao
                    hơn cân thực. Nhân viên xác nhận loại hàng, cân nặng, thuế,
                    bảo hiểm và cước giao nội địa trước khi bạn duyệt khoản trả
                    thêm.
                    {setup?.shippingOrigin === "reference"
                      ? " Biểu phí đang hiển thị là dữ liệu tham khảo, chưa phải giá đã công bố."
                      : ""}
                  </p>
                </details>
              </section>
            )}
            {step === 2 && preview && (
              <div className="purchaseConfirm">
                <label>
                  <input
                    type="checkbox"
                    checked={confirmed}
                    disabled={busy || Boolean(pending.current)}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span>
                    Tôi đã kiểm tra món, địa chỉ và số tiền cần thanh toán{" "}
                    {balance ? "thêm" : "ban đầu"}.
                  </span>
                </label>
                <div className="purchaseActions">
                  <button
                    type="button"
                    disabled={busy || Boolean(pending.current)}
                    onClick={() => {
                      if (balance) navigate(`/account/orders/${orderId}`);
                      else {
                        setStep(1);
                        setConfirmed(false);
                      }
                    }}
                  >
                    Quay lại
                  </button>
                  <button
                    className="primary"
                    disabled={busy || !confirmed || Boolean(pending.current)}
                    onClick={() => void commit()}
                  >
                    {busy ? "Đang xử lý…" : "Xác nhận & thanh toán"}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
