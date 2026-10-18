import {
  invitationStateLabel,
  invitationDeliveryLabel,
  type InvitationView,
  type StaffMemberView,
} from "../../../packages/domain/staff-invitation";
import "./staff-invitations.css";
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
type SelectedEmployee = { acceptedUid: string; email: string; id?: string };
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
function StaffRoleEditor({
  employee,
  onSaved,
  onPendingChange,
}: {
  employee?: SelectedEmployee;
  onSaved?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [uid, setUid] = useState(employee?.acceptedUid ?? ""),
    [target, setTarget] = useState(""),
    [access, setAccess] = useState<Access | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [uncertain, setUncertain] = useState(false);
  useEffect(() => {
    onPendingChange?.(busy || uncertain);
  }, [busy, uncertain, onPendingChange]);
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
      ...(employee?.id ? { invitationId: employee.id } : {}),
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
      onSaved?.();
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
        title={
          employee
            ? `Phân quyền cho ${employee.email}`
            : "Quản lý nhân viên hiện có"
        }
        description="Kiểm tra tài khoản trước khi cập nhật quyền làm việc."
      />
      <div className="staffRoleLayout">
        <section className="panel">
          <p className="muted">
            Cần quyền chủ doanh nghiệp và xác thực hai lớp gần đây để lưu.
          </p>

          <form className="form" onSubmit={(e) => void load(e)}>
            <label>
              <span className="formLabelText">
                {employee
                  ? "Email nhân viên"
                  : "Mã tài khoản nhân viên hiện có"}{" "}
                <span className="requiredMark" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                value={employee?.email ?? uid}
                readOnly={Boolean(employee)}
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
                pattern={employee ? undefined : "[a-zA-Z0-9-]{1,128}"}
              />
            </label>
            <p id="admin-staff-hint" className="muted">
              {employee?.id
                ? "Nhân viên đã chấp nhận lời mời bằng tài khoản Google này."
                : "Kiểm tra đúng nhân viên trước khi cập nhật quyền hiện có."}
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
              <CrmReference
                label="Tài khoản đang chỉnh quyền"
                value={employee?.email ?? target}
              />
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

function StaffAvatar({
  name,
  url,
}: {
  name: string | null;
  url: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("vi-VN") || "?";
  return (
    <span className="staffAvatar" aria-hidden="true">
      {url && failedUrl !== url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export function StaffAccess() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [items, setItems] = useState<InvitationView[]>([]);
  const [email, setEmail] = useState("");
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [listError, setListError] = useState("");
  const [selected, setSelected] = useState<SelectedEmployee>();
  const [rolePending, setRolePending] = useState(false);
  const [members, setMembers] = useState<StaffMemberView[]>([]);
  const [memberNext, setMemberNext] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberError, setMemberError] = useState("");
  const [departure, setDeparture] = useState<StaffMemberView>();
  const memberRevision = useRef(0);
  async function refreshMembers(after?: string) {
    const token = ++memberRevision.current;
    setMemberLoading(true);
    setMemberError("");
    try {
      const response = await callService<{
        members: StaffMemberView[];
        next: string | null;
      }>("listStaffMembers", after ? { after } : {}, "inline");
      if (!alive.current || memberRevision.current !== token) return;
      setMembers((old) =>
        after
          ? [
              ...old,
              ...response.members.filter(
                (row) => !old.some((item) => item.uid === row.uid),
              ),
            ]
          : response.members,
      );
      setMemberNext(response.next);
    } catch {
      if (alive.current && memberRevision.current === token)
        setMemberError("Chưa tải được danh sách nhân viên. Thử tải lại.");
    } finally {
      if (alive.current && memberRevision.current === token)
        setMemberLoading(false);
    }
  }
  const dateLabel = (value: number | null) =>
    value === null
      ? "Chưa ghi nhận"
      : new Date(value).toLocaleDateString("vi-VN");

  const [uncertain, setUncertain] = useState(false);
  const pending = useRef<Record<string, unknown> | null>(null);
  const flight = useRef(false),
    revision = useRef(0),
    alive = useRef(true);
  async function refresh(after?: string) {
    const token = ++revision.current;
    setLoading(true);
    setListError("");
    try {
      const result = await callService<{
        items: InvitationView[];
        next: string | null;
      }>("listStaffInvitations", after ? { after } : {});
      if (!alive.current || token !== revision.current) return;
      setItems((old) =>
        after
          ? [
              ...old,
              ...result.items.filter((v) => !old.some((o) => o.id === v.id)),
            ]
          : result.items,
      );
      setNext(result.next);
    } catch {
      if (alive.current && token === revision.current)
        setListError("Chưa tải được danh sách lời mời. Thử tải lại.");
    } finally {
      if (alive.current && token === revision.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    void refresh();
    void refreshMembers();
    return () => {
      alive.current = false;
      revision.current++;
    };
  }, []);
  async function execute() {
    if (flight.current || !pending.current) return;
    flight.current = true;
    setBusy(true);
    setMessage("");
    const command = pending.current;
    try {
      const { service = "staffInvitationCommand", ...payload } = command;
      await callService(String(service), payload);
      if (!alive.current) return;
      pending.current = null;
      setUncertain(false);
      setMessage(
        command.service === "departStaffMember"
          ? "Đã ghi nhận nghỉ việc và ngừng quyền làm việc."
          : command.action === "revoke"
            ? "Đã thu hồi lời mời. Link cũ không thể dùng để tham gia."
            : "Đã tạo yêu cầu gửi lời mời. Theo dõi trạng thái email trong danh sách.",
      );
      if (command.action === "create") {
        setEmail("");
        setHistoryOpen(true);
      }
      if (command.service === "departStaffMember") {
        setDeparture(undefined);
        setSelected(undefined);
      }
      await Promise.all([refresh(), refreshMembers()]);
    } catch (cause) {
      if (!alive.current) return;
      const code = String((cause as { code?: string }).code ?? "").replace(
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
        "resource-exhausted",
      ].includes(code);
      if (rejected) pending.current = null;
      setUncertain(!rejected);
      setMessage(
        !rejected
          ? "Chưa xác nhận được kết quả. Kiểm tra thao tác đang chờ trước khi thực hiện thay đổi khác."
          : command.service === "departStaffMember"
            ? code === "aborted"
              ? "Quyền nhân viên đã thay đổi. Tải lại nhân viên rồi ghi nhận nghỉ việc."
              : "Chưa ghi nhận nghỉ việc. Kiểm tra quyền quản trị, xác thực hai lớp gần đây và tải lại nhân viên."
            : code === "already-exists"
              ? "Email đã có lời mời hoặc đã tham gia. Tải lại danh sách để kiểm tra."
              : code === "resource-exhausted"
                ? "Chưa thể gửi thêm. Đợi một lúc rồi thử lại."
                : code === "aborted"
                  ? "Lời mời đã thay đổi. Tải lại danh sách trước khi thao tác."
                  : code === "failed-precondition"
                    ? "Chưa thực hiện được. Kiểm tra trạng thái gửi và xác thực hai lớp gần đây của bạn."
                    : "Chưa thực hiện được. Kiểm tra tài khoản và email rồi thử lại.",
      );
    } finally {
      flight.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function command(value: Record<string, unknown>) {
    if (flight.current || uncertain || rolePending) return;
    pending.current = { ...value, operationId: crypto.randomUUID() };
    void execute();
  }
  return (
    <section className="staffInvitations admin096">
      <CrmHeading
        title="Nhân viên"
        description="Quản lý nhân viên và quyền làm việc."
      />
      <section className="panel staffInviteComposer" aria-label="Mời nhân viên">
        <form
          className="form staffInviteForm"
          onSubmit={(e) => {
            e.preventDefault();
            command({ action: "create", email });
          }}
        >
          <label>
            <span>
              Email tài khoản Google{" "}
              <span className="requiredMark" aria-hidden="true">
                *
              </span>
            </span>
            <input
              type="email"
              required
              maxLength={254}
              value={email}
              disabled={busy || uncertain}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              aria-describedby="staff-invite-help"
            />
          </label>
          <button className="primary" disabled={busy || uncertain}>
            {busy ? "Đang xử lý…" : "Gửi lời mời"}
          </button>
          <p id="staff-invite-help" className="muted">
            Nhân viên chấp nhận bằng tài khoản Google, sau đó bạn phân quyền.
          </p>
        </form>
        {message && <p role="status">{message}</p>}
        {uncertain && (
          <button disabled={busy} onClick={() => void execute()}>
            Kiểm tra thao tác đang chờ
          </button>
        )}
      </section>
      <section className="panel" aria-labelledby="staff-directory-title">
        <div className="staffInviteHeading">
          <h2 id="staff-directory-title">Danh sách nhân viên</h2>
          <button
            disabled={memberLoading || busy}
            onClick={() => void refreshMembers()}
          >
            Tải lại nhân viên
          </button>
        </div>

        {memberLoading && <p role="status">Đang tải nhân viên…</p>}
        {memberError && <p role="alert">{memberError}</p>}
        {!memberLoading && !memberError && !members.length && !memberNext && (
          <p>Chưa có nhân viên nào.</p>
        )}
        <div
          className="staffTableScroll"
          tabIndex={0}
          role="region"
          aria-label="Bảng nhân viên, cuộn ngang để xem đủ cột"
        >
          <table className="staffDirectory">
            <caption className="sr-only">
              Thông tin và quyền làm việc của nhân viên
            </caption>
            <thead>
              <tr>
                <th scope="col">Họ tên</th>
                <th scope="col">Email</th>
                <th scope="col">Ngày tham gia</th>
                <th scope="col">Ngày nghỉ việc</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.uid}>
                  <td>
                    <div className="staffPerson">
                      <StaffAvatar
                        name={member.fullName}
                        url={member.avatarUrl}
                      />
                      <span>{member.fullName || "Chưa có họ tên"}</span>
                    </div>
                  </td>
                  <td>{member.email || "Chưa có email"}</td>
                  <td>{dateLabel(member.joinedAt)}</td>
                  <td>{dateLabel(member.departedAt)}</td>
                  <td>
                    {member.roles.length
                      ? member.roles
                          .map(
                            (role) =>
                              names[roles.indexOf(role)] ??
                              "Vai trò chưa xác định",
                          )
                          .join(", ")
                      : "Chưa phân quyền"}
                  </td>
                  <td>
                    <span
                      className={`staffStatus ${member.departedAt || member.locked ? "staffStatusMuted" : member.active ? "staffStatusActive" : ""}`}
                    >
                      {member.departedAt
                        ? "Đã nghỉ việc"
                        : member.locked
                          ? "Đang khóa"
                          : member.active
                            ? "Đang làm việc"
                            : "Chưa có quyền làm việc"}
                    </span>
                  </td>
                  <td>
                    <div className="staffInviteActions">
                      <button
                        disabled={
                          busy || uncertain || rolePending || memberLoading
                        }
                        onClick={() => {
                          if (!rolePending)
                            setSelected({
                              acceptedUid: member.uid,
                              email:
                                member.email || member.fullName || "Nhân viên",
                              ...(member.invitationId
                                ? { id: member.invitationId }
                                : {}),
                            });
                        }}
                      >
                        Chỉnh quyền
                      </button>
                      {!member.departedAt && !member.invitationId && (
                        <button
                          disabled={
                            busy || uncertain || rolePending || memberLoading
                          }
                          onClick={() => setDeparture(member)}
                        >
                          Ghi nhận nghỉ việc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {memberNext && (
          <button
            disabled={memberLoading || busy}
            onClick={() => void refreshMembers(memberNext)}
          >
            Xem thêm nhân viên
          </button>
        )}
        {departure && (
          <section className="staffDeparture" aria-label="Xác nhận nghỉ việc">
            <p>
              Ghi nhận{" "}
              {departure.fullName || departure.email || "nhân viên này"} nghỉ
              việc hôm nay và ngừng quyền làm việc? Lịch sử nhân viên được giữ
              lại.
            </p>
            <button
              className="primary"
              disabled={busy || uncertain || rolePending || memberLoading}
              onClick={() =>
                command({
                  service: "departStaffMember",
                  uid: departure.uid,
                  expectedVersion: departure.version,
                })
              }
            >
              Xác nhận nghỉ việc
            </button>
            <button
              disabled={busy || uncertain}
              onClick={() => setDeparture(undefined)}
            >
              Hủy
            </button>
          </section>
        )}
      </section>
      {selected && (
        <StaffRoleEditor
          key={selected.acceptedUid}
          employee={selected}
          onPendingChange={setRolePending}
          onSaved={() => {
            void refresh();
            void refreshMembers();
          }}
        />
      )}
      <details
        className="panel staffInviteHistory"
        open={historyOpen}
        onToggle={(event) => setHistoryOpen(event.currentTarget.open)}
      >
        <summary>Lời mời</summary>
        <div className="staffInviteHeading">
          <span className="muted">
            Theo dõi lời mời và trạng thái gửi email
          </span>
          <button disabled={loading || busy} onClick={() => void refresh()}>
            Tải lại danh sách
          </button>
        </div>
        {loading && <p role="status">Đang tải danh sách…</p>}
        {listError && <p role="alert">{listError}</p>}
        {!loading && !listError && items.length === 0 && (
          <p>Chưa có lời mời nào. Nhập email để mời nhân viên đầu tiên.</p>
        )}
        <ul className="staffInviteList">
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{item.email}</strong>
                {item.displayName && <p>{item.displayName}</p>}
                <p>
                  {invitationStateLabel[item.state]}
                  {item.state === "accepted"
                    ? item.hasAccess
                      ? " · Đã cấp quyền"
                      : " · Chưa có quyền truy cập"
                    : ""}
                </p>
                {item.state !== "accepted" && (
                  <p className="muted">
                    {invitationDeliveryLabel[item.delivery]}
                  </p>
                )}
                {item.state === "pending" && (
                  <p className="muted">
                    Hết hạn: {new Date(item.expiresAt).toLocaleString("vi-VN")}
                  </p>
                )}
              </div>
              <div className="staffInviteActions">
                {item.state === "accepted" && item.acceptedUid && (
                  <button
                    className="primary"
                    disabled={busy || uncertain || rolePending || memberLoading}
                    onClick={() => {
                      if (!rolePending)
                        setSelected({
                          acceptedUid: item.acceptedUid!,
                          email: item.email,
                          id: item.id,
                        });
                    }}
                  >
                    {item.hasAccess ? "Chỉnh quyền" : "Phân quyền"}
                  </button>
                )}
                {["pending", "expired"].includes(item.state) && (
                  <>
                    <button
                      disabled={
                        busy ||
                        uncertain ||
                        ["queued", "sending", "unknown"].includes(item.delivery)
                      }
                      onClick={() =>
                        command({
                          action: "resend",
                          id: item.id,
                          version: item.version,
                        })
                      }
                    >
                      Gửi lại lời mời
                    </button>
                    <button
                      disabled={busy || uncertain}
                      onClick={() =>
                        command({
                          action: "revoke",
                          id: item.id,
                          version: item.version,
                        })
                      }
                    >
                      Thu hồi lời mời
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {next && (
          <button disabled={loading || busy} onClick={() => void refresh(next)}>
            Xem thêm lời mời
          </button>
        )}
      </details>
    </section>
  );
}
