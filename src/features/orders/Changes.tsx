import { useEffect, useState, type FormEvent } from "react";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, callService } from "../../shared/firebase";
import type { Order } from "../../../packages/domain";
import type { ChangeProposal } from "../../../packages/domain/changes";
type Change = {
  id: string;
  orderId: string;
  state: string;
  proposal: Omit<ChangeProposal, "evidence">;
};
const labels = {
  substitution: "Thay sản phẩm/biến thể",
  partialCancellation: "Hủy phần chưa mua",
  cancellation: "Hủy đơn và đối soát chi phí",
  return: "Trả hàng và đối soát",
};
export function CustomerChanges({ order }: { order: Order }) {
  const [changes, setChanges] = useState<Change[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setChanges([]);
    if (!db) return;
    return onSnapshot(
      query(
        collection(db, "orderChanges"),
        where("ownerId", "==", order.ownerId),
        where("orderId", "==", order.id),
        limit(20),
      ),
      (s) =>
        setChanges(s.docs.map((d) => ({ ...d.data(), id: d.id }) as Change)),
      () => setError("Chưa tải được đề xuất thay đổi."),
    );
  }, [order.id, order.ownerId]);
  async function review(change: Change, action: "accept" | "reject") {
    setBusy(true);
    setError("");
    try {
      await callService("changeCommand", {
        action,
        orderId: order.id,
        expectedVersion: order.version,
        proposalId: change.id,
        operationId: crypto.randomUUID(),
      });
    } catch {
      setError(
        "Chưa lưu được quyết định. Tải lại đơn để kiểm tra phiên bản rồi thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {changes.map((c) => (
        <article className="panel order" key={c.id}>
          <h3>{labels[c.proposal.kind]}</h3>
          <p>{c.proposal.reason}</p>
          <p>
            Tổng phải trả sau thay đổi:{" "}
            {c.proposal.finalPayable.toLocaleString("vi-VN")} ₫ · chi phí thật
            được ghi nhận: {c.proposal.actualCosts.toLocaleString("vi-VN")} ₫
          </p>
          <p>
            Cọc tối thiểu sau thay đổi:{" "}
            {Math.ceil(c.proposal.finalPayable / 2).toLocaleString("vi-VN")} ₫.
            Tiền đã thu vẫn được giữ trong lịch sử.
          </p>
          <p>Điều khoản đã chấp nhận: {c.proposal.termsVersion}</p>
          {c.proposal.lines.map((l) => (
            <p key={l.line}>
              Dòng {l.line + 1}: {c.proposal.kind === "return" ? "trả" : "hủy"}{" "}
              {l.cancelQuantity}
              {l.replacementName
                ? ` · đổi thành ${l.replacementName}, ${l.replacementVariant ?? ""}`
                : ""}
            </p>
          ))}
          <p>
            {c.state === "pending"
              ? "Chờ bạn duyệt"
              : c.state === "accepted"
                ? "Bạn đã duyệt · chờ nhân viên áp dụng"
                : c.state === "rejected"
                  ? "Bạn đã từ chối"
                  : "Đã áp dụng và ghi lịch sử"}
            . Quyết định này không tự chuyển hoặc hoàn tiền.
          </p>
          {c.state === "pending" && (
            <>
              <button disabled={busy} onClick={() => void review(c, "accept")}>
                Đồng ý thay đổi và tổng phải trả
              </button>
              <button disabled={busy} onClick={() => void review(c, "reject")}>
                Từ chối thay đổi
              </button>
            </>
          )}
        </article>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
export function ProposeChange({
  order,
  onChanged,
}: {
  order: Order;
  onChanged: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function propose(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      lines = order.items
        .map((_, line) => ({
          line,
          cancelQuantity: Number(f.get(`cancel-${line}`)),
          replacementName: String(f.get(`name-${line}`) ?? ""),
          replacementVariant: String(f.get(`variant-${line}`) ?? ""),
        }))
        .filter((l) => l.cancelQuantity > 0 || l.replacementName)
        .map((l) => ({
          line: l.line,
          cancelQuantity: l.cancelQuantity,
          ...(l.replacementName
            ? {
                replacementName: l.replacementName,
                replacementVariant: l.replacementVariant,
              }
            : {}),
        }));
    try {
      await callService("changeCommand", {
        action: "propose",
        operationId: crypto.randomUUID(),
        orderId: order.id,
        expectedVersion: order.version,
        payload: {
          kind: String(f.get("kind")),
          resolveHold: f.get("resolveHold") === "on",
          reason: String(f.get("reason")),
          termsVersion: order.quote?.termsVersion,
          lines,
          finalPayable: Number(f.get("total")),
          actualCosts: Number(f.get("costs")),
          evidence: String(f.get("evidence")),
        },
      });
      onChanged();
    } catch {
      setError(
        "Chưa gửi được. Kiểm tra phần chưa mua, kiện đã phân bổ, điều khoản, chi phí và hold hiện tại.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details>
      <summary>Đề xuất thay đổi để khách duyệt</summary>
      <form className="form" onSubmit={(e) => void propose(e)}>
        <label>
          Loại thay đổi
          <select name="kind">
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {order.items.map((item, line) => (
          <fieldset key={line}>
            <legend>
              {item.name} · {item.variant} · {item.quantity}
            </legend>
            <label>
              Số lượng hủy
              <input
                name={`cancel-${line}`}
                type="number"
                min={0}
                max={item.quantity}
                defaultValue={0}
              />
            </label>
            <label>
              Tên thay thế · không bắt buộc
              <input name={`name-${line}`} maxLength={200} />
            </label>
            <label>
              Biến thể thay thế
              <input name={`variant-${line}`} maxLength={200} />
            </label>
          </fieldset>
        ))}
        <label>
          Lý do hiển thị cho khách
          <textarea name="reason" minLength={5} maxLength={1000} required />
        </label>
        <label>
          Tổng phải trả sau thay đổi (₫)
          <input
            name="total"
            type="number"
            min={0}
            max={1000000000000}
            required
          />
        </label>
        <label>
          Chi phí thực tế đã phát sinh (₫)
          <input
            name="costs"
            type="number"
            min={0}
            max={1000000000000}
            required
          />
        </label>
        <label>
          <input type="checkbox" name="resolveHold" /> Đề xuất đã xử lý nguyên
          nhân hold trước đó
        </label>
        <label>
          Bằng chứng nội bộ · khách không đọc trường này
          <textarea name="evidence" minLength={5} maxLength={1000} required />
        </label>
        <p>
          Không mặc định tịch thu cọc hoặc hứa hoàn tiền. Cần chi phí thật, điều
          khoản đã chấp nhận và quyết định của khách.
        </p>
        <button disabled={busy}>Gửi đề xuất và tạm giữ xử lý</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}
export function ChangeQueue() {
  const [changes, setChanges] = useState<Change[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const r = await callService<{ rows: Change[] }>("listWork", {
        kind: "orderChanges",
      });
      setChanges(r.rows);
    } catch {
      setError("Chưa tải được đề xuất thay đổi.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function apply(c: Change) {
    setBusy(true);
    setError("");
    try {
      const current = await callService<{ order: Order }>("orderHistory", {
        orderId: c.orderId,
      });
      await callService("changeCommand", {
        action: "apply",
        orderId: c.orderId,
        expectedVersion: current.order.version,
        proposalId: c.id,
        operationId: crypto.randomUUID(),
      });
      await load();
    } catch {
      setError(
        "Chưa áp dụng được. Đề xuất cần khách duyệt và phần hàng/kiện vẫn phải khớp.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>Thay đổi đã được khách duyệt</h2>
      <button onClick={() => void load()}>Tải lại đề xuất</button>
      {changes
        .filter((c) => c.state === "accepted")
        .map((c) => (
          <article className="panel" key={c.id}>
            <h3>
              {labels[c.proposal.kind]} · {c.orderId}
            </h3>
            <p>{c.proposal.reason}</p>
            <button disabled={busy} onClick={() => void apply(c)}>
              Áp dụng quyết định đã duyệt
            </button>
          </article>
        ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
