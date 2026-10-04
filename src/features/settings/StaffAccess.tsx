import { useState, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
const roles = [
  "OWNER",
  "OPERATIONS_MANAGER",
  "BUYER",
  "WAREHOUSE",
  "FINANCE",
  "SUPPORT",
  "CONTENT_EDITOR",
];
const names = [
  "Chủ doanh nghiệp",
  "Quản lý vận hành",
  "Mua hàng",
  "Kho",
  "Kế toán",
  "Hỗ trợ",
  "Biên tập nội dung",
];
type Access = {
  version: number;
  roles: string[];
  active: boolean;
  locked: boolean;
  orderIds: string[];
};
export function StaffAccess() {
  const [uid, setUid] = useState(""),
    [target, setTarget] = useState(""),
    [access, setAccess] = useState<Access | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function load(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setReady(false);
    try {
      const r = await callService<{ access: Access | null }>(
        "readStaffAccess",
        { id: uid },
      );
      setAccess(r.access);
      setTarget(uid);
      setReady(true);
      setMessage("");
    } catch {
      setMessage("Chưa kiểm tra được quyền nhân viên.");
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await callService("workspaceCommand", {
        action: "saveStaffAccess",
        id: target,
        operationId: crypto.randomUUID(),
        ...(access ? { expectedVersion: access.version } : {}),
        payload: {
          roles: f.getAll("role").map(String),
          active: f.get("active") === "on",
          locked: f.get("locked") === "on",
          orderIds: String(f.get("orders"))
            .split(/[\s,]+/)
            .filter(Boolean),
        },
      });
      setReady(false);
      setMessage("Đã lưu quyền. Kiểm tra lại nhân viên trước khi sửa tiếp.");
    } catch {
      setMessage(
        "Chưa lưu được. Kiểm tra phiên bản và xác thực Google gần đây cùng hai lớp.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="panel">
      <summary>Nhân viên và phân quyền</summary>
      <p>
        Chỉ chủ doanh nghiệp được cấp quyền. Mỗi lần lưu cần xác thực gần đây và
        hai lớp. Định danh lấy từ tài khoản Firebase đã xác minh.
      </p>
      <form className="form" onSubmit={(e) => void load(e)}>
        <label>
          Định danh nhân viên
          <input
            value={uid}
            onChange={(e) => {
              setUid(e.target.value);
              setReady(false);
            }}
            required
            pattern="[a-zA-Z0-9-]{1,128}"
          />
        </label>
        <button disabled={busy}>Kiểm tra quyền hiện tại</button>
      </form>
      {ready && (
        <form
          key={target + access?.version}
          className="form"
          onSubmit={(e) => void save(e)}
        >
          {roles.map((role, i) => (
            <label key={role}>
              <input
                type="checkbox"
                name="role"
                value={role}
                defaultChecked={access?.roles.includes(role)}
              />
              {names[i]}
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              name="active"
              defaultChecked={access?.active}
            />
            Được phép làm việc
          </label>
          <label>
            <input
              type="checkbox"
              name="locked"
              defaultChecked={access?.locked}
            />
            Khóa quyền nhân viên
          </label>
          <label>
            Các đơn giao cho nhân viên mua hàng (mỗi mã một dòng)
            <textarea
              name="orders"
              defaultValue={access?.orderIds.join("\n")}
            />
          </label>
          <button disabled={busy}>Lưu quyền nhân viên</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
