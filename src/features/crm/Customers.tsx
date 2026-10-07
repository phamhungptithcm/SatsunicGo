import "./customer-workspace095.css";
import { CrmHeading, CrmIcon, CrmReference, CrmState } from "./CrmPresentation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { callService } from "../../shared/firebase";
import type { CustomerRow } from "../../../packages/domain/crm";
type Cursor = { id: string; name?: string; at?: number };
type Page = { rows: CustomerRow[]; next: Cursor | null; asOf?: number };
export function assigneeDisplay(
  id: string,
  staff: { id: string; displayName: string }[],
) {
  if (!id) return "Chưa phân công";
  return staff.find((person) => person.id === id)?.displayName.trim() || id;
}
export function Customers({
  followUps = false,
  uid,
}: {
  followUps?: boolean;
  uid?: string;
}) {
  const [filter, setFilter] = useState({
    search: "",
    mode: "name",
    due: "overdue",
    mine: false,
  });
  const [page, setPage] = useState<Page | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [filterDirty, setFilterDirty] = useState(false);
  const request = useRef(0);
  const [staff, setStaff] = useState<{ id: string; displayName: string }[]>([]);
  useEffect(() => {
    let active = true;
    void callService<{ rows: typeof staff }>("listCrmStaff", {}).then(
      (result) => {
        if (active) setStaff(result.rows);
      },
      () => {
        if (active) setStaff([]);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  async function load(after?: Cursor) {
    const token = ++request.current;
    setBusy(true);
    setFilterDirty(false);
    setError("");
    try {
      const result = await callService<Page>(
        followUps ? "listFollowUps" : "listCustomers",
        followUps
          ? {
              mode: filter.due,
              ...(filter.mine ? { assigneeId: uid } : {}),
              ...(after && page?.asOf ? { asOf: page.asOf } : {}),
              ...(after ? { after } : {}),
            }
          : {
              search: filter.search,
              mode: filter.mode,
              ...(after ? { after } : {}),
            },
      );
      if (token === request.current) setPage(result);
    } catch {
      if (token === request.current) {
        setPage(null);
        setError("Chưa tải được danh sách. Kiểm tra kết nối và thử lại.");
      }
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  useEffect(() => {
    void load();
    return () => {
      request.current++;
    };
  }, []); // Load only on open; filters apply explicitly.
  function search(e: FormEvent) {
    e.preventDefault();
    void load();
  }
  function change(next: typeof filter) {
    request.current++;
    setBusy(false);
    setPage(null);
    setFilterDirty(true);
    setFilter(next);
  }
  return (
    <section
      className={`customerWorkspace095 ${followUps ? "customerWorkspace095--care" : ""}`}
      aria-label={followUps ? "Lịch chăm sóc" : "Khách hàng"}
    >
      <CrmHeading
        title={followUps ? "Lịch chăm sóc" : "Khách hàng"}
        description={
          followUps
            ? "Xem lịch đến hạn và mở hồ sơ để tiếp tục chăm sóc khách hàng."
            : "Tìm khách hàng và mở hồ sơ để xem thông tin, đơn hàng và lịch chăm sóc."
        }
        reload={
          <button disabled={busy} onClick={() => void load()}>
            <CrmIcon name="refresh" />
            Tải lại
          </button>
        }
      />
      <div className="customerWorkspace095-surface">
        <form
          className="crmFilters customerWorkspace095-filters"
          onSubmit={search}
          aria-label={followUps ? "Lọc lịch chăm sóc" : "Tìm khách hàng"}
        >
          {followUps ? (
            <>
              <label className="customerWorkspace095-mode">
                Lịch hẹn
                <select
                  value={filter.due}
                  onChange={(e) => change({ ...filter, due: e.target.value })}
                >
                  <option value="overdue">Đã đến hạn</option>
                  <option value="upcoming">7 ngày tới</option>
                  <option value="all">Tất cả lịch hẹn</option>
                </select>
              </label>
              <label className="crmCheck">
                <input
                  type="checkbox"
                  checked={filter.mine}
                  onChange={(e) =>
                    change({ ...filter, mine: e.target.checked })
                  }
                />
                Việc của tôi
              </label>
            </>
          ) : (
            <>
              <label className="customerWorkspace095-mode">
                Tìm theo
                <select
                  value={filter.mode}
                  onChange={(e) => change({ ...filter, mode: e.target.value })}
                >
                  <option value="name">Tên khách hàng</option>
                  <option value="id">Mã khách hàng</option>
                </select>
              </label>
              <label className="customerWorkspace095-search">
                {filter.mode === "id" ? "Mã khách hàng" : "Tên khách hàng"}
                <input
                  placeholder={
                    filter.mode === "id"
                      ? "Nhập mã đầy đủ"
                      : "Nhập phần đầu tên"
                  }
                  aria-describedby="customer-search-hint095"
                  autoComplete="off"
                  maxLength={filter.mode === "id" ? 128 : 120}
                  value={filter.search}
                  onChange={(e) =>
                    change({ ...filter, search: e.target.value })
                  }
                />
              </label>
            </>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Đang tải…"
              : followUps
                ? "Xem danh sách"
                : "Tìm khách hàng"}
          </button>
          {(filter.search || filter.mode !== "name" || filter.mine || filter.due !== "overdue") && (
            <button type="button" disabled={busy} onClick={() => change({ search: "", mode: "name", due: "overdue", mine: false })}>
              Xóa bộ lọc
            </button>
          )}
        </form>
        <p className="customerWorkspace095-hint" id="customer-search-hint095">
          {followUps
            ? "7 ngày tới tính từ lúc tải danh sách. Giờ hẹn hiển thị theo thiết bị."
            : filter.mode === "id"
              ? "Nhập đầy đủ mã khách hàng để tìm chính xác."
              : "Tìm theo phần đầu tên, có hoặc không dấu."}
        </p>
        <div
          className="customerWorkspace095-results"
          aria-label="Kết quả"
          aria-busy={busy}
        >
          {busy && <CrmState kind="loading" title="Đang tải danh sách…" />}
          {filterDirty && !busy && (
            <p className="muted" role="status">
              Bộ lọc đã đổi. Bấm{" "}
              {followUps ? "Xem danh sách" : "Tìm khách hàng"} để xem kết quả.
            </p>
          )}
          {error && (
            <CrmState
              kind="error"
              title={error}
              action={
                <button onClick={() => void load()} disabled={busy}>
                  <CrmIcon name="refresh" />
                  Thử tải lại
                </button>
              }
            />
          )}
          {page && !busy && (
            <>
              <div className="customerWorkspace095-resultHeading">
                <h2>{followUps ? "Lịch hẹn" : "Danh sách khách hàng"}</h2>
                <span>
                  {page.rows.length} {followUps ? "lịch hẹn" : "khách hàng"}{" "}
                  trong trang
                </span>
              </div>
              {page.rows.length > 0 && (
                <div className="tableWrap crmTable crmRecordTable crmCustomersTable">
                  <table role="table">
                    <thead role="rowgroup">
                      <tr role="row">
                        <th scope="col" role="columnheader">
                          Khách hàng
                        </th>
                        <th scope="col" role="columnheader">
                          Phân loại
                        </th>
                        <th scope="col" role="columnheader">
                          Người phụ trách
                        </th>
                        <th scope="col" role="columnheader">
                          Lịch hẹn
                        </th>
                        <th scope="col" role="columnheader">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {page.rows.map((row) => (
                        <tr key={row.id} role="row">
                          <td role="cell" data-label="Khách hàng">
                            <Link
                              className="crmCustomerLink"
                              to={`/crm/customers/${row.id}`}
                            >
                              {row.displayName || "Chưa cập nhật tên"}
                            </Link>
                            {row.businessName && (
                              <small>{row.businessName}</small>
                            )}
                            <details className="crmItemDetails">
                              <summary>Mã khách hàng</summary>
                              <CrmReference label="Mã" value={row.id} />
                            </details>
                          </td>
                          <td role="cell" data-label="Phân loại">
                            {row.tags.length
                              ? row.tags.map((t) => (
                                  <span className="crmTag" key={t}>
                                    {t}
                                  </span>
                                ))
                              : "Chưa phân loại"}
                          </td>
                          <td role="cell" data-label="Người phụ trách">
                            {assigneeDisplay(row.assigneeId, staff)}
                          </td>
                          <td role="cell" data-label="Lịch hẹn">
                            {row.followUpAt ? (
                              <time
                                dateTime={new Date(
                                  row.followUpAt,
                                ).toISOString()}
                              >
                                {new Date(row.followUpAt).toLocaleString(
                                  "vi-VN",
                                )}
                              </time>
                            ) : (
                              "Chưa có lịch hẹn"
                            )}
                          </td>
                          <td role="cell" data-label="Thao tác">
                            <Link
                              to={`/crm/customers/${row.id}`}
                              aria-label={`Mở hồ sơ ${row.displayName || row.id}`}
                            >
                              Mở hồ sơ <CrmIcon name="arrow" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!page.rows.length && (
                <CrmState
                  kind="empty"
                  title={
                    followUps
                      ? "Chưa có lịch hẹn phù hợp"
                      : "Chưa có khách hàng phù hợp"
                  }
                >
                  {followUps
                    ? filter.mine
                      ? "Thử chọn khoảng thời gian khác hoặc bỏ lọc Việc của tôi."
                      : "Thử chọn khoảng thời gian khác để xem lịch hẹn."
                    : filter.search.trim()
                      ? "Kiểm tra tên hoặc mã khách hàng rồi tìm lại."
                      : "Danh sách hiện tại chưa có khách hàng. Bạn có thể thử tải lại."}
                </CrmState>
              )}
              <div className="crmPagination">
                <span>Tối đa 30 khách hàng mỗi trang</span>
                {page.next && (
                  <button disabled={busy} onClick={() => void load(page.next!)}>
                    Trang tiếp theo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
