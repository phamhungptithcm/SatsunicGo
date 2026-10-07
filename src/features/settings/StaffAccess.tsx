import { notify } from "../../shared/feedback";
import { StepForm, StepStage } from "../../shared/StepForm";
import "./admin-workbench096.css";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CrmHeading, CrmReference } from "../crm/CrmPresentation";
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
  version?: number;
  roles: string[];
  active?: boolean;
  locked?: boolean;
  orderIds: string[];
};
export function validAccess(value: unknown): value is Access | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  return (
    (a.version === undefined ||
      (typeof a.version === "number" &&
        Number.isSafeInteger(a.version) &&
        a.version >= 0 &&
        a.version < Number.MAX_SAFE_INTEGER)) &&
    (a.active === undefined || typeof a.active === "boolean") &&
    (a.locked === undefined || typeof a.locked === "boolean") &&
    Array.isArray(a.roles) &&
    a.roles.every((role) => typeof role === "string") &&
    Array.isArray(a.orderIds) &&
    a.orderIds.every((id) => typeof id === "string")
  );
}
export function StaffAccess() {
  const [uid, setUid] = useState(""),
    [target, setTarget] = useState(""),
    [access, setAccess] = useState<Access | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [uncertain, setUncertain] = useState(false);
  const request = useRef(0);
  const sending = useRef(false),
    pending = useRef<Record<string, unknown> | null>(null);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  async function load(e: FormEvent) {
    e.preventDefault();
    if (busy || uncertain || sending.current) return;
    const token = ++request.current,
      requestedUid = uid;
    setBusy(true);
    setReady(false);
    setMessage("");
    try {
      const r = await callService<{ access: unknown }>("readStaffAccess", {
        id: requestedUid,
      });
      if (token !== request.current) return;
      if (!validAccess(r.access)) {
        setAccess(null);
        setMessage(
          "Dữ liệu quyền chưa hợp lệ để chỉnh sửa. Kiểm tra lại tài khoản trước khi lưu.",
        );
        return;
      }
      setAccess(r.access);
      setTarget(requestedUid);
      setReady(true);
      setMessage("");
    } catch {
      if (token === request.current)
        setMessage("Chưa kiểm tra được quyền nhân viên.");
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ready || busy || uncertain || sending.current || target !== uid)
      return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    pending.current = {
      action: "saveStaffAccess",
      id: target,
      operationId: crypto.randomUUID(),
      ...(access?.version !== undefined
        ? { expectedVersion: access.version }
        : {}),
      payload: {
        roles: f.getAll("role").map(String),
        active: f.get("active") === "on",
        locked: f.get("locked") === "on",
        orderIds: String(f.get("orders"))
          .split(/[\s,]+/)
          .filter(Boolean),
      },
    };
    await executeSave();
  }
  async function executeSave() {
    if (!pending.current || sending.current) return;
    const command = pending.current,
      token = ++request.current;
    sending.current = true;
    setBusy(true);
    setMessage("");
    try {
      await callService("workspaceCommand", command);
      if (token !== request.current) return;
      pending.current = null;
      setUncertain(false);
      setReady(false);
      notify(
        "Đã lưu quyền. Kiểm tra lại nhân viên trước khi sửa tiếp.",
        "success",
      );
    } catch (cause) {
      if (token !== request.current) return;
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
      if (rejected) {
        pending.current = null;
        setReady(false);
      }
      setUncertain(!rejected);
      setMessage(
        rejected
          ? "Chưa lưu được. Kiểm tra phiên bản và xác thực Google gần đây cùng hai lớp."
          : "Chưa xác nhận được kết quả lưu. Thử lại thao tác đang chờ cho đúng tài khoản này.",
      );
    } finally {
      sending.current = false;
      if (token === request.current) setBusy(false);
    }
  }
  return (
    <section className="admin096">
      <CrmHeading
        title="Nhân viên"
        description="Kiểm tra tài khoản trước khi cập nhật quyền làm việc."
      />
      <div className="adminLayout">
        <section className="panel">
          <span className="adminStep">Bước 1 · Kiểm tra tài khoản</span>
          <h2>Phân quyền nhân viên</h2>

          <form className="form" onSubmit={(e) => void load(e)}>
            <label>
              <span className="formLabelText">
                Mã tài khoản nhân viên{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                value={uid}
                disabled={busy || uncertain}
                onChange={(e) => {
                  request.current++;
                  setUid(e.target.value);
                  setReady(false);
                  setAccess(null);
                  setTarget("");
                  setBusy(false);
                  setMessage("");
                }}
                aria-describedby="admin-staff-hint"
                required
                pattern="[a-zA-Z0-9-]{1,128}"
              />
            </label>
            <p id="admin-staff-hint" className="muted">
              Dùng mã định danh của tài khoản đã xác minh.
            </p>
            <button className="primary" disabled={busy || uncertain}>
              {busy ? "Đang kiểm tra…" : "Kiểm tra quyền hiện tại"}
            </button>
          </form>
          {ready && (
            <StepForm
              steps={["Vai trò", "Phạm vi & trạng thái", "Kiểm tra"]}
              disabled={busy || uncertain}
              key={target + access?.version}
              className="form"
              onSubmit={(e) => void save(e)}
            >
              <span className="adminStep">Cập nhật quyền</span>
              <CrmReference label="Tài khoản đang chỉnh quyền" value={target} />
              <fieldset className="form" disabled={busy || uncertain}>
                <StepStage index={0}>
                  <fieldset className="crmRoleOptions">
                    <legend>Vai trò được phép</legend>
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
                  </fieldset>
                </StepStage>
                <StepStage index={1}>
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
                </StepStage>
                <StepStage index={2}>
                  <button className="primary" disabled={busy || uncertain}>
                    {busy ? "Đang lưu…" : "Lưu quyền nhân viên"}
                  </button>
                </StepStage>
              </fieldset>
            </StepForm>
          )}
          {message && <p role="status">{message}</p>}
        </section>
        <aside
          className="panel adminGuide"
          aria-label="Điều kiện cập nhật quyền"
        >
          <h2>Trước khi lưu quyền</h2>
          <p>
            Chỉ chủ doanh nghiệp được cấp quyền. Mỗi lần lưu cần xác thực gần
            đây và hai lớp.
          </p>
          <p>
            Kiểm tra đúng mã tài khoản trước khi chọn vai trò và phạm vi đơn
            hàng.
          </p>
          <p className="muted">
            Sau khi lưu, kiểm tra lại quyền trước khi chỉnh sửa tiếp.
          </p>
        </aside>
      </div>
      {uncertain && (
        <button
          className="primary"
          disabled={busy}
          onClick={() => void executeSave()}
        >
          Thử lại thao tác đang chờ
        </button>
      )}
    </section>
  );
}
