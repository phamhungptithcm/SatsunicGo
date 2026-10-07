import { LoadingState } from "../../shared/Loading";
import {
  CrmIcon,
  CrmHeading,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { auth, callService } from "../../shared/firebase";
import type { SalesDocument, Seller } from "../../../packages/domain/invoices";
import "./documents.css";
import { LatestDocumentRequest } from "./document-requests";
type List = {
  rows: SalesDocument[];
  next: string | null;
  canIssue: boolean;
  canConfigure: boolean;
  seller: { seller: Seller; version: number } | null;
};
type Statement = Pick<
  SalesDocument,
  | "seller"
  | "lines"
  | "total"
  | "netCollected"
  | "remainingDue"
  | "overpayment"
  | "issuedAt"
  | "issueNumber"
  | "state"
  | "termsVersion"
  | "purchaseKind"
> &
  Partial<
    Pick<
      SalesDocument,
      "buyerName" | "sourceOrderId" | "voidReason" | "createdAt"
    >
  >;
const amount = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
export function StatementView({ document: d }: { document: Statement }) {
  return (
    <article className="salesStatement">
      <h2>Hóa đơn nội bộ</h2>
      <p className="muted">
        Không phải hóa đơn điện tử thuế.{" "}
        {d.state === "draft"
          ? "Số tiền được ghi nhận khi lập hoặc cập nhật bản nháp."
          : "Số tiền được ghi nhận tại thời điểm xuất."}
      </p>
      <p>
        <strong>{d.seller.name}</strong>
        <br />
        {d.seller.address}
        <br />
        {d.seller.contact}
      </p>
      <p>
        Số hóa đơn: {d.issueNumber ?? "Bản nháp"}
        <br />
        {d.issuedAt
          ? `Xuất: ${new Date(d.issuedAt).toLocaleString("vi-VN")}`
          : "Chưa xuất"}
      </p>
      {d.buyerName && <p>Khách hàng: {d.buyerName}</p>}
      {d.state === "void" && (
        <p role="status" className="error">
          Đã hủy · {d.voidReason}
        </p>
      )}
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm trong đơn</th>
              <th>Mẫu</th>
              <th>Số lượng theo đơn</th>
            </tr>
          </thead>
          <tbody>
            {d.lines.map((line, i) => (
              <tr key={i}>
                <td>{line.name}</td>
                <td>{line.variant || "—"}</td>
                <td>{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="statementTotals">
        <dt>Tổng chi phí đã duyệt</dt>
        <dd>{amount(d.total)}</dd>
        <dt>Tiền đã xác nhận sau hoàn tiền</dt>
        <dd>{amount(d.netCollected)}</dd>
        <dt>
          {d.state === "draft"
            ? "Còn phải thanh toán trong bản nháp"
            : "Còn phải thanh toán tại thời điểm xuất"}
        </dt>
        <dd>{amount(d.remainingDue)}</dd>
        {d.overpayment > 0 && (
          <>
            <dt>
              {d.state === "draft"
                ? "Tiền trả thừa trong bản nháp"
                : "Tiền trả thừa tại thời điểm xuất"}
            </dt>
            <dd>{amount(d.overpayment)}</dd>
          </>
        )}
      </dl>
      <p>
        {d.purchaseKind === "catalog"
          ? "Đơn niêm yết thanh toán toàn bộ một lần; hóa đơn không tạo khoản thu thứ hai."
          : "Đơn mua hộ tùy chỉnh thanh toán hai đợt; xem đơn để kiểm tra số dư hiện tại."}
      </p>
      <p>
        Điều khoản: {d.termsVersion}. Hóa đơn không xác nhận ngân hàng đã chuyển
        tiền ngoài các khoản hệ thống ghi nhận.
      </p>
      <button
        className="noPrint primary"
        disabled={d.state !== "issued"}
        onClick={() => window.print()}
      >
        In / Lưu PDF
      </button>
    </article>
  );
}
export function Documents({ staff = false }: { staff?: boolean }) {
  const [search] = useSearchParams(),
    [list, setList] = useState<List | null>(null),
    [selected, setSelected] = useState<SalesDocument | null>(null),
    [detailLoading, setDetailLoading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [share, setShare] = useState("");
  const [mobileDetail, setMobileDetail] = useState(false);
  const detailTarget = useRef<HTMLElement | null>(null);
  const returnTarget = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (selected && !detailLoading)
      detailTarget.current?.focus({ preventScroll: true });
  }, [selected, detailLoading]);
  const orderFilter = search.get("order") ?? "";
  const listRequest = useRef(0);
  const detailRequest = useRef(new LatestDocumentRequest());
  const viewRevision = useRef(0);
  const executing = useRef(false);
  const operation = useRef<{
      key: string;
      payload: Record<string, unknown>;
      operationId: string;
    } | null>(null),
    storageKey = `invoice-operation-${auth?.currentUser?.uid ?? "anonymous"}`;
  const [pending, setPending] = useState(false);
  async function load(after?: string) {
    const request = ++listRequest.current;
    setError("");
    try {
      const r = await callService<List>("invoiceList", {
        ...(after ? { after } : {}),
        ...(orderFilter ? { orderId: orderFilter } : {}),
      });
      if (request === listRequest.current) setList(r);
    } catch {
      if (request === listRequest.current)
        setError("Chưa tải được hóa đơn. Đăng nhập và thử lại.");
    }
  }
  useEffect(() => {
    viewRevision.current++;
    detailRequest.current.invalidate();
    executing.current = false;
    setBusy(false);
    setPending(false);
    operation.current = null;
    setSelected(null);
    setMobileDetail(false);
    returnTarget.current = null;
    setDetailLoading(false);
    setList(null);
    setShare("");
    setMessage("");
    setError("");
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      if (
        saved &&
        typeof saved.operationId === "string" &&
        saved.payload &&
        typeof saved.payload.action === "string"
      ) {
        operation.current = saved;
        setPending(true);
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
    void load();
    return () => {
      listRequest.current++;
      detailRequest.current.invalidate();
      viewRevision.current++;
    };
  }, [storageKey, staff, orderFilter]);
  async function execute(payload: Record<string, unknown>, retry = false) {
    if (executing.current) return;
    const revision = viewRevision.current;
    executing.current = true;
    detailRequest.current.invalidate();
    setDetailLoading(false);
    setBusy(true);
    setError("");
    setMessage("");
    const key = JSON.stringify(payload);
    if (!retry && (pending || operation.current)) {
      executing.current = false;
      setBusy(false);
      setError("Kiểm tra lại thao tác đang chờ trước khi tạo thao tác khác.");
      return;
    }
    if (!retry || !operation.current)
      operation.current = { key, payload, operationId: crypto.randomUUID() };
    const current = operation.current!;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(current));
      setPending(true);
      const r = await callService<{ id?: string; token?: string }>(
        "invoiceCommand",
        { ...current.payload, operationId: current.operationId },
      );
      // A response for another route must not reopen its document or share.
      // Keep its durable operation so an uncertain outcome can be checked safely.
      if (revision !== viewRevision.current) return;
      sessionStorage.removeItem(storageKey);
      operation.current = null;
      setPending(false);
      if (current.payload.action === "createShare") {
        if (r.token) setShare(`${location.origin}/documents/shared#${r.token}`);
        else
          setMessage(
            "Thao tác chia sẻ đã hoàn tất nhưng chưa lấy được link. Thu hồi link rồi tạo link mới.",
          );
      } else {
        setShare("");
        setMessage(
          current.payload.action === "queueEmail"
            ? "Đã xếp lịch gửi email (kiểm tra mỗi 30 phút); chưa xác nhận khách đã nhận."
            : "Đã lưu thao tác hóa đơn.",
        );
      }
      await load();
      if (revision !== viewRevision.current) return;
      if (r.id && current.payload.action !== "configure") {
        setDetailLoading(true);
        await detailRequest.current.run(
          () => callService<SalesDocument>("invoiceDetail", { id: r.id }),
          (document) => {
            setSelected(document);
            setMobileDetail(true);
            setDetailLoading(false);
          },
          () => {
            setDetailLoading(false);
            setSelected(null);
            setError(
              "Thao tác đã lưu nhưng chưa tải được hóa đơn. Tải lại rồi mở hóa đơn.",
            );
          },
        );
      }
    } catch (e) {
      if (revision !== viewRevision.current) return;
      const code = (e as { code?: string }).code ?? "";
      if (
        [
          "functions/permission-denied",
          "functions/unauthenticated",
          "functions/failed-precondition",
          "functions/invalid-argument",
          "functions/aborted",
          "functions/already-exists",
          "functions/not-found",
        ].includes(code)
      ) {
        sessionStorage.removeItem(storageKey);
        operation.current = null;
        setPending(false);
      }
      setError(
        (e as Error).message || "Chưa rõ kết quả. Kiểm tra lại cùng thao tác.",
      );
    } finally {
      if (revision === viewRevision.current) {
        executing.current = false;
        setBusy(false);
      }
    }
  }
  async function open(id: string, trigger?: HTMLButtonElement) {
    if (executing.current || operation.current || busy || pending) return;
    if (trigger) returnTarget.current = trigger;
    setMobileDetail(true);
    setError("");
    setShare("");
    setMessage("");
    setSelected(null);
    setDetailLoading(true);
    await detailRequest.current.run(
      () => callService<SalesDocument>("invoiceDetail", { id }),
      (document) => {
        setSelected(document);
        setDetailLoading(false);
      },
      () => {
        setDetailLoading(false);
        setError("Không thể mở hóa đơn này. Thử mở lại.");
      },
    );
  }

  function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (executing.current || operation.current || busy || pending) return;
    returnTarget.current = e.currentTarget.querySelector<HTMLButtonElement>(
      "button[type=submit], button:not([type])",
    );
    const f = new FormData(e.currentTarget);
    void execute({ action: "createDraft", orderId: String(f.get("order")) });
  }
  function configure(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void execute({
      action: "configure",
      seller: {
        name: String(f.get("name")),
        address: String(f.get("address")),
        contact: String(f.get("contact")),
      },
      ...(list?.seller ? { expectedVersion: list.seller.version } : {}),
    });
  }
  const act = (action: string, extra = {}) =>
    selected &&
    void execute({
      action,
      id: selected.id,
      expectedVersion: selected.version,
      ...extra,
    });
  return (
    <section
      className={`invoiceWorkspace ${staff ? "" : "page"} ${mobileDetail ? "invoiceWorkspace--detail" : ""}`}
    >
      <CrmHeading
        title="Hóa đơn"
        description={
          staff
            ? "Lập và quản lý hóa đơn nội bộ theo đơn hàng."
            : "Xem hóa đơn đã xuất từ đơn hàng của bạn."
        }
        actions={
          <button disabled={busy} onClick={() => void load()}>
            <CrmIcon name="refresh" /> Tải lại
          </button>
        }
      />
      <p className="invoiceContext">
        Hóa đơn nội bộ, không phải hóa đơn điện tử thuế. Bản đã xuất giữ nguyên
        nội dung tại thời điểm xuất.
      </p>
      {error && <CrmState kind="error" title={error} />}
      {message && <p role="status">{message}</p>}
      {pending && (
        <p role="status">
          Có thao tác chưa rõ kết quả.{" "}
          <button disabled={busy} onClick={() => void execute({}, true)}>
            Kiểm tra lại cùng thao tác
          </button>
        </p>
      )}
      {!list && !error && <CrmState kind="loading" title="Đang tải hóa đơn…" />}
      <div className="invoiceLayout">
        <aside className="invoiceSidebar" aria-label="Danh sách hóa đơn">
          <h2 className="invoicePanelTitle">Danh sách hóa đơn</h2>
          {staff && list?.canConfigure && (
            <details className="noPrint">
              <summary>Thông tin người bán</summary>
              <form
                className="form"
                key={list.seller?.version ?? 0}
                onSubmit={configure}
              >
                <label>
                  Tên doanh nghiệp/người bán
                  <input
                    disabled={busy || pending}
                    name="name"
                    minLength={2}
                    maxLength={160}
                    required
                    defaultValue={list.seller?.seller.name}
                  />
                </label>
                <label>
                  Địa chỉ
                  <input
                    disabled={busy || pending}
                    name="address"
                    minLength={5}
                    maxLength={300}
                    required
                    defaultValue={list.seller?.seller.address}
                  />
                </label>
                <label>
                  Thông tin liên hệ
                  <input
                    disabled={busy || pending}
                    name="contact"
                    minLength={3}
                    maxLength={160}
                    required
                    defaultValue={list.seller?.seller.contact}
                  />
                </label>
                <button disabled={busy || pending}>
                  Lưu thông tin người bán
                </button>
              </form>
            </details>
          )}
          {staff && list?.canIssue && (
            <form className="form noPrint" onSubmit={create}>
              <label>
                Mã đơn đã chốt tổng cuối
                <input
                  key={orderFilter}
                  disabled={busy || pending}
                  name="order"
                  required
                  maxLength={80}
                  pattern={"[a-zA-Z0-9\\-]+"}
                  defaultValue={search.get("order") ?? ""}
                />
              </label>
              <button disabled={busy || pending}>Tạo bản nháp từ đơn</button>
            </form>
          )}
          <div
            className="noPrint documentList crmList"
            aria-busy={!list && !error}
          >
            {list?.rows.map((d) => (
              <article
                className={`crmItem invoiceRow ${selected?.id === d.id ? "invoiceRow--selected" : ""}`}
                key={d.id}
              >
                <div className="crmItemMain">
                  <h2 className="crmItemTitle">
                    <CrmIcon name="document" />
                    {d.issueNumber ?? "Bản nháp"}
                  </h2>
                  <strong>{amount(d.total)}</strong>
                  <div className="crmItemMeta">
                    <span className="crmBadge">
                      {d.state === "issued"
                        ? "Đã xuất"
                        : d.state === "void"
                          ? "Đã hủy"
                          : "Bản nháp"}{" "}
                    </span>
                    <CrmReference label="Mã hóa đơn" value={d.id} />
                  </div>
                </div>
                <div className="crmActions">
                  <button
                    disabled={busy || pending}
                    aria-pressed={selected?.id === d.id}
                    onClick={(event) => void open(d.id, event.currentTarget)}
                  >
                    <CrmIcon name="arrow" /> Mở hóa đơn
                  </button>
                </div>
              </article>
            ))}
            {list && !list.rows.length && (
              <CrmState kind="empty" title="Chưa có hóa đơn trong trang này." />
            )}
          </div>
          {list?.next && (
            <div className="crmActions noPrint">
              <button disabled={busy} onClick={() => void load(list.next!)}>
                Trang tiếp
              </button>
            </div>
          )}
        </aside>
        <section
          className="invoiceDetail"
          ref={detailTarget}
          tabIndex={-1}
          aria-label="Chi tiết hóa đơn"
          aria-busy={detailLoading}
        >
          <button
            className="invoiceBack noPrint"
            onClick={() => {
              setMobileDetail(false);
              requestAnimationFrame(
                () =>
                  returnTarget.current?.isConnected &&
                  returnTarget.current.focus(),
              );
            }}
          >
            ← Danh sách hóa đơn
          </button>
          {detailLoading && (
            <CrmState kind="loading" title="Đang mở hóa đơn…" />
          )}
          {!selected && !detailLoading && (
            <CrmState kind="empty" title="Chọn hóa đơn để xem chi tiết">
              <p>Nội dung và các thao tác phù hợp sẽ hiển thị tại đây.</p>
            </CrmState>
          )}
          {selected && (
            <>
              <StatementView document={selected} />
              {selected.replacesId && (
                <button
                  className="noPrint"
                  disabled={busy || pending}
                  onClick={(event) =>
                    void open(selected.replacesId!, event.currentTarget)
                  }
                >
                  Mở hóa đơn được thay thế
                </button>
              )}
              {selected.sourceOrderId && (
                <Link
                  className="noPrint"
                  to={
                    staff
                      ? `/crm/orders?order=${selected.sourceOrderId}`
                      : `/account/orders/${selected.sourceOrderId}`
                  }
                >
                  Mở đơn và số dư hiện tại
                </Link>
              )}
              {staff && list?.canIssue && (
                <div className="statementActions noPrint">
                  {selected.state !== "draft" && (
                    <button
                      disabled={busy || pending}
                      onClick={() =>
                        void execute({
                          action: "createDraft",
                          orderId: selected.sourceOrderId,
                          replacesId: selected.id,
                        })
                      }
                    >
                      Tạo bản nháp thay thế
                    </button>
                  )}
                  {selected.state === "draft" && (
                    <>
                      <button
                        disabled={busy || pending}
                        onClick={() => act("refreshDraft")}
                      >
                        Cập nhật từ đơn
                      </button>
                      <button
                        disabled={busy || pending}
                        className="primary"
                        onClick={() => act("issue")}
                      >
                        Xuất hóa đơn
                      </button>
                    </>
                  )}
                  {selected.state === "issued" && (
                    <>
                      <details className="invoiceSecondaryActions">
                        <summary>Thao tác khác</summary>
                        <button
                          disabled={busy || pending}
                          onClick={() => act("queueEmail")}
                        >
                          Xếp lịch gửi email
                        </button>
                        <details>
                          <summary>Chia sẻ link trong 24 giờ</summary>
                          <p>
                            Ai có link xem được người bán, sản phẩm và số tiền;
                            không hiển thị tên khách hay địa chỉ nhận hàng. Tạo
                            link mới sẽ thu hồi link trước.
                          </p>
                          <button
                            disabled={busy || pending}
                            onClick={() => act("createShare")}
                          >
                            Tạo link để chia sẻ thủ công
                          </button>
                          {share && (
                            <>
                              <input
                                aria-label="Link chia sẻ hóa đơn"
                                readOnly
                                value={share}
                              />
                              <button
                                onClick={() =>
                                  void navigator.clipboard
                                    .writeText(share)
                                    .then(
                                      () =>
                                        setMessage(
                                          "Đã sao chép link. Mở ứng dụng để gửi; hệ thống chưa gửi tin.",
                                        ),
                                      () =>
                                        setError(
                                          "Chưa sao chép được. Chọn và sao chép link.",
                                        ),
                                    )
                                }
                              >
                                Sao chép link
                              </button>
                            </>
                          )}
                        </details>
                        <button
                          disabled={busy || pending}
                          onClick={() => act("revokeShare")}
                        >
                          Thu hồi toàn bộ link chia sẻ
                        </button>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            act("void", {
                              reason: String(
                                new FormData(e.currentTarget).get("reason"),
                              ),
                            });
                          }}
                        >
                          <label>
                            Lý do hủy hóa đơn
                            <input
                              disabled={busy || pending}
                              name="reason"
                              minLength={5}
                              maxLength={500}
                              required
                            />
                          </label>
                          <p>
                            Hủy hóa đơn giữ lịch sử và thu hồi link; không hủy
                            đơn hay hoàn tiền.
                          </p>
                          <button disabled={busy || pending}>
                            Hủy hóa đơn này
                          </button>
                        </form>
                      </details>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </section>
  );
}
export function SharedDocument() {
  const [request, setRequest] = useState(() => ({
      token: location.hash.slice(1),
      revision: 0,
    })),
    [d, setD] = useState<Statement | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    // Opening the same fragment again is a same-document navigation. Verify it
    // again instead of retaining a projection from a previously valid share.
    const changed = () =>
      setRequest((previous) => ({
        token: location.hash.slice(1),
        revision: previous.revision + 1,
      }));
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    setD(null);
    setError("");
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,nofollow";
    document.head.appendChild(robots);
    history.replaceState(null, "", location.pathname);
    let live = true;
    void callService<Statement>("invoiceShare", { token: request.token }).then(
      (r) => {
        if (live) setD(r);
      },
      () => {
        if (live)
          setError(
            "Liên kết đã hết hạn, bị thu hồi hoặc chưa thể xác minh. Nhờ người gửi tạo link mới.",
          );
      },
    );
    return () => {
      live = false;
      meta.remove();
      robots.remove();
    };
  }, [request]);
  return (
    <section className="page">
      <h1>Hóa đơn được chia sẻ</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : d ? (
        <StatementView document={d} />
      ) : (
        <LoadingState>Đang kiểm tra liên kết…</LoadingState>
      )}
    </section>
  );
}
