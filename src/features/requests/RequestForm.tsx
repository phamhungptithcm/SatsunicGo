import { notify } from "../../shared/feedback";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { requestSchema } from "../../../packages/domain";
import {
  normalizeRequestInput,
  requestInputText,
} from "../../../packages/domain/request-input";
import { importItemsCsv } from "../../../packages/domain/csv";
import { doc, getDoc } from "firebase/firestore";
import {
  configured,
  db,
  sendCommand,
  callService,
} from "../../shared/firebase";
import {
  ProductComposer,
  anonymousImageHandoff,
  type RequestImage,
} from "./ProductComposer";
type Item = {
  content: string;
  quantity: number;
  variant: string;
  condition?: "new" | "used" | "any";
};
type Attempt = {
  operationId: string;
  payload: string;
  orderId?: string;
  images: { hash: string; operationId: string; uploaded: boolean }[];
};
function pendingFor(uid?: string): Attempt | null {
  if (!uid) return null;
  try {
    const x = JSON.parse(
      sessionStorage.getItem(`request-pending:${uid}`) ?? "null",
    );
    return x &&
      typeof x.payload === "string" &&
      /^[a-f0-9-]{36}$/i.test(x.operationId)
      ? { ...x, images: x.images ?? [] }
      : null;
  } catch {
    return null;
  }
}
export function RequestForm({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => Promise<void>;
}) {
  const location = useLocation(),
    navigate = useNavigate(),
    draftKey = `request-draft:${user?.uid ?? "anonymous"}`;
  const [initial] = useState(() => {
    try {
      return requestSchema.parse(
        JSON.parse(
          (new URLSearchParams(location.search).get("from") === "ask"
            ? sessionStorage.getItem("request-draft:anonymous")
            : sessionStorage.getItem(draftKey)) ??
            sessionStorage.getItem("request-draft:anonymous") ??
            "null",
        ),
      );
    } catch {
      return null;
    }
  });
  const [items, setItems] = useState<Item[]>(
    initial?.items.map((i) => ({ ...i, content: requestInputText(i) })) ?? [
      {
        content: sessionStorage.getItem("request-name") ?? "",
        quantity: 1,
        variant: "",
      },
    ],
  );
  const [market, setMarket] = useState<"US" | "JP" | "KR">(
      initial?.market ?? "US",
    ),
    [notes, setNotes] = useState(initial?.notes ?? ""),
    [preferredStore, setPreferredStore] = useState(
      initial?.preferredStore ?? "",
    ),
    [budget, setBudget] = useState(initial?.budget?.toString() ?? ""),
    [desiredBy, setDesiredBy] = useState(
      initial?.desiredAt
        ? new Date(initial.desiredAt).toISOString().slice(0, 10)
        : "",
    );
  const [images, setImages] = useState<RequestImage[]>(() => {
    if (user) {
      const files = anonymousImageHandoff.images;
      return files;
    }
    return [];
  });
  useEffect(() => {
    if (user) anonymousImageHandoff.images = [];
  }, [user?.uid]);
  const [pendingUnreadable] = useState(() => {
    try {
      return Boolean(
        user &&
        sessionStorage.getItem(`request-pending:${user.uid}`) &&
        !pendingFor(user.uid),
      );
    } catch {
      return true;
    }
  });
  const [imageReading, setImageReading] = useState(false);
  const [prefillOffered, setPrefillOffered] = useState(
    Boolean(initial && new URLSearchParams(location.search).get("name")),
  );
  const [attempt, setAttempt] = useState<Attempt | null>(() =>
      pendingFor(user?.uid),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const mounted = useRef(true),
    locked = useRef(false);
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const frozen = busy || imageReading || Boolean(attempt && !attempt.orderId);
  function payload() {
    return {
      market,
      items: items.map((i, n) => ({
        ...normalizeRequestInput(
          i.content,
          images.some((image) => (image.line ?? 0) === n),
        ),
        quantity: i.quantity,
        variant: i.variant,
        ...(i.condition ? { condition: i.condition } : {}),
      })),
      notes,
      preferredStore,
      ...(budget ? { budget: Number(budget) } : {}),
      ...(desiredBy ? { desiredAt: new Date(desiredBy).getTime() } : {}),
    };
  }
  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(payload()));
      if (user) sessionStorage.removeItem("request-draft:anonymous");
    } catch {
      setError("Chưa lưu được bản nháp trên trình duyệt này.");
    }
  }, [
    draftKey,
    market,
    items,
    notes,
    preferredStore,
    budget,
    desiredBy,
    user,
    images.length,
  ]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("reorder");
    if (!id || !user || !db || attempt) return;
    let active = true;
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) {
      setError("Mã đặt lại không hợp lệ.");
      return;
    }
    void getDoc(doc(db, "orders", id))
      .then((s) => {
        if (!active) return;
        const d = s.data();
        if (!d || d.ownerId !== user.uid) throw Error();
        const old = requestSchema.parse({
          market: d.market,
          items: d.items.filter((i: { quantity: number }) => i.quantity > 0),
          notes: d.notes,
        });
        setMarket(old.market);
        setItems(
          old.items.map((i) => ({ ...i, content: requestInputText(i) })),
        );
        setNotes(old.notes);
      })
      .catch(() => {
        if (active)
          setError("Chưa tải được đơn để đặt lại. Bạn có thể tạo yêu cầu mới.");
      });
    return () => {
      active = false;
    };
  }, [location.search, user?.uid]);
  function applyProductPrefill() {
    const query = new URLSearchParams(location.search);
    const name = query.get("name"),
      url = query.get("url"),
      source = query.get("market");
    if (attempt || (!name && !url)) return;
    setItems([
      {
        content: [name?.slice(0, 200), url?.slice(0, 2048)]
          .filter(Boolean)
          .join("\n"),
        quantity: 1,
        variant: "",
      },
    ]);
    if (source === "US" || source === "JP" || source === "KR")
      setMarket(source);
    setNotes("");
    setImages([]);
    setPreferredStore("");
    setBudget("");
    setDesiredBy("");
    setPrefillOffered(false);
  }
  useEffect(() => {
    if (!initial) applyProductPrefill();
  }, [location.search]);
  function edit(index: number, patch: Partial<Item>) {
    setItems((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }
  function remember(next: Attempt) {
    attemptRef.current = next;
    setAttempt(next);
    sessionStorage.setItem(
      `request-pending:${user!.uid}`,
      JSON.stringify(next),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (locked.current || imageReading || pendingUnreadable) return;
    setError("");
    let next = attemptRef.current;
    if (!next) {
      let candidate;
      try {
        candidate = requestSchema.safeParse(payload());
      } catch {
        setError("Kiểm tra link sản phẩm.");
        return;
      }
      if (!candidate.success) {
        setError("Nhập tên, link hoặc thêm ảnh; kiểm tra số lượng từng món.");
        return;
      }
      if (!user) {
        anonymousImageHandoff.images = images;
        locked.current = true;
        setBusy(true);
        try {
          await signIn();
        } finally {
          locked.current = false;
          if (mounted.current) setBusy(false);
        }
        return;
      }
      next = {
        operationId: crypto.randomUUID(),
        payload: JSON.stringify(candidate.data),
        images: images.map((x) => ({
          hash: x.hash,
          operationId: x.id,
          uploaded: false,
        })),
      };
    }
    if (!user) return;
    locked.current = true;
    setBusy(true);
    try {
      remember(next);
      if (!next.orderId) {
        const result = await sendCommand(
          "submitRequest",
          JSON.parse(next.payload),
          undefined,
          undefined,
          next.operationId,
        );
        if (!mounted.current) return;
        next = { ...next, orderId: result.id };
        remember(next);
      }
      for (let index = 0; index < next.images.length; index++) {
        const imageState = next.images[index];
        if (imageState.uploaded) continue;
        const image = images.find((x) => x.hash === imageState.hash);
        if (!image)
          throw Error(
            "Yêu cầu đã lưu. Thêm lại ảnh đã chọn để tiếp tục tải ảnh lên, hoặc xem đơn để bổ sung sau.",
          );
        await callService("uploadOrderImage", {
          orderId: next.orderId,
          kind: "request",
          operationId: imageState.operationId,
          mime: image.mime,
          base64: image.base64,
          description: "Ảnh tham khảo sản phẩm",
        });
        if (!mounted.current) return;
        next = {
          ...next,
          images: next.images.map((x, n) =>
            n === index ? { ...x, uploaded: true } : x,
          ),
        };
        remember(next);
      }
      sessionStorage.removeItem(`request-pending:${user.uid}`);
      sessionStorage.removeItem(draftKey);
      sessionStorage.removeItem("request-name");
      notify("Đã gửi yêu cầu mua hộ.", "success");
      navigate(`/account/orders/${next.orderId}`);
    } catch (e) {
      if (!mounted.current) return;
      const code = (e as { code?: string }).code;
      if (
        !next.orderId &&
        [
          "functions/invalid-argument",
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/failed-precondition",
        ].includes(code ?? "")
      ) {
        sessionStorage.removeItem(`request-pending:${user.uid}`);
        setAttempt(null);
        attemptRef.current = null;
      }
      setError(
        next.orderId
          ? `Yêu cầu đã lưu, ảnh chưa tải đủ. ${(e as Error).message}`
          : "Chưa rõ kết quả gửi. Giữ nội dung và thử lại để tránh tạo trùng.",
      );
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="page quickRequestPage">
      <h1>Bạn muốn mua gì?</h1>
      <p>
        Dành cho sản phẩm chưa có trong danh mục. Nhân viên xem xét và báo giá;
        bạn thanh toán hai đợt sau khi chấp nhận.
      </p>
      <p>
        <a href="/products">Xem sản phẩm có giá niêm yết</a> để chọn mua và
        thanh toán toàn bộ ngay.
      </p>
      <form onSubmit={(e) => void submit(e)} className="quickRequestForm">
        {prefillOffered && (
          <button
            type="button"
            className="textbutton"
            disabled={frozen || Boolean(attempt)}
            onClick={applyProductPrefill}
          >
            Thay bản nháp bằng sản phẩm đang xem
          </button>
        )}
        <div
          className="requestMarkets"
          role="group"
          aria-label="Quốc gia mua hàng"
        >
          {(["US", "JP", "KR"] as const).map((c) => (
            <button
              type="button"
              key={c}
              aria-pressed={market === c}
              disabled={frozen || Boolean(attempt?.orderId)}
              onClick={() => setMarket(c)}
            >
              {c === "US" ? "Mỹ" : c === "JP" ? "Nhật Bản" : "Hàn Quốc"}
            </button>
          ))}
        </div>
        <div className="requestProducts">
          <h2>Món hàng</h2>
          {items.map((item, index) => (
            <div className="requestItem" key={index}>
              {items.length > 1 && <h3>Món {index + 1}</h3>}
              <p className="requestFieldLabel">Tên hoặc link sản phẩm</p>
              <ProductComposer
                value={item.content}
                onChange={(content) => edit(index, { content })}
                images={images.filter((image) => (image.line ?? 0) === index)}
                onImages={(next) =>
                  setImages((current) => [
                    ...current.filter((image) => (image.line ?? 0) !== index),
                    ...next.map((image) => ({ ...image, line: index })),
                  ])
                }
                onReadingChange={setImageReading}
                limit={
                  6 -
                  images.filter((image) => (image.line ?? 0) !== index).length
                }
                disabled={frozen || imageReading}
                readOnly={Boolean(attempt)}
              />
              <button
                type="button"
                className="requestRemove requestRemoveIcon"
                disabled={frozen || Boolean(attempt)}
                onClick={() => {
                  if (frozen || attempt) return;
                  setItems((rows) =>
                    rows.length === 1
                      ? [{ content: "", quantity: 1, variant: "" }]
                      : rows.filter((_, n) => n !== index),
                  );
                  setImages((current) =>
                    current
                      .filter((image) => (image.line ?? 0) !== index)
                      .map((image) => ({
                        ...image,
                        line:
                          (image.line ?? 0) > index
                            ? (image.line ?? 0) - 1
                            : image.line,
                      })),
                  );
                }}
                aria-label={
                  items.length === 1
                    ? "Xóa nội dung món hàng"
                    : `Bỏ món ${index + 1}`
                }
                title={
                  items.length === 1
                    ? "Xóa nội dung món hàng"
                    : `Bỏ món ${index + 1}`
                }
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                </svg>
              </button>
              <p className="requestImageHint">
                PNG, JPEG hoặc WebP · Tối đa 2 MB mỗi ảnh, 6 ảnh mỗi yêu cầu
              </p>
              <div className="itemOptions">
                <div className="twoCols">
                  <label>
                    Số lượng
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={item.quantity}
                      disabled={frozen || Boolean(attempt?.orderId)}
                      onChange={(e) =>
                        edit(index, { quantity: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Mẫu, màu, kích cỡ
                    <input
                      maxLength={200}
                      value={item.variant}
                      disabled={frozen || Boolean(attempt?.orderId)}
                      onChange={(e) => edit(index, { variant: e.target.value })}
                    />
                  </label>
                  <label>
                    Tình trạng
                    <select
                      value={item.condition ?? ""}
                      disabled={frozen || Boolean(attempt?.orderId)}
                      onChange={(e) =>
                        edit(index, {
                          condition: (e.target.value ||
                            undefined) as Item["condition"],
                        })
                      }
                    >
                      <option value="">Chưa xác định</option>
                      <option value="new">Hàng mới</option>
                      <option value="used">Hàng đã qua sử dụng</option>
                      <option value="any">Có thể xem cả hai</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="textbutton"
            disabled={items.length >= 30 || frozen || Boolean(attempt?.orderId)}
            onClick={() =>
              setItems((rows) => [
                ...rows,
                { content: "", quantity: 1, variant: "" },
              ])
            }
          >
            ＋ Thêm món
          </button>
          {!configured && (
            <p role="status">Chức năng gửi chưa được kích hoạt.</p>
          )}
          {attempt?.orderId && (
            <p className="requestRecovery" role="status">
              Yêu cầu đã lưu. {attempt.images.filter((x) => x.uploaded).length}/
              {attempt.images.length} ảnh đã tải.{" "}
              <Link to={`/account/orders/${attempt.orderId}`}>
                Xem đơn để bổ sung ảnh sau
              </Link>
            </p>
          )}
          {pendingUnreadable && (
            <p className="error" role="alert">
              Chưa đọc được lần gửi trước.{" "}
              <Link to="/account">Kiểm tra đơn của bạn</Link> trước khi tiếp
              tục.
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button
            className="primary requestSubmit"
            disabled={!configured || busy || imageReading || pendingUnreadable}
          >
            {busy
              ? "Đang gửi…"
              : attempt?.orderId
                ? "Tiếp tục tải ảnh"
                : attempt
                  ? "Thử gửi lại"
                  : user
                    ? "Gửi yêu cầu →"
                    : "Đăng nhập để gửi →"}
          </button>
        </div>
        <aside
          className="requestInformation"
          aria-labelledby="request-information-title"
        >
          <h2 id="request-information-title">Thông tin thêm</h2>
          <p className="requestOptional">Không bắt buộc</p>
          <div className="requestExtras">
            <label>
              Ghi chú
              <textarea
                value={notes}
                maxLength={2000}
                disabled={frozen || Boolean(attempt?.orderId)}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label>
              Cửa hàng
              <input
                maxLength={160}
                value={preferredStore}
                disabled={frozen || Boolean(attempt?.orderId)}
                onChange={(e) => setPreferredStore(e.target.value)}
              />
            </label>
            <label>
              Ngân sách dự kiến (₫)
              <input
                type="number"
                min={0}
                max={1000000000000}
                value={budget}
                disabled={frozen || Boolean(attempt?.orderId)}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <label>
              Ngày mong muốn
              <input
                type="date"
                value={desiredBy}
                disabled={frozen || Boolean(attempt?.orderId)}
                onChange={(e) => setDesiredBy(e.target.value)}
              />
              <small>Cần nhân viên xác nhận.</small>
            </label>
            <details className="requestCsv">
              <summary>Nhập nhiều món bằng CSV</summary>
              <label>
                Nhập CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={frozen || Boolean(attempt?.orderId)}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try {
                      if (f.size > 50000) throw Error();
                      setItems(
                        importItemsCsv(await f.text()).map((i) => ({
                          ...i,
                          content: requestInputText(i),
                        })),
                      );
                      setError("");
                    } catch {
                      setError(
                        "CSV tối đa 50 KB, 30 dòng; cần cột name,url,quantity,variant.",
                      );
                    }
                  }}
                />
              </label>
            </details>
          </div>
        </aside>
      </form>
    </section>
  );
}
