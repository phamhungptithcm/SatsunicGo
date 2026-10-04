import { notify } from "../../shared/feedback";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { requestSchema } from "../../../packages/domain";
import { importItemsCsv } from "../../../packages/domain/csv";
import { doc, getDoc } from "firebase/firestore";
import { configured, db, sendCommand } from "../../shared/firebase";
type Item = {
  name: string;
  url: string;
  quantity: number;
  variant: string;
  condition?: "new" | "used" | "any";
};
export function RequestForm({
  user,
  signIn,
}: {
  user: User | null;
  signIn: () => Promise<void>;
}) {
  const location = useLocation();
  const draftKey = `request-draft:${user?.uid ?? "anonymous"}`;
  function readDraft() {
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
  }
  const initial = readDraft();
  const navigate = useNavigate(),
    [items, setItems] = useState<Item[]>(
      initial?.items.map((i) => ({ ...i, url: i.url ?? "" })) ?? [
        {
          name: sessionStorage.getItem("request-name") ?? "",
          url: "",
          quantity: 1,
          variant: "",
        },
      ],
    ),
    [market, setMarket] = useState<"US" | "JP" | "KR">(initial?.market ?? "US"),
    [notes, setNotes] = useState(initial?.notes ?? ""),
    [preferredStore, setPreferredStore] = useState(
      initial?.preferredStore ?? "",
    ),
    [budget, setBudget] = useState(initial?.budget?.toString() ?? ""),
    [desiredBy, setDesiredBy] = useState(
      initial?.desiredAt
        ? new Date(initial.desiredAt).toISOString().slice(0, 10)
        : "",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    sessionStorage.setItem(
      draftKey,
      JSON.stringify({
        market,
        items,
        notes,
        preferredStore,
        ...(budget ? { budget: Number(budget) } : {}),
        ...(desiredBy ? { desiredAt: new Date(desiredBy).getTime() } : {}),
      }),
    );
    if (user) sessionStorage.removeItem("request-draft:anonymous");
  }, [draftKey, market, items, notes, preferredStore, budget, desiredBy, user]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("reorder");
    if (!id || !user || !db) return;
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) {
      setError("Mã đặt lại không hợp lệ.");
      return;
    }
    let active = true;
    void getDoc(doc(db, "orders", id))
      .then((snapshot) => {
        if (!active) return;
        const data = snapshot.data();
        if (!data || data.ownerId !== user.uid) throw Error("NOT_FOUND");
        const old = requestSchema.parse({
          market: data.market,
          items: data.items.filter((i: Item) => i.quantity > 0),
          notes: data.notes,
        });
        setMarket(old.market);
        setItems(old.items.map((i) => ({ ...i, url: i.url ?? "" })));
        setNotes(old.notes);
      })
      .catch(() => {
        if (active)
          setError("Chưa tải được đơn để đặt lại. Bạn có thể tạo yêu cầu mới.");
      });
    return () => {
      active = false;
    };
  }, [location.search, user]);
  function edit(index: number, key: keyof Item, value: string | number) {
    setItems((current) =>
      current.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
    if (index === 0 && key === "name")
      sessionStorage.setItem("request-name", String(value));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const p = requestSchema.safeParse({
      market,
      items,
      notes,
      preferredStore,
      ...(budget ? { budget: Number(budget) } : {}),
      ...(desiredBy ? { desiredAt: new Date(desiredBy).getTime() } : {}),
    });
    if (!p.success) {
      setError("Kiểm tra tên, link và số lượng trong từng dòng.");
      return;
    }
    if (!user) {
      await signIn();
      return;
    }
    const pendingKey = `request-pending:${user.uid}`;
    const serialized = JSON.stringify(p.data);
    let operationId = crypto.randomUUID();
    try {
      const pending = JSON.parse(sessionStorage.getItem(pendingKey) ?? "null");
      if (pending && pending.payload !== serialized) {
        setError(
          "Lần gửi trước chưa rõ kết quả. Kiểm tra Đơn của tôi trước khi sửa yêu cầu; gửi lại đúng nội dung cũ sẽ dùng cùng mã thao tác.",
        );
        return;
      }
      if (pending && /^[a-f0-9-]{36}$/i.test(pending.operationId))
        operationId = pending.operationId;
    } catch {
      setError(
        "Chưa đọc được trạng thái lần gửi trước. Kiểm tra Đơn của tôi trước khi tiếp tục.",
      );
      return;
    }
    sessionStorage.setItem(
      pendingKey,
      JSON.stringify({ operationId, payload: serialized }),
    );
    setBusy(true);
    try {
      const r = await sendCommand(
        "submitRequest",
        p.data,
        undefined,
        undefined,
        operationId,
      );
      sessionStorage.removeItem(pendingKey);
      sessionStorage.removeItem("request-name");
      sessionStorage.removeItem(draftKey);
      notify(
        "Đã gửi yêu cầu mua hộ. Bạn có thể theo dõi trong đơn hàng.",
        "success",
      );
      navigate(`/account/orders/${r.id}`);
    } catch (e) {
      if (
        [
          "functions/invalid-argument",
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/failed-precondition",
        ].includes((e as { code?: string }).code ?? "")
      )
        sessionStorage.removeItem(pendingKey);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page requestPage">
      <div>
        <Link className="back" to="/">
          Trang chủ
        </Link>
        <h1>Bạn muốn mua gì?</h1>
        <p>
          Chưa cần thanh toán. Nhân viên xác minh sản phẩm và gửi báo giá để bạn
          duyệt.
        </p>
        <p className="quietNote">
          Một yêu cầu cho một quốc gia nguồn. Hàng khác quốc gia cần yêu cầu
          riêng.
        </p>
        <label className="csvImport">
          Nhập dòng hàng CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (f.size > 50000) throw Error("CSV_TOO_LARGE");
                setItems(
                  importItemsCsv(await f.text()).map((item) => ({
                    ...item,
                    url: item.url ?? "",
                  })),
                );
                setError("");
              } catch {
                setError(
                  "CSV cần cột name,url,quantity,variant và tối đa 30 dòng hàng.",
                );
              }
              e.target.value = "";
            }}
          />
        </label>
        <p className="smallNote">
          CSV tối đa 50 KB. Không cần link nếu đã có tên sản phẩm.
        </p>
      </div>
      <form className="panel form" onSubmit={(e) => void submit(e)}>
        <fieldset>
          <legend>Quốc gia mua hàng</legend>
          <div className="segmented">
            {(["US", "JP", "KR"] as const).map((c) => (
              <button
                type="button"
                aria-pressed={market === c}
                key={c}
                onClick={() => setMarket(c)}
              >
                {c === "US" ? "Mỹ" : c === "JP" ? "Nhật Bản" : "Hàn Quốc"}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Cửa hàng mong muốn · không bắt buộc
          <input
            maxLength={160}
            value={preferredStore}
            onChange={(e) => setPreferredStore(e.target.value)}
          />
        </label>
        <label>
          Ngân sách dự kiến (₫) · không bắt buộc
          <input
            type="number"
            min={0}
            max={1000000000000}
            step={1}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <label>
          Ngày mong muốn · cần nhân viên xác nhận, chưa phải cam kết giao
          <input
            type="date"
            value={desiredBy}
            onChange={(e) => setDesiredBy(e.target.value)}
          />
        </label>
        {items.map((r, i) => (
          <fieldset key={i} className="itemForm">
            <legend>Sản phẩm {i + 1}</legend>
            <label>
              Tên sản phẩm
              <input
                required
                minLength={2}
                maxLength={200}
                value={r.name}
                onChange={(e) => edit(i, "name", e.target.value)}
              />
            </label>
            <label>
              Link tham khảo · không bắt buộc
              <input
                type="url"
                value={r.url}
                onChange={(e) => edit(i, "url", e.target.value)}
              />
            </label>
            <label>
              Tình trạng mong muốn
              <select
                value={r.condition ?? ""}
                onChange={(e) =>
                  setItems((current) =>
                    current.map((item, line) =>
                      line === i
                        ? {
                            ...item,
                            condition: e.target.value
                              ? (e.target.value as Item["condition"])
                              : undefined,
                          }
                        : item,
                    ),
                  )
                }
              >
                <option value="">Chưa xác định</option>
                <option value="new">Hàng mới</option>
                <option value="used">Hàng đã qua sử dụng</option>
                <option value="any">Có thể xem cả hai</option>
              </select>
            </label>
            <div className="twoCols">
              <label>
                Số lượng
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={r.quantity}
                  onChange={(e) => edit(i, "quantity", Number(e.target.value))}
                />
              </label>
              <label>
                Size, màu, model
                <input
                  maxLength={200}
                  value={r.variant}
                  onChange={(e) => edit(i, "variant", e.target.value)}
                />
              </label>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="textbutton"
                onClick={() =>
                  setItems((current) => current.filter((_, n) => n !== i))
                }
              >
                Bỏ sản phẩm {i + 1}
              </button>
            )}
          </fieldset>
        ))}
        <button
          type="button"
          disabled={items.length >= 30}
          onClick={() =>
            setItems((current) => [
              ...current,
              { name: "", url: "", quantity: 1, variant: "" },
            ])
          }
        >
          Thêm sản phẩm
        </button>
        <label>
          Ghi chú
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            placeholder="Ngân sách, cửa hàng mong muốn, thông tin cần làm rõ…"
          />
        </label>
        {!configured && (
          <p className="notice">
            Chức năng gửi yêu cầu chưa được kích hoạt. Bạn có thể soạn trước tên
            sản phẩm.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={!configured || busy}>
          {busy
            ? "Đang gửi…"
            : user
              ? "Gửi yêu cầu"
              : "Đăng nhập để gửi yêu cầu"}
        </button>
      </form>
    </section>
  );
}
