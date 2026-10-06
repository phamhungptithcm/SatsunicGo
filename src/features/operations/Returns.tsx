import {
  CrmHeading,
  CrmIcon,
  CrmReference,
  CrmState,
} from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { callService } from "../../shared/firebase";
export type ReturnRow = {
  id: string;
  orderId: string;
  version: number;
  state: string;
  lines: {
    line: number;
    name: string;
    authorized: number;
    received: number;
    accepted: number;
    damaged: number;
  }[];
};
const labels: Record<string, string> = {
  authorized: "Đã duyệt trả",
  receiving: "Đang nhận trả",
  inspecting: "Đang kiểm tra",
  closed: "Đã hoàn tất kiểm tra",
};
export function returnCardTitle(lines: ReturnRow["lines"]) {
  const first = lines[0]?.name.trim() || "Hàng trả";
  return lines.length > 1
    ? `${first} · thêm ${lines.length - 1} dòng hàng`
    : first;
}
export function Returns({ roles }: { roles: string[] }) {
  const [rows, setRows] = useState<ReturnRow[]>([]),
    [next, setNext] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(0),
    cursor = useRef<string | undefined>(undefined);
  async function load(after: string | undefined = cursor.current) {
    cursor.current = after;
    const current = ++request.current;
    setBusy(true);
    setError("");
    try {
      const result = await callService<{
        rows: ReturnRow[];
        next: string | null;
      }>("listWork", { kind: "orderReturns", ...(after ? { after } : {}) });
      if (request.current !== current) return;
      setRows(result.rows);
      setNext(result.next);
    } catch {
      if (request.current === current) {
        setRows([]);
        setNext(null);
        setError("Chưa tải được hàng trả. Kiểm tra kết nối và thử lại.");
      }
    } finally {
      if (request.current === current) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      request.current++;
    };
  }, []);
  return (
    <section>
      <CrmHeading
        title="Nhận & kiểm tra hàng trả"
        actions={
          <button disabled={busy} onClick={() => void load()}>
            <CrmIcon name="refresh" /> Tải lại
          </button>
        }
      />
      <p className="muted">
        Chỉ nhận hàng theo đề xuất khách đã duyệt. Hoàn tất kiểm tra không tự
        hoàn tiền hoặc gỡ giữ đơn; tài chính cần đối soát riêng.
      </p>
      {busy && <CrmState kind="loading" title="Đang tải hàng trả…" />}
      {error && (
        <CrmState
          kind="error"
          title="Chưa tải được hàng trả"
          action={
            <button disabled={busy} onClick={() => void load()}>
              Thử lại
            </button>
          }
        >
          {error}
        </CrmState>
      )}
      {!busy && !error && !rows.length && (
        <CrmState kind="empty" title="Chưa có hàng trả trong trang này" />
      )}
      {rows.map((r) => (
        <ReturnForm
          key={`${r.id}-${r.version}`}
          row={r}
          canClose={roles.some((role) =>
            ["OWNER", "OPERATIONS_MANAGER"].includes(role),
          )}
          onChanged={load}
        />
      ))}
      {next && (
        <button disabled={busy} onClick={() => void load(next)}>
          Trang tiếp theo
        </button>
      )}
    </section>
  );
}
export function returnPayload(
  form: FormData,
  row: ReturnRow,
  canClose: boolean,
) {
  const action = String(form.get("action"));
  if (
    !["receive", "inspect", "close"].includes(action) ||
    (action === "close" && !canClose)
  )
    throw new Error("Thao tác không hợp lệ.");
  return {
    id: row.id,
    expectedVersion: row.version,
    action,
    evidence: String(form.get("evidence") ?? ""),
    ...(action !== "close"
      ? {
          line: Number(form.get("line")),
          quantity: Number(form.get("quantity")),
        }
      : {}),
    ...(action === "inspect"
      ? { condition: String(form.get("condition")) }
      : {}),
  };
}
export function ReturnActionFields({
  action,
  lines,
}: {
  action: string;
  lines: ReturnRow["lines"];
}) {
  return (
    <>
      {action !== "close" && (
        <>
          <label>
            Dòng hàng
            <select name="line">
              {lines.map((l) => (
                <option value={l.line} key={l.line}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số lượng
            <input
              name="quantity"
              type="number"
              min={1}
              max={100}
              defaultValue={1}
              required
            />
          </label>
        </>
      )}
      {action === "inspect" && (
        <label>
          Kết quả kiểm tra
          <select name="condition">
            <option value="accepted">Hàng đạt</option>
            <option value="damaged">Hàng hỏng</option>
          </select>
        </label>
      )}
    </>
  );
}
export function ReturnQuantitySummary({
  lines,
}: {
  lines: ReturnRow["lines"];
}) {
  const total = lines.reduce(
    (sum, line) => ({
      authorized: sum.authorized + line.authorized,
      received: sum.received + line.received,
      checked: sum.checked + line.accepted + line.damaged,
    }),
    { authorized: 0, received: 0, checked: 0 },
  );
  return (
    <dl className="crmFacts">
      <div>
        <dt>Đã nhận</dt>
        <dd>
          {total.received} / {total.authorized}
        </dd>
      </div>
      <div>
        <dt>Đã kiểm tra</dt>
        <dd>
          {total.checked} / {total.received}
        </dd>
      </div>
    </dl>
  );
}
function ReturnForm({
  row,
  canClose,
  onChanged,
}: {
  row: ReturnRow;
  canClose: boolean;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [action, setAction] = useState("receive"),
    [uncertain, setUncertain] = useState(false);
  const pending = useRef<{
    payload: ReturnType<typeof returnPayload>;
    id: string;
  } | null>(null);
  const sending = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function execute() {
    if (sending.current || !pending.current) return;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await callService("returnCommand", {
        ...pending.current.payload,
        operationId: pending.current.id,
      });
      pending.current = null;
      if (mounted.current) setUncertain(false);
      await onChanged();
    } catch (e) {
      if (!mounted.current) return;
      if (!pending.current) {
        setUncertain(false);
        setError("Đã ghi nhận thao tác. Tải lại để xem hồ sơ mới nhất.");
        return;
      }
      const code = String((e as { code?: string }).code ?? "").replace(
        "functions/",
        "",
      );
      const rejected = [
        "invalid-argument",
        "permission-denied",
        "unauthenticated",
        "failed-precondition",
        "aborted",
        "already-exists",
      ].includes(code);
      if (rejected) pending.current = null;
      setUncertain(!rejected);
      setError(
        rejected
          ? "Chưa xử lý được. Kiểm tra quyền, số lượng và tải lại hồ sơ trước khi tiếp tục."
          : "Chưa xác nhận được kết quả. Thử lại đúng thao tác này; nội dung được giữ nguyên để tránh ghi nhận hai lần.",
      );
    } finally {
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || uncertain) return;
    try {
      pending.current = {
        payload: returnPayload(
          new FormData(event.currentTarget),
          row,
          canClose,
        ),
        id: crypto.randomUUID(),
      };
    } catch {
      setError("Chọn thao tác phù hợp với quyền hiện hành.");
      return;
    }
    await execute();
  }
  return (
    <article className="panel order crmItem">
      <div className="crmItemMain">
        <h2 className="crmItemTitle">
          <CrmIcon name="box" /> {returnCardTitle(row.lines)}
        </h2>
        <div className="crmActions">
          <Link to={`/crm/orders?order=${encodeURIComponent(row.orderId)}`}>
            <CrmIcon name="arrow" /> Mở đơn
          </Link>
        </div>
      </div>
      <div className="crmItemMeta">
        <span className="crmBadge">
          {labels[row.state] ?? "Cần kiểm tra trạng thái"}
        </span>
      </div>
      <details className="crmItemDetails">
        <summary>Thông tin hồ sơ</summary>
        <CrmReference label="Đơn" value={row.orderId} />
        <CrmReference label="Hồ sơ trả" value={row.id} />
      </details>
      <ReturnQuantitySummary lines={row.lines} />
      <details className="crmItemDetails">
        <summary>Chi tiết số lượng</summary>
        <div className="tableWrap crmRecordTable crmReturnsTable">
          <table role="table" aria-label="Số lượng hàng trả">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader" scope="col">
                  Hàng
                </th>
                <th role="columnheader" scope="col">
                  Được trả
                </th>
                <th role="columnheader" scope="col">
                  Đã nhận
                </th>
                <th role="columnheader" scope="col">
                  Đạt
                </th>
                <th role="columnheader" scope="col">
                  Hỏng
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {row.lines.map((l) => (
                <tr role="row" key={l.line}>
                  <td role="cell" data-label="Hàng">
                    {l.name}
                  </td>
                  <td role="cell" data-label="Được trả">
                    {l.authorized}
                  </td>
                  <td role="cell" data-label="Đã nhận">
                    {l.received}
                  </td>
                  <td role="cell" data-label="Đạt">
                    {l.accepted}
                  </td>
                  <td role="cell" data-label="Hỏng">
                    {l.damaged}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {row.state !== "closed" && (
        <details className="crmItemDetails" name="crm-return-actions">
          <summary>
            <CrmIcon name="check" /> Xử lý hàng trả
          </summary>
          <form className="form" onSubmit={(e) => void submit(e)}>
            <fieldset className="form" disabled={busy || uncertain}>
              <label>
                Thao tác
                <select
                  name="action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  <option value="receive">Ghi nhận hàng đã nhận</option>
                  <option value="inspect">Ghi kết quả kiểm tra</option>
                  {canClose && (
                    <option value="close">Hoàn tất kiểm tra toàn bộ</option>
                  )}
                </select>
              </label>
              <ReturnActionFields action={action} lines={row.lines} />
              <label>
                Bằng chứng nội bộ
                <textarea
                  name="evidence"
                  minLength={5}
                  maxLength={1000}
                  required
                />
              </label>
              <button className="primary" disabled={busy}>
                <CrmIcon name="check" />{" "}
                {busy
                  ? "Đang lưu…"
                  : action === "close"
                    ? "Hoàn tất kiểm tra"
                    : action === "inspect"
                      ? "Lưu kết quả kiểm tra"
                      : "Ghi nhận hàng đã nhận"}
              </button>
            </fieldset>
            {uncertain && (
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => void execute()}
              >
                {busy ? "Đang kiểm tra…" : "Thử lại thao tác đã gửi"}
              </button>
            )}
          </form>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  );
}
