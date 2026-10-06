import { CrmHeading, CrmIcon, CrmReference, CrmState } from "./CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { callService } from "../../shared/firebase";
import { stageLabels, type Order } from "../../../packages/domain";
import {
  localDateTime,
  appointmentTimestamp,
  type CustomerNotes,
} from "../../../packages/domain/crm";
export const customerTagInputLimit = 628;
type Cursor = { id: string; createdAt: number };
type CustomerData = {
  profile: {
    displayName: string;
    businessName: string;
    marketingConsent: boolean;
  } | null;
  crm: {
    version: number;
    tags: string[];
    notes: string;
    assigneeId: string;
    followUpAt: number;
  } | null;
  membership: { state: string; endsAt: number } | null;
  orders: {
    id: string;
    name: string;
    stage: Order["stage"];
    createdAt: number;
    hold: boolean;
    remaining: number | null;
  }[];
  tickets: { id: string; subject: string; status: string }[];
  ordersNext: Cursor | null;
  ticketsNext: Cursor | null;
  limit: number;
};
type CareDraft = {
  baseVersion?: number;
  tags: string;
  notes: string;
  assigneeId: string;
  followup: string;
};
export function customerDraftNeedsReview(
  draft: { baseVersion?: number } | null,
  version?: number,
) {
  return !!draft && draft.baseVersion !== version;
}
export function Customer() {
  const { id = "" } = useParams();
  const [data, setData] = useState<CustomerData | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [staff, setStaff] = useState<{ id: string; displayName: string }[]>([]),
    [staffNext, setStaffNext] = useState<string | null>(null),
    [assignee, setAssignee] = useState(""),
    [uncertain, setUncertain] = useState(false);
  const [draft, setDraft] = useState<CareDraft | null>(null);
  const [draftReset, setDraftReset] = useState(0);
  const careDraft = useRef<CareDraft | null>(null);
  const needsReview = customerDraftNeedsReview(draft, data?.crm?.version);
  const request = useRef(0),
    pending = useRef<{ key: string; payload: CustomerNotes } | null>(null);
  const mounted = useRef(false),
    currentId = useRef(id),
    roster = useRef(0),
    saving = useRef(false);
  const session = useRef(0);
  currentId.current = id;
  function current() {
    return mounted.current && currentId.current === id;
  }
  async function read(after?: { ordersAfter?: Cursor; ticketsAfter?: Cursor }) {
    const token = ++request.current;
    const result = await callService<CustomerData>("readCustomer", {
      id,
      ...after,
    });
    if (token !== request.current || !current()) return;
    setAssignee(careDraft.current?.assigneeId ?? result.crm?.assigneeId ?? "");
    setData((old) =>
      after && old
        ? {
            ...result,
            orders: after.ticketsAfter ? old.orders : result.orders,
            ordersNext: after.ticketsAfter ? old.ordersNext : result.ordersNext,
            tickets: after.ordersAfter ? old.tickets : result.tickets,
            ticketsNext: after.ordersAfter
              ? old.ticketsNext
              : result.ticketsNext,
          }
        : result,
    );
  }
  async function load(after?: { ordersAfter?: Cursor; ticketsAfter?: Cursor }) {
    const token = request.current + 1;
    setBusy(true);
    setError("");
    try {
      await read(after);
    } catch {
      if (current() && token === request.current) {
        setData(null);
        setError("Chưa tải được hồ sơ. Kiểm tra kết nối và thử lại.");
      }
    } finally {
      if (current() && token === request.current) setBusy(false);
    }
  }
  async function loadStaff(after?: string) {
    const token = ++roster.current;
    try {
      const result = await callService<{
        rows: typeof staff;
        next: string | null;
      }>("listCrmStaff", after ? { after } : {});
      if (!current() || token !== roster.current) return;
      setStaff((old) => (after ? [...old, ...result.rows] : result.rows));
      setStaffNext(result.next);
    } catch {
      if (!current() || token !== roster.current) return;
      setStaff([]);
      setStaffNext(null);
      setError(
        "Chưa tải được người phụ trách. Thử tải lại danh sách nhân viên.",
      );
    }
  }
  useEffect(() => {
    session.current++;
    mounted.current = true;
    setData(null);
    careDraft.current = null;
    setDraft(null);
    setStaff([]);
    setStaffNext(null);
    setMessage("");
    setUncertain(false);
    pending.current = null;
    void load();
    void loadStaff();
    return () => {
      mounted.current = false;
      request.current++;
      roster.current++;
    };
  }, [id]);
  function captureDraft(form: HTMLFormElement) {
    if (!data || busy || uncertain) return;
    const values = new FormData(form);
    const next: CareDraft = {
      baseVersion: careDraft.current
        ? careDraft.current.baseVersion
        : data.crm?.version,
      tags: String(values.get("tags") ?? ""),
      notes: String(values.get("notes") ?? ""),
      assigneeId: String(values.get("assignee") ?? ""),
      followup: String(values.get("followup") ?? ""),
    };
    careDraft.current = next;
    setDraft(next);
  }
  function reconcileDraft(discard: boolean) {
    if (!data || busy || uncertain) return;
    const next =
      discard || !careDraft.current
        ? null
        : { ...careDraft.current, baseVersion: data.crm?.version };
    careDraft.current = next;
    setDraft(next);
    setAssignee(next?.assigneeId ?? data.crm?.assigneeId ?? "");
    setDraftReset((value) => value + 1);
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !data ||
      busy ||
      uncertain ||
      saving.current ||
      customerDraftNeedsReview(careDraft.current, data.crm?.version)
    )
      return;
    const f = new FormData(e.currentTarget);
    const values = {
      id,
      ...(data.crm ? { expectedVersion: data.crm.version } : {}),
      tags: [
        ...new Set(
          String(f.get("tags"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ],
      notes: String(f.get("notes")),
      assigneeId: String(f.get("assignee")),
      followUpAt: appointmentTimestamp(
        String(f.get("followup") ?? ""),
        data.crm?.followUpAt ?? 0,
      ),
    };
    const key = JSON.stringify(values);
    if (pending.current?.key !== key)
      pending.current = {
        key,
        payload: { ...values, operationId: crypto.randomUUID() },
      };
    await executeSave();
  }
  async function executeSave() {
    if (!pending.current || saving.current) return;
    const payload = pending.current.payload;
    const generation = session.current;
    const valid = () => current() && generation === session.current;
    saving.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await callService("saveCustomerNotes", payload);
      if (!valid()) return;
      pending.current = null;
      setUncertain(false);
      careDraft.current = null;
      setDraft(null);
      setDraftReset((value) => value + 1);
      setMessage("Đã lưu hồ sơ nội bộ.");
      try {
        await read();
      } catch {
        if (!valid()) return;
        setData(null);
        setError(
          "Đã lưu, nhưng chưa tải được phiên bản mới. Tải lại hồ sơ trước khi sửa tiếp.",
        );
      }
    } catch (cause) {
      if (!valid()) return;
      const code = String((cause as { code?: string })?.code ?? "").replace(
        /^functions\//,
        "",
      );
      const rejected = [
        "invalid-argument",
        "permission-denied",
        "unauthenticated",
        "failed-precondition",
        "not-found",
        "already-exists",
        "aborted",
      ].includes(code);
      if (rejected) pending.current = null;
      setUncertain(!rejected);
      setError(
        rejected
          ? "Chưa lưu được hồ sơ. Kiểm tra quyền và tải lại phiên bản mới trước khi sửa."
          : "Chưa xác nhận được kết quả lưu. Thử lại thao tác đang chờ trước khi sửa nội dung.",
      );
    } finally {
      saving.current = false;
      if (valid()) setBusy(false);
    }
  }
  return (
    <section>
      <Link to="/crm/customers">← Khách hàng</Link>
      <CrmHeading
        title={data?.profile?.displayName || "Hồ sơ khách hàng"}
        description={
          data?.profile?.businessName || "Hồ sơ và công việc liên quan"
        }
        actions={
          <button disabled={busy || uncertain} onClick={() => void load()}>
            <CrmIcon name="refresh" />
            Tải lại hồ sơ
          </button>
        }
      />
      {busy && <CrmState kind="loading" title="Đang xử lý hồ sơ…" />}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {error && <CrmState kind="error" title={error} />}
      {uncertain && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => void executeSave()}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
      <details className="crmItemDetails">
        <summary>Mã khách hàng</summary>
        <CrmReference label="Mã" value={id} />
      </details>
      {data && (
        <>
          <div className="crmProfileSummary panel">
            <div>
              <span>Nội dung quảng bá</span>
              <strong>
                {data.profile?.marketingConsent
                  ? "Đã đồng ý nhận"
                  : "Chưa đồng ý nhận"}
              </strong>
            </div>
            <div>
              <span>Thành viên</span>
              <strong>
                {data.membership
                  ? {
                      active: "Đang có hiệu lực",
                      expired: "Đã hết hạn",
                      cancelled: "Đã hủy",
                    }[data.membership.state] || "Chưa xác định hiệu lực"
                  : "Chưa có gói trả phí"}
              </strong>
              {data.membership &&
                Number.isFinite(data.membership.endsAt) &&
                data.membership.endsAt > 0 && (
                  <small>
                    Đến{" "}
                    {new Date(data.membership.endsAt).toLocaleDateString(
                      "vi-VN",
                    )}
                  </small>
                )}
            </div>
            <div>
              <span>Lịch chăm sóc</span>
              <strong>
                {data.crm?.followUpAt
                  ? new Date(data.crm.followUpAt).toLocaleString("vi-VN")
                  : "Chưa có lịch hẹn"}
              </strong>
            </div>
          </div>
          <div className="crmDetailGrid">
            <section className="panel">
              <h2 className="crmSectionHeading">Chăm sóc khách hàng</h2>
              <details className="crmItemDetails">
                <summary>Cập nhật chăm sóc</summary>
                {needsReview && (
                  <div className="notice">
                    <p role="status">
                      Hồ sơ đã thay đổi. Bản nháp của bạn chưa được lưu.
                    </p>
                    <details className="crmItemDetails">
                      <summary>Nội dung mới nhất</summary>
                      <p>
                        Phân loại:{" "}
                        {data.crm?.tags.join(", ") || "Chưa phân loại"}
                      </p>
                      <p>Ghi chú: {data.crm?.notes || "Chưa có ghi chú"}</p>
                      <p>
                        Người phụ trách:{" "}
                        {data.crm?.assigneeId || "Chưa phân công"}
                      </p>
                      <p>
                        Lịch hẹn:{" "}
                        {data.crm?.followUpAt
                          ? new Date(data.crm.followUpAt).toLocaleString(
                              "vi-VN",
                            )
                          : "Chưa có lịch hẹn"}
                      </p>
                    </details>
                    <div className="crmActions">
                      <button
                        type="button"
                        disabled={busy || uncertain}
                        onClick={() => reconcileDraft(false)}
                      >
                        Đã đối chiếu, tiếp tục bản nháp
                      </button>
                      <button
                        type="button"
                        disabled={busy || uncertain}
                        onClick={() => reconcileDraft(true)}
                      >
                        Bỏ bản nháp, dùng dữ liệu mới
                      </button>
                    </div>
                  </div>
                )}
                <form
                  key={`${id}:${draft ? (draft.baseVersion ?? "new") : (data.crm?.version ?? "new")}:${draftReset}`}
                  className="form"
                  onChange={(e) => captureDraft(e.currentTarget)}
                  onSubmit={(e) => void save(e)}
                >
                  <fieldset
                    className="form"
                    disabled={busy || uncertain || needsReview}
                  >
                    <p className="muted">
                      Ghi chú này chỉ dành cho nhân viên, không gửi cho khách.
                    </p>
                    <label>
                      Phân loại
                      <input
                        name="tags"
                        placeholder="Các nhóm, cách nhau bằng dấu phẩy"
                        defaultValue={draft?.tags ?? data.crm?.tags.join(", ")}
                        maxLength={customerTagInputLimit}
                      />
                    </label>
                    <label>
                      Ghi chú nội bộ
                      <textarea
                        name="notes"
                        maxLength={4000}
                        defaultValue={draft?.notes ?? data.crm?.notes}
                        rows={5}
                      />
                    </label>
                    <label>
                      Người phụ trách
                      <select
                        name="assignee"
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                      >
                        <option value="">Chưa phân công</option>
                        {assignee && !staff.some((s) => s.id === assignee) && (
                          <option value={assignee}>
                            {assignee} · cần kiểm tra quyền
                          </option>
                        )}
                        {staff.map((s) => (
                          <option value={s.id} key={s.id}>
                            {s.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => void loadStaff(staffNext ?? undefined)}
                    >
                      {staffNext ? "Xem thêm nhân viên" : "Tải lại nhân viên"}
                    </button>
                    <label>
                      Lịch hẹn theo giờ thiết bị
                      <input
                        type="datetime-local"
                        name="followup"
                        defaultValue={
                          draft?.followup ??
                          localDateTime(data.crm?.followUpAt ?? 0)
                        }
                      />
                    </label>
                    <p className="muted">
                      Xóa lịch hẹn để đánh dấu không còn việc cần theo dõi.
                    </p>
                    <button className="primary" disabled={busy || uncertain}>
                      {busy ? "Đang lưu…" : "Lưu hồ sơ nội bộ"}
                    </button>
                  </fieldset>
                </form>
              </details>
            </section>
            <div>
              <section className="panel">
                <h2 className="crmSectionHeading">
                  <CrmIcon name="box" />
                  Đơn mua hộ
                </h2>
                {data.orders.map((o) => (
                  <article className="crmRelated crmItemMain" key={o.id}>
                    <Link to={`/crm/orders?order=${o.id}`}>{o.name}</Link>
                    <p>
                      {stageLabels[o.stage]}
                      {o.hold ? " · Đang tạm giữ" : ""}
                    </p>
                    <small>
                      {o.remaining === null
                        ? "Chưa chốt tổng cuối"
                        : `Còn thu ${o.remaining.toLocaleString("vi-VN")} ₫`}
                    </small>
                  </article>
                ))}
                {!data.orders.length && <p>Chưa có đơn trong trang này.</p>}
                {data.ordersNext && (
                  <button
                    disabled={busy || uncertain}
                    onClick={() => void load({ ordersAfter: data.ordersNext! })}
                  >
                    Đơn cũ hơn
                  </button>
                )}
              </section>
              <section className="panel">
                <h2 className="crmSectionHeading">
                  <CrmIcon name="message" />
                  Hội thoại hỗ trợ
                </h2>
                {data.tickets.map((t) => (
                  <article className="crmRelated crmItemMain" key={t.id}>
                    <Link to={`/crm/support?ticket=${t.id}`}>{t.subject}</Link>
                    <p>
                      {t.status === "resolved" ? "Đã giải quyết" : "Đang mở"}
                    </p>
                  </article>
                ))}
                {!data.tickets.length && (
                  <p>Chưa có hội thoại trong trang này.</p>
                )}
                {data.ticketsNext && (
                  <button
                    disabled={busy || uncertain}
                    onClick={() =>
                      void load({ ticketsAfter: data.ticketsNext! })
                    }
                  >
                    Hội thoại cũ hơn
                  </button>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
