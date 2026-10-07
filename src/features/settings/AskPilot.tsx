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
  const [pilot, setPilot] = useState<Pilot | null>(null),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [, setMessage] = useState("");
  function publish(text: string) {
    setMessage(text);
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
        publish("Chưa tải được cấu hình thử Ask. Tải lại để kiểm tra.");
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
    if (confirm) title.current?.focus();
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
            ? "Đã bật thử Ask cho tài khoản của bạn."
            : "Đã dừng thử Ask."
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
                : "Chưa lưu được cấu hình Ask. Bạn có thể thử lại.",
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
      <h2 id="askPilotTitle">Thử Ask</h2>
      <p>
        Chỉ thử bằng văn bản cho tài khoản chủ doanh nghiệp. Bản nháp chưa phải
        yêu cầu đã gửi hoặc đơn đã thanh toán.
      </p>
      {busy && <p role="status">Đang xử lý cấu hình thử Ask…</p>}
      {pilot && (
        <>
          <dl className="pilotBudget">
            <div>
              <dt>Giới hạn thử</dt>
              <dd>{money(pilot.maxBudgetVnd)}</dd>
            </div>
            <div>
              <dt>Đã giữ cho lượt thử</dt>
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
          <p>
            Mỗi lượt giữ 1.000 ₫, kể cả khi lỗi hoặc dừng. Không tự tăng hoặc
            đặt lại ngân sách. Đây là giới hạn thử AI, chưa phải tổng hóa đơn
            cloud.
          </p>
          <p>
            {pilot.enabled ? "Đang bật thử" : "Chưa bật thử"} ·{" "}
            {pilot.ready ? "Kết nối AI sẵn sàng" : "Chưa kết nối được AI"}
          </p>
          {pilot.expiresAt && (
            <p>Hết hạn: {new Date(pilot.expiresAt).toLocaleString("vi-VN")}</p>
          )}
          <div className="pilotActions">
            <button
              ref={button}
              type="button"
              className="primary"
              disabled={
                busy ||
                !!pending.current ||
                !pilot.ready ||
                pilot.reservedVnd === null ||
                pilot.reservedVnd >= pilot.maxBudgetVnd ||
                pilot.enabled
              }
              onClick={() => setConfirm(true)}
            >
              Bật thử Ask
            </button>
            <button
              type="button"
              disabled={busy || !!pending.current || !pilot.enabled}
              onClick={() => void save(false)}
            >
              Dừng thử
            </button>
          </div>
          {confirm && (
            <section className="pilotConfirm" aria-labelledby="askPilotConfirm">
              <h3 id="askPilotConfirm" tabIndex={-1} ref={title}>
                Xác nhận bật thử Ask
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
                Xác nhận bật thử
              </button>
            </section>
          )}
        </>
      )}

      {pending.current ? (
        <button type="button" disabled={busy} onClick={() => void save(false)}>
          Thử lại thao tác đang chờ
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => void load()}>
          Tải lại cấu hình thử Ask
        </button>
      )}
    </section>
  );
}
