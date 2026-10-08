import { notify } from "../../shared/feedback";
import { PageTabs } from "../../shared/PageTabs";
import "../crm/finance-content095.css";
import "./finance-workbench112.css";
import {
  CrmIcon,
  CrmHeading,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import {
  FinancialReview,
  financeRejection,
  financeAuthorityDenied,
  type FinanceTransport,
} from "./FinancialReview";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Order } from "../../../packages/domain";
import { callService, sendCommand } from "../../shared/firebase";
type Scope = "transferReviews" | "membershipInvoices" | "paymentExceptions";
export function financeStateLabel(
  state: string,
  kind: "invoice" | "exception",
) {
  const labels: Record<string, string> =
    kind === "invoice"
      ? {
          paid: "Đã xác nhận tiền",
          cancelled: "Đã hủy yêu cầu",
          pending: "Chờ xác nhận tiền",
        }
      : {
          open: "Cần đối soát",
          allocated: "Đã phân bổ vào đơn",
          closed: "Đã đóng sau đối soát",
        };
  return Object.hasOwn(labels, state)
    ? labels[state]
    : "Cần kiểm tra trạng thái";
}
type Invoice = {
  id: string;
  ownerId: string;
  amount: number;
  state: string;
  planSnapshot: { name: string };
};
type TransferReview = {
  id: string;
  orderId: string;
  amount: number;
  reference: string;
  status: string;
};
export function Finance() {
  const [reviews, setReviews] = useState<TransferReview[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]),
    [exceptions, setExceptions] = useState<
      {
        id: string;
        amount: number;
        state: string;
        reason: string;
        inboundVerified?: boolean;
      }[]
    >([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [scope, setScope] = useState<Scope>("transferReviews"),
    [held, setHeld] = useState(false),
    [authority, setAuthority] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const request = useRef(0),
    mounted = useRef(false),
    sending = useRef(false),
    confirmation = useRef<Record<string, unknown> | null>(null),
    confirmationToken = useRef<symbol | null>(null),
    cursors = useRef<Record<string, string | undefined>>({}),
    denied = useRef(false),
    reloadAfterMount = useRef(false),
    focusAfterRecovery = useRef(false),
    surface = useRef<HTMLElement | null>(null),
    active = useRef<{
      token: symbol;
      kind: "read" | "write";
      inFlight: boolean;
    } | null>(null);
  const blocked = held;
  const [pages, setPages] = useState<Record<string, string | null>>({});
  function acquire(kind: "read" | "write", recovery = false) {
    if (!mounted.current || active.current || (denied.current && !recovery))
      return null;
    const token = Symbol(kind);
    active.current = { token, kind, inFlight: true };
    setHeld(true);
    setBusy(true);
    return token;
  }
  function finish(token: symbol, unknown = false) {
    if (active.current?.token !== token) return;
    active.current.inFlight = false;
    if (!unknown) active.current = null;
    if (!mounted.current) return;
    setBusy(false);
    setHeld(unknown);
    if (!unknown && reloadAfterMount.current && !denied.current) {
      reloadAfterMount.current = false;
      void load();
    }
  }
  function deny() {
    if (!mounted.current) return;
    denied.current = true;
    ++request.current;
    reloadAfterMount.current = false;
    confirmation.current = null;
    confirmationToken.current = null;
    setUncertain(false);
    setReviews([]);
    setInvoices([]);
    setExceptions([]);
    setPages({});
    cursors.current = {};
    setError("");

    setAuthority(true);
  }
  const transport: FinanceTransport = {
    acquire: () => acquire("write"),
    begin: (token) => {
      if (
        !mounted.current ||
        denied.current ||
        active.current?.token !== token ||
        active.current.inFlight
      )
        return false;
      active.current.inFlight = true;
      setBusy(true);
      return true;
    },
    finish,
    deny,
  };
  async function readQueues(token: symbol, recovery = false) {
    const current = ++request.current;
    const after: Record<string, string | undefined> = recovery
      ? {}
      : cursors.current;
    function observeAuthority<T>(promise: Promise<T>): Promise<T> {
      return promise.catch((cause: unknown) => {
        if (
          mounted.current &&
          current === request.current &&
          active.current?.token === token &&
          financeAuthorityDenied(cause)
        )
          deny();
        throw cause;
      });
    }
    const results = await Promise.allSettled([
      observeAuthority(
        callService<{ rows: Invoice[]; next: string | null }>("listWork", {
          kind: "membershipInvoices",
          ...(after.membershipInvoices
            ? { after: after.membershipInvoices }
            : {}),
        }),
      ),
      observeAuthority(
        callService<{ rows: typeof exceptions; next: string | null }>(
          "listWork",
          {
            kind: "paymentExceptions",
            ...(after.paymentExceptions
              ? { after: after.paymentExceptions }
              : {}),
          },
        ),
      ),
      observeAuthority(
        callService<{ rows: TransferReview[]; next: string | null }>(
          "listWork",
          {
            kind: "transferReviews",
            ...(after.transferReviews ? { after: after.transferReviews } : {}),
          },
        ),
      ),
    ]);
    if (
      !mounted.current ||
      current !== request.current ||
      active.current?.token !== token
    )
      return;
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length) {
      const failure =
        failures.find((result) => financeAuthorityDenied(result.reason)) ??
        failures[0];
      if (financeAuthorityDenied(failure.reason)) deny();
      throw failure.reason;
    }
    const [i, e, t] = results;
    if (
      i.status !== "fulfilled" ||
      e.status !== "fulfilled" ||
      t.status !== "fulfilled"
    )
      return;
    setPages({
      membershipInvoices: i.value.next,
      paymentExceptions: e.value.next,
      transferReviews: t.value.next,
    });
    setReviews(t.value.rows);
    setInvoices(i.value.rows);
    setExceptions(e.value.rows);
    if (recovery) {
      cursors.current = {};
      denied.current = false;
      focusAfterRecovery.current = true;
      setAuthority(false);
    }
  }
  async function load(recovery = false) {
    const token = acquire("read", recovery);
    if (!token) return;
    setError("");
    try {
      await readQueues(token, recovery);
    } catch (cause) {
      if (!mounted.current || financeAuthorityDenied(cause)) return;
      setError(
        denied.current
          ? "Chưa kiểm tra được quyền truy cập. Thử lại."
          : "Chưa tải được hàng đợi tài chính. Dữ liệu đang hiển thị chưa được cập nhật.",
      );
    } finally {
      finish(token);
    }
  }
  useEffect(() => {
    mounted.current = true;
    if (active.current?.kind === "read") reloadAfterMount.current = true;
    else void load();
    return () => {
      mounted.current = false;
      request.current++;
    };
  }, []);
  useEffect(() => {
    if (authority || focusAfterRecovery.current) {
      surface.current?.focus();
      focusAfterRecovery.current = false;
    }
  }, [authority]);
  async function loadNext(kind: Scope) {
    const after = pages[kind];
    if (!after) return;
    const token = acquire("read");
    if (!token) return;
    const current = ++request.current;
    setError("");
    try {
      const result = await callService<{
        rows: unknown[];
        next: string | null;
      }>("listWork", { kind, after });
      if (
        !mounted.current ||
        current !== request.current ||
        active.current?.token !== token
      )
        return;
      if (kind === "membershipInvoices") setInvoices(result.rows as Invoice[]);
      if (kind === "transferReviews")
        setReviews(result.rows as TransferReview[]);
      if (kind === "paymentExceptions")
        setExceptions(result.rows as typeof exceptions);
      cursors.current[kind] = after;
      setPages((previous) => ({ ...previous, [kind]: result.next }));
    } catch (cause) {
      if (!mounted.current || current !== request.current) return;
      if (financeAuthorityDenied(cause)) deny();
      else
        setError(
          "Chưa tải được trang tiếp theo. Dữ liệu đang hiển thị chưa được cập nhật.",
        );
    } finally {
      finish(token);
    }
  }
  async function confirm(e: FormEvent<HTMLFormElement>, invoice: Invoice) {
    e.preventDefault();
    if (sending.current) return;
    const token = transport.acquire();
    if (!token) return;
    const f = new FormData(e.currentTarget);
    confirmationToken.current = token;
    confirmation.current = {
      action: "confirm",
      operationId: crypto.randomUUID(),
      invoiceId: invoice.id,
      amount: invoice.amount,
      bankTransactionId: String(f.get("reference")),
      evidence: String(f.get("evidence")),
    };
    await executeConfirmation(true);
  }
  async function executeConfirmation(started = false) {
    if (!confirmation.current || !confirmationToken.current || sending.current)
      return;
    const token = confirmationToken.current;
    if (!started && !transport.begin(token)) return;
    const command = confirmation.current;
    let unknown = false,
      committed = false;
    sending.current = true;
    setError("");

    try {
      await callService("membershipCommand", command);
      committed = true;
      confirmation.current = null;
      confirmationToken.current = null;
      if (!mounted.current) return;
      setUncertain(false);
      notify("Đã xác nhận tiền vào và kích hoạt gói thành viên.", "success");
      await readQueues(token);
    } catch (cause) {
      if (!mounted.current) return;
      if (committed) {
        if (!denied.current)
          setError("Đã xác nhận tiền nhưng chưa tải được hàng đợi mới.");
      } else {
        const rejected = financeRejection(cause, "membershipCommand");
        unknown = !rejected;
        if (rejected) {
          confirmation.current = null;
          confirmationToken.current = null;
        }
        if (financeAuthorityDenied(cause)) deny();
        else {
          setUncertain(unknown);
          setError(
            rejected
              ? "Chưa xác nhận được. Kiểm tra giao dịch, bằng chứng và xác thực hai lớp gần đây."
              : "Chưa xác nhận được kết quả. Thử lại thao tác đang chờ với đúng hóa đơn và bằng chứng đã gửi.",
          );
        }
      }
    } finally {
      sending.current = false;
      finish(token, unknown);
    }
  }
  if (authority)
    return (
      <section
        className="fc095 fc095Finance financeWorkbench112"
        ref={surface}
        tabIndex={-1}
      >
        <CrmHeading title="Thanh toán & đối soát" />
        <CrmState kind="error" title="Cần kiểm tra lại quyền truy cập." />
        {busy && (
          <CrmState kind="loading" title="Đang kiểm tra quyền truy cập…" />
        )}
        {error && <CrmState kind="error" title={error} />}
        <button disabled={busy || blocked} onClick={() => void load(true)}>
          Kiểm tra lại quyền
        </button>
      </section>
    );
  return (
    <section
      className="fc095 fc095Finance financeWorkbench112"
      ref={surface}
      tabIndex={-1}
    >
      <CrmHeading
        title="Thanh toán & đối soát"
        description="Kiểm tra tiền vào, kích hoạt gói và xử lý giao dịch chưa khớp."
        reload={
          <button disabled={busy || blocked} onClick={() => void load()}>
            <CrmIcon name="refresh" /> Tải lại
          </button>
        }
      />
      <p className="financePurpose">
        Đối chiếu giao dịch ngân hàng, xác nhận tiền vào và xử lý khoản chưa
        khớp.
      </p>
      <PageTabs
        id="finance"
        label="Nhóm đối soát"
        value={scope}
        onChange={setScope}
        disabled={busy || blocked}
        items={[
          { value: "transferReviews", label: "Chuyển khoản" },
          { value: "membershipInvoices", label: "Hóa đơn thành viên" },
          { value: "paymentExceptions", label: "Ngoại lệ" },
        ]}
      />
      <p className="financePageHint">
        Mỗi nhóm hiển thị tối đa 30 bản ghi trên trang hiện tại, không phải tổng
        toàn hệ thống.
      </p>
      {busy && <CrmState kind="loading" title="Đang tải / lưu tài chính…" />}
      {error && <CrmState kind="error" title={error} />}
      {uncertain && (
        <div className="notice" role="status">
          <CrmReference
            label="Hóa đơn đang chờ"
            value={String(confirmation.current?.invoiceId ?? "")}
          />
          <button
            className="primary"
            disabled={busy}
            onClick={() => void executeConfirmation()}
          >
            Thử lại thao tác đang chờ
          </button>
        </div>
      )}
      <section
        className="financeQueue"
        id="finance-panel-transferReviews"
        role="tabpanel"
        aria-labelledby="finance-tab-transferReviews"
        tabIndex={0}
        hidden={scope !== "transferReviews"}
      >
        <h2 className="crmSectionHeading">
          <CrmIcon name="clock" /> Thông báo chuyển khoản
        </h2>
        <p className="financeQueueDescription">
          Kiểm tra đúng đơn, số tiền và tài khoản nhận trước khi xác nhận. Thông
          báo của khách chưa phải tiền đã xác nhận.
        </p>
        {!busy && !error && !reviews.some((r) => r.status === "pending") && (
          <CrmState
            kind="empty"
            title="Chưa có thông báo chờ đối soát trong trang này."
          >
            <p>
              Chọn nhóm khác để kiểm tra hóa đơn thành viên hoặc ngoại lệ thanh
              toán.
            </p>
          </CrmState>
        )}
        {reviews
          .filter((r) => r.status === "pending")
          .map((r) => (
            <TransferReviewForm
              key={r.id}
              review={r}
              onChanged={readQueues}
              transport={transport}
              disabled={busy || blocked}
            />
          ))}
        {pages.transferReviews && (
          <button
            disabled={busy || blocked}
            onClick={() => void loadNext("transferReviews")}
          >
            Trang chuyển khoản tiếp theo
          </button>
        )}
      </section>
      <section
        className="financeQueue"
        id="finance-panel-membershipInvoices"
        role="tabpanel"
        aria-labelledby="finance-tab-membershipInvoices"
        tabIndex={0}
        hidden={scope !== "membershipInvoices"}
      >
        <h2 className="crmSectionHeading">
          <CrmIcon name="document" /> Hóa đơn thành viên
        </h2>
        <p className="financeQueueDescription">
          Xác nhận tiền vào để kích hoạt đúng gói thành viên.
        </p>
        <p className="financeContextNote">
          Tiền gói thành viên chỉ phân bổ cho hóa đơn gói, không thanh toán số
          dư đơn mua hộ.
        </p>
        {!busy && !error && !invoices.length && (
          <CrmState
            kind="empty"
            title="Chưa có hóa đơn thành viên trong trang này."
          />
        )}
        <div className="crmList">
          {invoices.map((i) => (
            <article className="crmItem" key={i.id}>
              <div className="crmItemMain">
                <h3 className="crmItemTitle">
                  {i.planSnapshot?.name || "Gói thành viên"}
                </h3>
              </div>
              <dl className="crmFacts">
                <div>
                  <dt>Số tiền</dt>
                  <dd>
                    <strong>{i.amount.toLocaleString("vi-VN")} ₫</strong>
                  </dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{financeStateLabel(i.state, "invoice")}</dd>
                </div>
              </dl>
              <div className="crmItemMeta">
                <CrmReference label="Mã hóa đơn" value={i.id} />
              </div>
              {i.state === "pending" && (
                <details className="crmItemDetails" name="crm-finance-actions">
                  <summary>Xác nhận tiền vào và kích hoạt gói</summary>
                  <p className="financeContextNote">
                    Chỉ xác nhận khi đã đối chiếu tiền vào đúng tài khoản doanh
                    nghiệp. Thao tác này sẽ kích hoạt gói thành viên.
                  </p>
                  <form className="form" onSubmit={(e) => void confirm(e, i)}>
                    <fieldset className="form" disabled={busy || blocked}>
                      <label>
                        <span className="formLabelText">
                          Mã giao dịch ngân hàng{" "}
                          <span className="requiredMark" aria-hidden="true">
                            *
                          </span>
                        </span>
                        <input
                          name="reference"
                          minLength={4}
                          maxLength={120}
                          required
                        />
                      </label>
                      <label>
                        <span className="formLabelText">
                          Bằng chứng đối soát{" "}
                          <span className="requiredMark" aria-hidden="true">
                            *
                          </span>
                        </span>
                        <textarea
                          name="evidence"
                          minLength={5}
                          maxLength={1000}
                          required
                        />
                      </label>
                      <button disabled={busy || blocked}>
                        Xác nhận tiền vào và kích hoạt gói
                      </button>
                    </fieldset>
                  </form>
                </details>
              )}
            </article>
          ))}
        </div>
        {pages.membershipInvoices && (
          <button
            disabled={busy || blocked}
            onClick={() => void loadNext("membershipInvoices")}
          >
            Trang hóa đơn tiếp theo
          </button>
        )}
      </section>
      <section
        className="financeQueue"
        id="finance-panel-paymentExceptions"
        role="tabpanel"
        aria-labelledby="finance-tab-paymentExceptions"
        tabIndex={0}
        hidden={scope !== "paymentExceptions"}
      >
        <h2 className="crmSectionHeading">
          <CrmIcon name="warning" /> Ngoại lệ thanh toán
        </h2>
        <p className="financeQueueDescription">
          Kiểm tra giao dịch chưa khớp. Chỉ phân bổ vào đơn khi tiền vào đã được
          xác minh.
        </p>
        {!busy && !error && !exceptions.length && (
          <CrmState
            kind="empty"
            title="Chưa có ngoại lệ thanh toán trong trang này."
          />
        )}
        <div className="crmList">
          {exceptions.map((e) => (
            <article className="crmItem" key={e.id}>
              <h3 className="crmItemTitle">Đối soát giao dịch chưa khớp</h3>
              <CrmReference label="Mã ngoại lệ" value={e.id} />
              <dl className="crmFacts">
                <div>
                  <dt>Số tiền</dt>
                  <dd>{e.amount.toLocaleString("vi-VN")} ₫</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{financeStateLabel(e.state, "exception")}</dd>
                </div>
              </dl>
              <p>
                Giao dịch chưa khớp đủ ngữ cảnh đơn và tài khoản nhận. Không tự
                ghi nhận tiền.
              </p>
              <FinancialReview
                exception={e}
                disabled={busy || blocked}
                transport={transport}
              />
            </article>
          ))}
        </div>
        {pages.paymentExceptions && (
          <button
            disabled={busy || blocked}
            onClick={() => void loadNext("paymentExceptions")}
          >
            Trang ngoại lệ tiếp theo
          </button>
        )}
      </section>
      <section
        className="financeSecondary"
        aria-labelledby="finance-secondary-title"
      >
        <h2 id="finance-secondary-title">Điều chỉnh giao dịch</h2>
        <p className="financeQueueDescription">
          Dùng khi ngân hàng đã đảo khoản tiền vào được ghi nhận trước đó.
        </p>
        <FinancialReview disabled={busy || blocked} transport={transport} />
      </section>
    </section>
  );
}

