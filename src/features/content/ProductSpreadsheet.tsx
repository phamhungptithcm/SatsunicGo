import { csvCell } from "../../../packages/domain";
import { useEffect, useRef, useState } from "react";
import { callService } from "../../shared/firebase";
import type { ContentRow } from "../../shared/public-content";
import {
  columns,
  columnLabels,
  executeImportRows,
  contentOnly,
  downloadSheet,
  previewRows,
  readSpreadsheet,
  type ImportRow,
} from "./product-spreadsheet";

export function ProductSpreadsheet({
  rows,
  selected,
  filtered,
  onSaved,
}: {
  rows: ContentRow[];
  selected: Set<string>;
  filtered: ContentRow[];
  onSaved: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    cancel = useRef(false),
    mounted = useRef(true);
  const [sheets, setSheets] = useState<{ name: string; rows: string[][] }[]>(
      [],
    ),
    [sheet, setSheet] = useState(0),
    [mapping, setMapping] = useState<string[]>([]),
    [preview, setPreview] = useState<ImportRow[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState(""),
    [scope, setScope] = useState("filtered"),
    [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel.current = true;
    };
  }, []);
  async function inventory() {
    const all: ContentRow[] = [];
    let after: string | null = null;
    const seen = new Set<string>();
    do {
      if (cancel.current) throw Error("Đã dừng tải dữ liệu.");
      const result: { rows: ContentRow[]; next: string | null } =
        await callService<{
          rows: ContentRow[];
          next: string | null;
        }>("listWork", { kind: "products", ...(after ? { after } : {}) });
      all.push(...result.rows.filter((r) => !all.some((v) => v.id === r.id)));
      if (result.next && seen.has(result.next))
        throw Error("Phân trang không tiến triển.");
      after = result.next;
      if (after) seen.add(after);
      if (all.length > 10000)
        throw Error(
          "Danh sách vượt giới hạn 10.000 sản phẩm; chia nhỏ phạm vi.",
        );
    } while (after);
    return all;
  }
  async function task(work: () => Promise<void>) {
    if (busy) return;
    cancel.current = false;
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) {
        setBusy(false);
        setPhase("");
      }
    }
  }
  function choose(index: number, data = sheets) {
    setSheet(index);
    setPreview([]);
    setMapping(
      (data[index]?.rows[0] ?? []).map((v) =>
        (columns as readonly string[]).includes(v.trim()) ? v.trim() : "",
      ),
    );
  }
  async function save() {
    await task(async () => {
      if (!preview.length || preview.some((r) => r.error))
        throw Error("Sửa các dòng lỗi trước khi nhập.");
      if (
        preview.some(
          (r) =>
            r.content.status === "published" ||
            r.content.status === "scheduled" ||
            r.content.status === "archived",
        ) &&
        !window.confirm(
          "Tệp có thay đổi xuất bản, lên lịch hoặc lưu trữ. Bạn đã kiểm tra từng dòng và muốn tiếp tục?",
        )
      )
        return;
      await executeImportRows(preview, {
        stopped: () => cancel.current || !mounted.current,
        commit: (row) =>
          callService<{ id: string; version: number }>("workspaceCommand", {
            action: "saveContent",
            operationId: row.operationId,
            ...(row.existing
              ? { id: row.existing.id, expectedVersion: row.existing.version }
              : {}),
            payload: { kind: "products", content: row.content },
          }),
        readback: inventory,
        progress: (row) => {
          if (mounted.current) {
            setPhase(`Đang xử lý dòng ${row.line}…`);
            setPreview([...preview]);
          }
        },
      });
      if (mounted.current) await onSaved();
    });
  }
  return (
    <div className="ceSpreadsheet">
      <div className="ceExport">
        <select
          aria-label="Phạm vi xuất"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          disabled={busy}
        >
          <option value="selected">Dòng đã chọn ({selected.size})</option>
          <option value="filtered">
            Kết quả lọc đã tải ({filtered.length})
          </option>
          <option value="all">Toàn bộ sản phẩm</option>
        </select>
        <select
          aria-label="Định dạng xuất"
          value={format}
          onChange={(e) => setFormat(e.target.value as "xlsx" | "csv")}
          disabled={busy}
        >
          <option>xlsx</option>
          <option>csv</option>
        </select>
        <button
          disabled={busy}
          onClick={() =>
            void task(async () => {
              setPhase("Đang chuẩn bị tệp…");
              const data =
                scope === "all"
                  ? await inventory()
                  : scope === "selected"
                    ? rows.filter((r) => selected.has(r.id))
                    : filtered;
              if (!data.length)
                throw Error("Chưa có sản phẩm trong phạm vi đã chọn.");
              if (!cancel.current)
                await downloadSheet(
                  data.map((r) => ({
                    ...contentOnly(r),
                    id: r.id,
                    version: r.version,
                  })),
                  "satsunicgo-products",
                  format,
                );
            })
          }
        >
          Xuất dữ liệu
        </button>
        <button disabled={busy} onClick={() => dialog.current?.showModal()}>
          Nhập Excel
        </button>
        {busy && (
          <button
            onClick={() => {
              cancel.current = true;
            }}
          >
            Dừng sau dòng hiện tại
          </button>
        )}
      </div>
      {phase && <span role="status">{phase}</span>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <dialog
        aria-labelledby="ceImportTitle"
        className="ceImport"
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <header>
          <h2 id="ceImportTitle">Nhập sản phẩm</h2>
          <button
            disabled={busy}
            aria-label="Đóng nhập sản phẩm"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="ceImportBody">
          <p>Chọn tệp → Ghép cột → Kiểm tra → Lưu. Không xuất bản tự động.</p>
          <button
            disabled={busy}
            onClick={() =>
              void task(async () =>
                downloadSheet(
                  [
                    {
                      title: "Tên sản phẩm",
                      slug: "ten-san-pham",
                      body: "Mô tả sản phẩm đã xác minh.",
                      status: "draft",
                      orderable: false,
                    },
                  ],
                  "mau-san-pham",
                  "xlsx",
                ),
              )
            }
          >
            Tải mẫu Excel
          </button>
          <label>
            Tệp Excel hoặc CSV · tối đa 5 MB, 500 dòng
            <input
              type="file"
              accept=".xlsx,.csv"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file)
                  void task(async () => {
                    setPreview([]);
                    const data = await readSpreadsheet(file);
                    if (!data.length) throw Error("Tệp không có sheet.");
                    setSheets(data);
                    choose(0, data);
                  });
              }}
            />
          </label>
          {sheets.length > 0 && (
            <>
              <label>
                Sheet
                <select
                  value={sheet}
                  disabled={busy}
                  onChange={(e) => choose(Number(e.target.value))}
                >
                  {sheets.map((s, i) => (
                    <option key={i} value={i}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <details open>
                <summary>Ghép cột</summary>
                <div className="ceMapping">
                  {mapping.map((field, i) => (
                    <label key={i}>
                      {sheets[sheet].rows[0][i] || `Cột ${i + 1}`}
                      <select
                        value={field}
                        disabled={busy}
                        onChange={(e) => {
                          setPreview([]);
                          setMapping(
                            mapping.map((v, n) =>
                              n === i ? e.target.value : v,
                            ),
                          );
                        }}
                      >
                        <option value="">Bỏ qua</option>
                        {columns.map((c) => (
                          <option key={c} value={c}>
                            {columnLabels[c]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </details>
              <p>
                Ô trống giữ giá trị cũ khi cập nhật; không dùng để xóa trường.
                Giá là số nguyên VND không có dấu phân cách. status trống giữ
                trạng thái cũ; sản phẩm mới là bản nháp. Ảnh dùng mediaId đã
                upload và được cấp quyền, không tải ảnh từ URL.
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  void task(async () => {
                    setPhase("Đang đối chiếu danh sách hiện tại…");
                    setPreview(
                      previewRows(
                        sheets[sheet].rows,
                        mapping,
                        await inventory(),
                      ),
                    );
                  })
                }
              >
                Kiểm tra dữ liệu
              </button>
            </>
          )}
          {preview.length > 0 && (
            <>
              <p role="status">
                {preview.length} dòng · {preview.filter((r) => r.error).length}{" "}
                lỗi · {preview.filter((r) => r.result === "saved").length} đã
                lưu
              </p>
              <div className="ceTableScroll">
                <table>
                  <thead>
                    <tr>
                      <th>Dòng</th>
                      <th>Sản phẩm</th>
                      <th>Thao tác</th>
                      <th>Trạng thái</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r) => (
                      <tr key={r.line}>
                        <td>{r.line}</td>
                        <td>{String(r.content.title ?? "")}</td>
                        <td>{r.existing ? "Cập nhật" : "Tạo mới"}</td>
                        <td>{String(r.content.status ?? "")}</td>
                        <td>
                          {r.error || r.message || "Hợp lệ"}
                          <details>
                            <summary>Xem thông tin sẽ lưu</summary>
                            <dl>
                              {Object.entries(r.content).map(
                                ([field, value]) => (
                                  <div key={field}>
                                    <dt>
                                      {columnLabels[
                                        field as keyof typeof columnLabels
                                      ] || field}
                                    </dt>
                                    <dd>
                                      {Array.isArray(value)
                                        ? value.join("; ")
                                        : String(value)}
                                    </dd>
                                  </div>
                                ),
                              )}
                            </dl>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                Lưu từng dòng qua phân quyền hiện có. Khi lỗi một phần, dòng
                thành công không lưu lại; thử lại giữ nguyên mã thao tác. Dừng
                chỉ chặn dòng chưa gửi.
              </p>
              <button
                className="primary"
                disabled={
                  busy ||
                  preview.some((r) => r.error) ||
                  preview.every((r) => r.result === "saved")
                }
                onClick={() => void save()}
              >
                Xác nhận lưu{" "}
                {preview.filter((r) => r.result !== "saved").length} dòng
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  void task(async () => {
                    const lines = [
                      "line,title,result,error",
                      ...preview.map((r) =>
                        [
                          r.line,
                          r.content.title,
                          r.result ?? "not_sent",
                          r.error ?? r.message ?? "",
                        ]
                          .map((v) => csvCell(String(v)))
                          .join(","),
                      ),
                    ];
                    const url = URL.createObjectURL(
                      new Blob(["\uFEFF" + lines.join("\r\n")], {
                        type: "text/csv;charset=utf-8",
                      }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "ket-qua-nhap.csv";
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  })
                }
              >
                Tải kết quả từng dòng
              </button>
            </>
          )}
          {phase && <p role="status">{phase}</p>}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        <footer>
          <button disabled={busy} onClick={() => dialog.current?.close()}>
            Đóng
          </button>
          {busy && (
            <button
              onClick={() => {
                cancel.current = true;
              }}
            >
              Dừng sau dòng hiện tại
            </button>
          )}
        </footer>
      </dialog>
    </div>
  );
}
