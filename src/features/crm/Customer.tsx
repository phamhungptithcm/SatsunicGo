import { useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { stageLabels, type Order } from "../../../packages/domain";
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
    stage: Order["stage"];
    createdAt: number;
    hold: boolean;
    remaining: number | null;
  }[];
  tickets: { id: string; subject: string; status: string }[];
  limit: number;
};
export function Customer() {
  const [uid, setUid] = useState(""),
    [target, setTarget] = useState(""),
    [data, setData] = useState<CustomerData | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setData(null);
    try {
      setData(await callService<CustomerData>("readCustomer", { id: uid }));
      setTarget(uid);
      setMessage("");
    } catch {
      setMessage("Chưa tải được hồ sơ khách hàng.");
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await callService("saveCustomerNotes", {
        id: target,
        operationId: crypto.randomUUID(),
        ...(data?.crm ? { expectedVersion: data.crm.version } : {}),
        tags: String(f.get("tags"))
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        notes: String(f.get("notes")),
        assigneeId: String(f.get("assignee")),
        followUpAt: f.get("followup")
          ? new Date(String(f.get("followup"))).getTime()
          : 0,
      });
      setData(null);
      setMessage("Đã lưu ghi chú nội bộ. Tải lại hồ sơ trước khi sửa tiếp.");
    } catch {
      setMessage(
        "Chưa lưu được. Kiểm tra phiên bản hồ sơ và nhân viên phụ trách.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel">
      <summary>Khách hàng và việc cần theo dõi</summary>
      <form className="form" onSubmit={(e) => void load(e)}>
        <label>
          Định danh khách hàng
          <input
            value={uid}
            onChange={(e) => {
              setUid(e.target.value);
              setData(null);
            }}
            required
            pattern="[a-zA-Z0-9-]{1,128}"
          />
        </label>
        <button disabled={busy}>Mở hồ sơ</button>
      </form>
      {data && (
        <>
          <h3>{data.profile?.displayName || "Khách hàng chưa cập nhật tên"}</h3>
          <p>{data.profile?.businessName}</p>
          <p>
            Consent quảng bá:{" "}
            {data.profile?.marketingConsent ? "Đã đồng ý" : "Chưa đồng ý"}
          </p>
          <p>
            Hiện tối đa {data.limit} đơn và ticket; đây là danh sách giới hạn,
            không phải tổng toàn hệ thống.
          </p>
          {data.orders.map((o) => (
            <p key={o.id}>
              {o.id} · {stageLabels[o.stage]} · còn thu{" "}
              {o.remaining === null
                ? "chưa chốt tổng cuối"
                : `${o.remaining.toLocaleString("vi-VN")} ₫`}{" "}
              {o.hold ? "· Đang hold" : ""}
            </p>
          ))}
          {data.tickets.map((t) => (
            <p key={t.id}>
              {t.subject} ·{" "}
              {t.status === "resolved" ? "Đã giải quyết" : "Đang mở"}
            </p>
          ))}
          <form className="form" onSubmit={(e) => void save(e)}>
            <p>Ghi chú nội bộ không được gửi vào hội thoại khách hàng.</p>
            <label>
              Tag, cách nhau bằng dấu phẩy
              <input name="tags" defaultValue={data.crm?.tags.join(", ")} />
            </label>
            <label>
              Ghi chú nội bộ
              <textarea
                name="notes"
                maxLength={4000}
                defaultValue={data.crm?.notes}
              />
            </label>
            <label>
              Định danh nhân viên phụ trách
              <input name="assignee" defaultValue={data.crm?.assigneeId} />
            </label>
            <label>
              Hẹn theo dõi theo giờ địa phương
              <input type="datetime-local" name="followup" />
            </label>
            <button disabled={busy}>Lưu hồ sơ nội bộ</button>
          </form>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