function TransferReviewForm({
  review,
  onChanged,
  transport,
  disabled = false,
}: {
  review: TransferReview;
  onChanged: (token: symbol) => Promise<void>;
  transport: FinanceTransport;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uncertain, setUncertain] = useState(false),
    [done, setDone] = useState(false);
  const pending = useRef<{
      payload: Record<string, unknown>;
      orderId: string;
      expectedVersion: number;
      operationId: string;
    } | null>(null),
    token = useRef<symbol | null>(null),
    sending = useRef(false),
    mounted = useRef(false),
    currentTransport = useRef(transport);
  currentTransport.current = transport;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain || disabled || sending.current) return;
    const lease = currentTransport.current,
      acquired = lease.acquire();
    if (!acquired) return;
    const f = new FormData(event.currentTarget);
    let handedOff = false;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      const current = await callService<{ order: Order }>("orderHistory", {
        orderId: review.orderId,
      });
      if (!mounted.current) return;
      pending.current = {
        payload: {
          amount: review.amount,
          bankTransactionId: String(f.get("bank")),
          evidence: String(f.get("evidence")),
          reason: "Đối soát thông báo chuyển khoản của khách",
          reviewId: review.id,
        },
        orderId: review.orderId,
        expectedVersion: current.order.version,
        operationId: crypto.randomUUID(),
      };
      token.current = acquired;
      sending.current = false;
      handedOff = true;
      await execute(true);
    } catch (cause) {
      if (financeAuthorityDenied(cause)) lease.deny();
      if (mounted.current)
        setError(
          "Chưa kiểm tra được đơn. Kiểm tra lại trước khi xác nhận tiền.",
        );
    } finally {
      if (!handedOff) lease.finish(acquired);
      sending.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function execute(started = false) {
    if (!pending.current || !token.current || sending.current) return;
    const lease = currentTransport.current,
      acquired = token.current;
    if (!started && !lease.begin(acquired)) return;
    const command = pending.current;
    let unknown = false;
    sending.current = true;
    setBusy(true);
    setError("");
    try {
      await sendCommand(
        "verifyTransfer",
        command.payload,
        command.orderId,
        command.expectedVersion,
        command.operationId,
      );
      pending.current = null;
      token.current = null;
      if (!mounted.current) return;
      setUncertain(false);
      setDone(true);
      try {
        await onChanged(acquired);
      } catch {
        if (mounted.current)
          setError("Đã xác nhận tiền nhưng chưa tải được hàng đợi mới.");
      }
    } catch (cause) {
      const rejected = financeRejection(cause, "verifyTransfer");
      unknown = !rejected;
      if (rejected) {
        pending.current = null;
        token.current = null;
      }
      if (financeAuthorityDenied(cause)) lease.deny();
      if (!mounted.current) return;
      setUncertain(unknown);
      setError(
        rejected
          ? "Chưa xác minh được. Kiểm tra giao dịch thực tế, số tiền, phiên bản và xác thực hai lớp gần đây."
          : "Chưa xác nhận được kết quả. Thử lại đúng thao tác và bằng chứng đã gửi.",
      );
    } finally {
      sending.current = false;
      lease.finish(acquired, unknown);
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <article className="crmItem">
      <h3 className="crmItemTitle">
        <CrmIcon name="clock" />
        Chờ đối soát chuyển khoản
      </h3>
      <CrmReference label="Mã đơn" value={review.orderId} />
      <dl className="crmFacts">
        <div>
          <dt>Số tiền khách thông báo</dt>
          <dd>
            <strong>{review.amount.toLocaleString("vi-VN")} ₫</strong>
          </dd>
        </div>
        <div>
          <dt>Nội dung chuyển khoản</dt>
          <dd>{review.reference}</dd>
        </div>
      </dl>
      <p className="financeContextNote">
        Thông báo chưa phải tiền đã xác nhận.
      </p>
      {done ? (
        <p className="notice" role="status">
          Đã xác nhận tiền vào và đóng thông báo.
        </p>
      ) : (
        <details className="crmItemDetails" name="crm-finance-actions">
          <summary>Đối chiếu giao dịch ngân hàng</summary>
          <form className="form" onSubmit={(event) => void verify(event)}>
            <fieldset className="form" disabled={busy || uncertain || disabled}>
              <label>
                <span className="formLabelText">
                  Mã giao dịch trên tài khoản ngân hàng doanh nghiệp{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input name="bank" minLength={4} maxLength={120} required />
              </label>
              <label>
                <span className="formLabelText">
                  Bằng chứng đã đối chiếu đúng tài khoản, đơn và số tiền{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <textarea
                  name="evidence"
                  minLength={5}
                  maxLength={1000}
                  required
                />
              </label>
              <button
                className="primary"
                disabled={busy || uncertain || disabled}
              >
                {busy
                  ? "Đang xác nhận…"
                  : "Xác nhận tiền vào và đóng thông báo này"}
              </button>
            </fieldset>
          </form>
          {uncertain && (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void execute()}
            >
              Thử lại thao tác đang chờ
            </button>
          )}
        </details>
      )}
      {error && <CrmState kind="error" title={error} />}
    </article>
  );
}
