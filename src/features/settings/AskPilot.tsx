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
};
const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
export function AskPilot() {
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
      const result = await callService<{ askPilot: Pilot }>(
        "readOwnerConfiguration",
        {},
      );
      if (mounted.current && request === sequence.current)
        setPilot(result.askPilot);
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
    if (running.current || !pilot || busy) return;
    running.current = true;
    setBusy(true);
    setConfirm(false);
    publish("");
    const command = pending.current ?? {
      action: "saveAskPilotPolicy",
      operationId: crypto.randomUUID(),
      ...(pilot.version === null ? {} : { expectedVersion: pilot.version }),
      payload: { enabled },
    };
    pending.current = command;
    let acknowledged = false;
    try {
      await callService("workspaceCommand", command);
      acknowledged = true;
      pending.current = null;
      const result = await callService<{ askPilot: Pilot }>(
        "readOwnerConfiguration",
        {},
      );
      if (!mounted.current) return;
      setPilot(result.askPilot);
      publish(
        result.askPilot.enabled ===
          (command.payload as { enabled: boolean }).enabled
          ? result.askPilot.enabled
            ? "Đã bật AI cho tài khoản của bạn."
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
      if (mounted.current)
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
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section
      className="panel askPilot106"
      aria-labelledby="askPilotTitle"
      onKeyDown={(event) => {
        if (event.key === "Escape" && confirm && !busy) {
          event.preventDefault();
          cancel();
        }
      }}
    >
      <header className="budgetHeader">
        <h2 id="askPilotTitle">AI Budget</h2>
        <span
          className={`aiBadge ${pilot ? (pilot.enabled ? "on" : "off") : "unknown"}`}
        >
          {pilot ? (pilot.enabled ? "Bật" : "Tắt") : "Chưa xác minh"}
        </span>
        <button
          type="button"
          className="budgetReload"
          aria-label="Tải lại AI Budget"
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
        AI văn bản cho tài khoản chủ doanh nghiệp. Bản nháp chưa phải yêu cầu đã gửi.
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
          </p>
          <p className="muted">
            {pilot.ready ? "AI sẵn sàng" : "Chưa kết nối được AI"}
            {pilot.expiresAt
              ? ` · Hết hạn ${new Date(pilot.expiresAt).toLocaleString("vi-VN")}`
              : ""}
          </p>
          {confirm && (
            <dialog
              ref={confirmation}
              className="pilotConfirm"
              aria-labelledby="askPilotConfirm"
              onCancel={(e) => {
                e.preventDefault();
                cancel();
              }}
            >
              <h3 id="askPilotConfirm" tabIndex={-1} ref={title}>
                Bật AI cho tài khoản của bạn?
              </h3>
              <p>
                Bật cho tài khoản của bạn trong tối đa 24 giờ, trong ngân sách
                còn lại. Cần xác thực hai lớp gần đây.
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
        <button
          ref={button}
          type="button"
          className="primary"
          disabled={
            busy ||
            !pilot ||
            (!pending.current &&
              !pilot.enabled &&
              (!pilot.ready ||
                pilot.reservedVnd === null ||
                pilot.reservedVnd >= pilot.maxBudgetVnd))
          }
          onClick={() => {
            if (pending.current)
              void save(
                (pending.current.payload as { enabled: boolean }).enabled,
              );
            else if (pilot?.enabled) void save(false);
            else setConfirm(true);
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
