import {
  CrmHeading,
  CrmIcon,
  CrmReference,
  CrmState,
} from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ReminderSettings } from "./ReminderSettings";
import { callService } from "../../shared/firebase";
type Plan = {
  id: string;
  version: number;
  name: string;
  price: number;
  periodDays: number;
  serviceDiscountBps: number;
  discountCap: number;
  status: string;
};
const giftUidMessage =
  "Kiểm tra mã khách hàng: dùng 1–128 ký tự A–Z, a–z, 0–9 hoặc dấu gạch ngang (-).";
export function PlanEditor() {
  const pending = useRef<{
    service: string;
    command: Record<string, unknown>;
    success: string;
  } | null>(null);
  const sending = useRef(false),
    mounted = useRef(false),
    request = useRef(0),
    committedPageAfter = useRef<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]),
    [next, setNext] = useState<string | null>(null),
    [firstPage, setFirstPage] = useState(true),
    [chosenPlan, setChosenPlan] = useState(""),
    [giftUidError, setGiftUidError] = useState(""),
    [selected, setSelected] = useState<Plan | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState(false),
    [loading, setLoading] = useState(false),
    [ready, setReady] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const editor = useRef<HTMLDetailsElement>(null);
  function openEditor() {
    setEditing(true);
    requestAnimationFrame(() => {
      const summary = editor.current?.querySelector("summary");
      if (!summary) return;
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
  }
  async function load(after: string | null = committedPageAfter.current) {
    const token = ++request.current;
    setLoading(true);
    setReady(false);
    setError("");
    try {
      const r = await callService<{ rows: Plan[]; next: string | null }>(
        "listWork",
        {
          kind: "membershipPlans",
          ...(after ? { after } : {}),
        },
      );
      if (mounted.current && token === request.current) {
        committedPageAfter.current = after;
        setFirstPage(after === null);
        setPlans(r.rows);
        setNext(r.next);
        setChosenPlan((current) =>
          r.rows.some((p) => p.id === current && p.status === "published")
            ? current
            : "",
        );
        setReady(true);
      }
    } catch {
      if (mounted.current && token === request.current) {
        setPlans([]);
        setNext(null);
        setChosenPlan("");
        setError("Chưa tải được gói membership.");
      }
    } finally {
      if (mounted.current && token === request.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load(null);
    return () => {
      mounted.current = false;
      request.current++;
    };
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || uncertain || sending.current) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    pending.current = {
      service: "workspaceCommand",
      success: "Đã lưu gói. Quyền lợi đã chốt trong báo giá cũ giữ nguyên.",
      command: {
        action: "saveMembershipPlan",
        operationId: crypto.randomUUID(),
        ...(selected
          ? { id: selected.id, expectedVersion: selected.version }
          : {}),
        payload: {
          name: String(f.get("name")),
          price: Number(f.get("price")),
          periodDays: Number(f.get("days")),
          serviceDiscountBps: Number(f.get("bps")),
          discountCap: Number(f.get("cap")),
          status: String(f.get("status")),
        },
      },
    };
    await executeSave();
  }
  async function grant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || uncertain || sending.current || loading) return;
    const f = new FormData(e.currentTarget);
    const ownerId = String(f.get("uid"));
    if (!/^[a-zA-Z0-9-]{1,128}$/.test(ownerId)) {
      setGiftUidError(giftUidMessage);
      return;
    }
    setGiftUidError("");
    pending.current = {
      service: "membershipCommand",
      success: "Đã cấp tặng và ghi lịch sử membership.",
      command: {
        action: "grant",
        operationId: crypto.randomUUID(),
        ownerId,
        planId: String(f.get("plan")),
        reason: String(f.get("reason")),
      },
    };
    await executeSave();
  }
  async function executeSave() {
    if (!pending.current || sending.current) return;
    const attempt = pending.current;
    sending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callService(attempt.service, attempt.command);
      if (!mounted.current) return;
      pending.current = null;
      setUncertain(false);
      setMessage(attempt.success);
      if (attempt.command.action === "saveMembershipPlan") {
        setSelected(null);
        setEditing(false);
        await load();
      }
    } catch (cause) {
      if (!mounted.current) return;
      const code = String((cause as { code?: string })?.code ?? "").replace(
        /^functions\//,
        "",
      );
      const rejected =
        (code === "aborted" && attempt.service === "workspaceCommand") ||
        [
          "invalid-argument",
          "permission-denied",
          "unauthenticated",
          "failed-precondition",
          "not-found",
          "already-exists",
        ].includes(code);
      if (rejected) pending.current = null;
      setUncertain(!rejected);
      setError(
        rejected
          ? "Chưa lưu được. Kiểm tra tài khoản, gói, phiên bản và xác thực hai lớp gần đây."
          : "Chưa xác nhận được kết quả. Thử lại thao tác đang chờ với thông tin đang được giữ nguyên.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section>
      <CrmHeading
        title="Cấu hình và cấp tặng membership"
        description="Quản lý giá, kỳ hạn và quyền lợi của từng gói."
      />
      <button
        disabled={busy || uncertain}
        onClick={() => {
          setSelected(null);
          openEditor();
        }}
      >
        <CrmIcon name="document" />
        Gói mới
      </button>
      <div className="crmActions">
        <button
          disabled={busy || uncertain || loading}
          onClick={() => void load()}
        >
          Tải lại
        </button>
        {!firstPage && (
          <button
            disabled={busy || uncertain || loading}
            onClick={() => void load(null)}
          >
            Trang đầu
          </button>
        )}
        {next && (
          <button
            disabled={busy || uncertain || loading}
            onClick={() => void load(next)}
          >
            Trang tiếp theo
          </button>
        )}
      </div>
      {loading && <CrmState kind="loading" title="Đang tải gói thành viên…" />}
      {ready && !plans.length && (
        <CrmState
          kind="empty"
          title="Chưa có gói thành viên trong trang này."
        />
      )}
      <div
        className="crmList crmEditorList"
        role="region"
        aria-label="Danh sách gói thành viên"
        tabIndex={0}
      >
        {plans.map((p) => (
          <article key={p.id} className="crmItem">
            <div className="crmItemMain">
              <h3 className="crmItemTitle">{p.name}</h3>
              <span className="crmBadge">
                {p.status === "published"
                  ? "Đang mở bán"
                  : p.status === "draft"
                    ? "Bản nháp"
                    : p.status === "archived"
                      ? "Đã lưu trữ"
                      : "Trạng thái chưa xác định"}
              </span>
              <p className="crmItemMeta">
                Giá trả trước: {p.price.toLocaleString("vi-VN")} ₫ · Kỳ hạn:{" "}
                {p.periodDays} ngày
              </p>
              <p className="crmItemMeta">
                Giảm phí mua hộ:{" "}
                {(p.serviceDiscountBps / 100).toLocaleString("vi-VN")}% · Tối
                đa: {p.discountCap.toLocaleString("vi-VN")} ₫
              </p>
              <details className="crmItemDetails">
                <summary>Thông tin gói</summary>
                <CrmReference label="Mã gói" value={p.id} />
                <p>Phiên bản: {p.version}</p>
              </details>
            </div>
            <div className="crmActions">
              <button
                disabled={busy || uncertain}
                onClick={() => {
                  setSelected(p);
                  openEditor();
                }}
              >
                <CrmIcon name="document" />
                Chỉnh sửa gói
              </button>
            </div>
          </article>
        ))}
      </div>
      <details
        className="panel crmItemDetails"
        name="membership-editor"
        ref={editor}
        open={editing}
        onToggle={(e) => setEditing(e.currentTarget.open)}
      >
        <summary>{selected ? "Chỉnh sửa gói" : "Tạo gói"}</summary>
        <form
          key={`${selected?.id ?? "new"}:${selected?.version ?? 0}`}
          className="form"
          onSubmit={(e) => void save(e)}
        >
          <h2 className="crmSectionHeading">
            {selected ? "Chỉnh sửa gói" : "Gói mới"}
          </h2>
          {selected && (
            <details className="crmItemDetails">
              <summary>Thông tin bản đã lưu</summary>
              <CrmReference label="Mã gói" value={selected.id} />
            </details>
          )}
          <fieldset className="form" disabled={busy || uncertain}>
            <label>
              Gói
              <select name="name" defaultValue={selected?.name ?? "FREE"}>
                {["FREE", "PLUS", "BUSINESS"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            {[
              ["price", "Giá trả trước (₫)", selected?.price, 0, 1000000000000],
              ["days", "Kỳ hạn (ngày)", selected?.periodDays, 1, 366],
              [
                "bps",
                "Giảm phí mua hộ (bps · 100 bps = 1%)",
                selected?.serviceDiscountBps,
                0,
                10000,
              ],
              [
                "cap",
                "Giảm tối đa (₫)",
                selected?.discountCap,
                0,
                1000000000000,
              ],
            ].map(([name, label, value, min, max]) => (
              <label key={String(name)}>
                {label}
                <input
                  name={String(name)}
                  type="number"
                  step={1}
                  min={Number(min)}
                  max={Number(max)}
                  defaultValue={value ?? ""}
                  required
                />
              </label>
            ))}
            <label>
              Trạng thái
              <select name="status" defaultValue={selected?.status ?? "draft"}>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã duyệt và mở bán</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </label>
            <button className="primary" disabled={busy || uncertain}>
              <CrmIcon name="check" />
              Lưu gói
            </button>
          </fieldset>
        </form>
      </details>
      <details className="panel crmItemDetails" name="membership-editor">
        <summary>Cấp tặng có ghi nhận</summary>
        <form className="form" onSubmit={(e) => void grant(e)}>
          <fieldset className="form" disabled={busy || uncertain || loading}>
            <p className="notice">
              Kiểm tra đúng tài khoản và gói đã duyệt trước khi cấp tặng. Thao
              tác được ghi vào lịch sử membership.
            </p>
            <label>
              Mã khách hàng
              <input
                name="uid"
                required
                pattern={"[a-zA-Z0-9\\-]{1,128}"}
                aria-describedby="membership-gift-uid-hint membership-gift-uid-error"
                aria-invalid={giftUidError ? true : undefined}
                onInvalid={(e) => {
                  e.currentTarget.setCustomValidity(giftUidMessage);
                  setGiftUidError(giftUidMessage);
                }}
                onChange={(e) => {
                  e.currentTarget.setCustomValidity("");
                  if (giftUidError) {
                    setGiftUidError(
                      /^[a-zA-Z0-9-]{1,128}$/.test(e.currentTarget.value)
                        ? ""
                        : giftUidMessage,
                    );
                  }
                }}
              />
            </label>
            <p id="membership-gift-uid-hint" className="notice">
              Mã gồm 1–128 ký tự A–Z, a–z, 0–9 hoặc dấu gạch ngang (-).
            </p>
            <p
              id="membership-gift-uid-error"
              className="error"
              role={giftUidError ? "alert" : undefined}
            >
              {giftUidError}
            </p>
            <label>
              Gói đã duyệt
              <select
                name="plan"
                required
                value={chosenPlan}
                onChange={(e) => setChosenPlan(e.currentTarget.value)}
                aria-describedby="membership-plan-page-hint"
              >
                <option value="">Chọn gói</option>
                {plans
                  .filter((p) => p.status === "published")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <p id="membership-plan-page-hint" className="notice">
              Chọn gói đã duyệt trên trang đang xem.
            </p>
            <label>
              Lý do cấp tặng
              <textarea name="reason" minLength={5} maxLength={500} required />
            </label>
            <button className="primary" disabled={busy || uncertain}>
              <CrmIcon name="person" />
              Cấp tặng membership
            </button>
          </fieldset>
        </form>
      </details>
      {uncertain && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => void executeSave()}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
      <details className="panel crmItemDetails">
        <summary>
          <CrmIcon name="clock" />
          Nhắc gói sắp hết hạn
        </summary>
        <ReminderSettings />
      </details>
      {error && (
        <p role="alert" className="error">
          {error}
          <button
            type="button"
            disabled={busy || uncertain || loading}
            onClick={() => void load()}
          >
            Tải lại danh sách gói
          </button>
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
