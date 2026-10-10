import { useEffect, useRef, useState } from "react";
import { callService } from "../../shared/firebase";
import "./ask-pilot106.css";
import { notify } from "../../shared/feedback";
type Pilot = {
  enabled: boolean;
  version: number | null;
  ready: boolean;
  maxBudgetVnd: number;
  reservedVnd: number | null;
  expiresAt: number | null;
  audience?: "owner-canary" | "customers" | null;
  canPromote?: boolean;
};
function validBudget(value: unknown, customer: boolean): value is Pilot {
  if (!value || typeof value !== "object") return false;
  const p = value as Pilot;
  return (
    typeof p.enabled === "boolean" &&
    typeof p.ready === "boolean" &&
    (p.version === null ||
      (Number.isSafeInteger(p.version) && p.version > 0)) &&
    p.maxBudgetVnd === (customer ? 50000 : 10000) &&
    (p.reservedVnd === null ||
      (Number.isSafeInteger(p.reservedVnd) &&
        p.reservedVnd >= 0 &&
        p.reservedVnd <= p.maxBudgetVnd)) &&
    (p.expiresAt === null ||
      (Number.isSafeInteger(p.expiresAt) && p.expiresAt > 0)) &&
    (!customer ||
      (typeof p.canPromote === "boolean" &&
        [null, "owner-canary", "customers"].includes(p.audience ?? null)))
  );
}
const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
export function AskPilot() {
  return (
    <>
      <AiBudget />
      <AiBudget customer />
    </>
  );
}
function AiBudget({ customer = false }: { customer?: boolean }) {
  const configurationKey = customer ? "customerAi" : "askPilot";
  const sectionId = customer ? "askCustomerAiTitle" : "askPilotTitle";
  const [promote, setPromote] = useState(false);
  const confirmation = useRef<HTMLDialogElement>(null);
  const [pilot, setPilot] = useState<Pilot | null>(null),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  function publish(text: string) {
    if (text) notify(text, text.startsWith("Đã ") ? "success" : "error");
  }
  const mounted = useRef(false),
    running = useRef(false),
    sequence = useRef(0),
    pending = useRef<Record<string, unknown> | null>(null),
    button = useRef<HTMLButtonElement>(null),
    title = useRef<HTMLHeadingElement>(null);
  async function load() {
    const request = ++sequence.current;
    setBusy(true);
    setConfirm(false);
    try {
      const result = await callService<{ askPilot: Pilot; customerAi: Pilot }>(
        "readOwnerConfiguration",
        {},
      );
      if (!validBudget(result[configurationKey], customer))
        throw Error("INVALID_CONFIGURATION");
      if (mounted.current && request === sequence.current)
        setPilot(result[configurationKey]);
    } catch {
      if (mounted.current && request === sequence.current) {
        setPilot(null);
        publish("Chưa tải được AI Budget. Bấm tải lại để kiểm tra.");
      }
    } finally {
      if (mounted.current && request === sequence.current) setBusy(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      sequence.current++;
    };
  }, []);
  useEffect(() => {
    if (!confirm) return;
    const dialog = confirmation.current;
    dialog?.showModal();
    title.current?.focus();
    return () => dialog?.close();
  }, [confirm]);
  function cancel() {
    setConfirm(false);
    button.current?.focus();
  }
  async function save(enabled: boolean) {
    if (running.current || (!pilot && !pending.current) || busy) return;
    running.current = true;
    setBusy(true);
    setConfirm(false);
    publish("");
    const command = pending.current ?? {
      action: customer ? "saveAskCustomerPolicy" : "saveAskPilotPolicy",
      operationId: crypto.randomUUID(),
      ...(pilot?.version == null ? {} : { expectedVersion: pilot.version }),
      payload: {
        enabled,
        ...(customer
          ? { audience: promote ? "customers" : "owner-canary" }
          : {}),
      },
    };
    pending.current = command;
    let acknowledged = false;
    try {
      await callService("workspaceCommand", command);
      acknowledged = true;
      pending.current = null;
      const result = await callService<{ askPilot: Pilot; customerAi: Pilot }>(
        "readOwnerConfiguration",
        {},
      );
      if (!validBudget(result[configurationKey], customer))
        throw Error("INVALID_CONFIGURATION");
      if (!mounted.current) return;
      setPilot(result[configurationKey]);
      publish(
        result[configurationKey].enabled ===
          (command.payload as { enabled: boolean }).enabled
          ? result[configurationKey].enabled
            ? customer
              ? "Đã cập nhật phạm vi AI. Kiểm tra trạng thái bên dưới."
              : "Đã bật AI cho tài khoản của bạn."
            : "Đã tắt AI."
          : "Trạng thái hiện tại khác thao tác vừa gửi. Kiểm tra cấu hình trước khi tiếp tục.",
      );
    } catch (error) {
      const code = String((error as { code?: string }).code ?? "").replace(
        /^functions\//,
        "",
      );
      if (
        [
          "invalid-argument",
          "permission-denied",
          "unauthenticated",
          "failed-precondition",
          "aborted",
          "already-exists",
        ].includes(code)
      )
        pending.current = null;
      if (mounted.current) {
        setPilot(null);
        publish(
          (error as { details?: { reason?: string } }).details?.reason ===
            "ACTION_NOT_RESUMED"
            ? "Chưa xác thực xong. Cấu hình chưa được thay đổi."
            : acknowledged
              ? "Thao tác đã trả kết quả, nhưng chưa đọc được trạng thái. Tải lại cấu hình để kiểm tra."
              : pending.current
                ? "Chưa xác nhận được kết quả. Thử lại thao tác đang chờ để đối chiếu."
                : "Chưa cập nhật được AI Budget. Thử lại.",
        );
      }
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section
      className="panel askPilot106"
      aria-labelledby={sectionId}
      onKeyDown={(event) => {
        if (event.key === "Escape" && confirm && !busy) {
          event.preventDefault();
          cancel();
        }
      }}
    >
      <header className="budgetHeader">
        <h2 id={sectionId}>
          {customer ? "AI cho khách hàng" : "AI Budget · chủ doanh nghiệp"}
        </h2>
        <span
          className={`aiBadge ${pilot ? (pilot.enabled ? "on" : "off") : "unknown"}`}
        >
          {pilot ? (pilot.enabled ? "Bật" : "Tắt") : "Chưa xác minh"}
        </span>
        <button
          type="button"
          className="budgetReload"
          aria-label={
            customer ? "Tải lại AI cho khách hàng" : "Tải lại AI Budget"
          }
          title="Tải lại"
          disabled={busy}
          onClick={() => void load()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
          </svg>
        </button>
      </header>
      <p className="muted">
        {customer
          ? "AI văn bản cho khách hàng đã đăng nhập và xác minh tài khoản Google. Thử bằng tài khoản chủ doanh nghiệp trước khi mở cho khách hàng."
          : "AI văn bản cho tài khoản chủ doanh nghiệp. Bản nháp chưa phải yêu cầu đã gửi."}
      </p>
      {busy && <p role="status">Đang cập nhật…</p>}
      {pilot && (
        <>
          <dl className="pilotBudget">
            <div>
              <dt>Giới hạn</dt>
              <dd>{money(pilot.maxBudgetVnd)}</dd>
            </div>
            <div>
              <dt>Đã giữ</dt>
              <dd>
                {pilot.reservedVnd === null
                  ? "Chưa xác minh"
                  : money(pilot.reservedVnd)}
              </dd>
            </div>
            <div>
              <dt>Còn lại</dt>
              <dd>
                {pilot.reservedVnd === null
                  ? "Chưa xác minh"
                  : money(Math.max(0, pilot.maxBudgetVnd - pilot.reservedVnd))}
              </dd>
            </div>
          </dl>
          <p className="budgetNote">
            Giữ 1.000 ₫/lượt, kể cả khi lỗi hoặc dừng. Không tự đặt lại ngân
            sách; đây chưa phải hóa đơn cloud.
            {customer &&
              " Tổng giới hạn 50.000 ₫, mỗi tài khoản tối đa 5.000 ₫."}
          </p>
          <p className="muted">
            {pilot.ready
              ? customer
                ? "Đã kiểm tra kết nối AI"
                : "AI sẵn sàng"
              : "Chưa kết nối được AI"}
            {pilot.expiresAt
              ? ` · Hết hạn ${new Date(pilot.expiresAt).toLocaleString("vi-VN")}`
              : ""}
          </p>
          {customer && (
            <p role="status">
              {pilot.enabled
                ? pilot.audience === "customers"
                  ? "Đang mở cho khách hàng đã xác minh."
                  : "Đang thử bằng tài khoản chủ doanh nghiệp."
                : pilot.expiresAt && pilot.expiresAt <= Date.now()
                  ? "Đã hết thời gian bật AI cho khách hàng."
                  : "AI cho khách hàng đang tắt."}
            </p>
          )}
          {confirm && (
            <dialog
              ref={confirmation}
              className="pilotConfirm"
              aria-labelledby={`${sectionId}-confirm`}
              onCancel={(e) => {
                e.preventDefault();
                cancel();
              }}
            >
              <h3 id={`${sectionId}-confirm`} tabIndex={-1} ref={title}>
                {customer
                  ? promote
                    ? "Mở AI cho khách hàng?"
                    : "Bật thử AI trước khi mở cho khách hàng?"
                  : "Bật AI cho tài khoản của bạn?"}
              </h3>
              <p>
                {customer
                  ? "Bật tối đa 24 giờ trong ngân sách còn lại của giới hạn 50.000 ₫. Không đặt lại số tiền đã giữ. Cần xác thực hai lớp gần đây."
                  : "Bật cho tài khoản của bạn trong tối đa 24 giờ, trong ngân sách còn lại. Cần xác thực hai lớp gần đây."}
              </p>
              <button type="button" onClick={cancel}>
                Hủy xác nhận
              </button>
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => void save(true)}
              >
                Xác nhận bật AI
              </button>
            </dialog>
          )}
        </>
      )}

      <footer className="pilotActions">
        {customer && pilot?.enabled && pilot.audience === "owner-canary" && (
          <button
            type="button"
            disabled={
              busy ||
              Boolean(pending.current) ||
              !pilot.ready ||
              !pilot.canPromote ||
              pilot.reservedVnd === null ||
              pilot.reservedVnd >= pilot.maxBudgetVnd
            }
            onClick={() => {
              setPromote(true);
              setConfirm(true);
            }}
          >
            Mở cho khách hàng
          </button>
        )}
        <button
          ref={button}
          type="button"
          className="primary"
          disabled={
            busy ||
            (!pilot && !pending.current) ||
            (!pending.current &&
              !pilot?.enabled &&
              (!pilot?.ready ||
                pilot.reservedVnd === null ||
                pilot.reservedVnd >= pilot.maxBudgetVnd))
          }
          onClick={() => {
            if (pending.current)
              void save(
                (pending.current.payload as { enabled: boolean }).enabled,
              );
            else if (pilot?.enabled) void save(false);
            else {
              setPromote(false);
              setConfirm(true);
            }
          }}
        >
          {(
            pending.current
              ? (pending.current.payload as { enabled: boolean }).enabled
              : !pilot?.enabled
          )
            ? "Bật AI"
            : "Tắt AI"}
        </button>
      </footer>
    </section>
  );
}
