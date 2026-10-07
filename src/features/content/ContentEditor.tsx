import { StepForm, StepStage } from "../../shared/StepForm";
import { ProductSpreadsheet } from "./ProductSpreadsheet";
import "./content-editor092.css";
import { ProductInformationFields } from "./ProductInformationFields";
import { ProductReviewModeration } from "./ProductReviewModeration";
import {
  CrmHeading,
  CrmIcon,
  CrmState,
  CrmReference,
} from "../crm/CrmPresentation";
import { notify } from "../../shared/feedback";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { callService } from "../../shared/firebase";
import { MediaUpload } from "./MediaUpload";
import type { ContentRow } from "../../shared/public-content";
import {
  createRetryIdentity,
  createRequestSequence,
  scheduledInput,
  scheduledTimestamp,
} from "./editor-state";
export function ContentEditor() {
  const [editing, setEditing] = useState(false),
    [editorEpoch, setEditorEpoch] = useState(0),
    [dirty, setDirty] = useState(false),
    [orderable, setOrderable] = useState(false),
    [variantText, setVariantText] = useState(""),
    [step, setStep] = useState(0),
    [search, setSearch] = useState(""),
    [validation, setValidation] = useState<string[]>([]),
    [draftPreview, setDraftPreview] = useState<{
      title: string;
      body: string;
    } | null>(null),
    [statusFilter, setStatusFilter] = useState(""),
    [categoryFilter, setCategoryFilter] = useState(""),
    [selected, setSelected] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const slugManual = useRef(false);
  function leave() {
    if (busy) return;
    if (dirty && !window.confirm("Rời form và bỏ thay đổi chưa lưu?")) return;
    setEditing(false);
    setDirty(false);
  }
  function edit(row: ContentRow | null) {
    if (
      busy ||
      (dirty && !window.confirm("Bỏ thay đổi chưa lưu để mở nội dung khác?"))
    )
      return;
    setEditorEpoch((value) => value + 1);
    setValidation([]);
    setDraftPreview(null);
    setCurrent(row);
    setOrderable(row?.orderable === true);
    setVariantText(row?.variants ?? "");
    setEditing(true);
    setDirty(false);
    setStep(0);
    slugManual.current = !!row;
  }
  const [kind, setKind] = useState<"products" | "posts">("products"),
    [rows, setRows] = useState<ContentRow[]>([]),
    [current, setCurrent] = useState<ContentRow | null>(null),
    [mediaId, setMediaId] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(false),
    [next, setNext] = useState<string | null>(null);
  const requests = useRef(createRequestSequence()),
    retry = useRef(createRetryIdentity()),
    saves = useRef(createRequestSequence());
  async function load(after?: string) {
    const revision = requests.current.next();
    setLoading(true);
    setError("");
    try {
      const r = await callService<{ rows: ContentRow[]; next: string | null }>(
        "listWork",
        { kind, ...(after ? { after } : {}) },
      );
      if (!requests.current.current(revision)) return;
      setRows((previous) =>
        after
          ? [
              ...previous,
              ...r.rows.filter(
                (row) => !previous.some((old) => old.id === row.id),
              ),
            ]
          : r.rows,
      );
      setNext(r.next);
    } catch (e) {
      if (requests.current.current(revision)) setError((e as Error).message);
    } finally {
      if (requests.current.current(revision)) setLoading(false);
    }
  }
  useEffect(() => {
    setCurrent(null);
    setRows([]);
    setNext(null);
    setError("");
    retry.current.clear();
    void load();
    return () => {
      requests.current.invalidate();
      saves.current.invalidate();
    };
  }, [kind]);
  useEffect(() => {
    setMediaId(current?.mediaId ?? "");
  }, [current]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const navigation = (event: MouseEvent) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;
      if (!window.confirm("Rời form và bỏ thay đổi chưa lưu?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", navigation, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", navigation, true);
    };
  }, [dirty]);
  const visibleRows = rows.filter(
    (row) =>
      (!statusFilter || row.status === statusFilter) &&
      (!categoryFilter || row.category === categoryFilter) &&
      `${row.title} ${row.brand ?? ""} ${row.category ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const invalid = Array.from(e.currentTarget.elements).filter(
      (
        element,
      ): element is
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
        (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement) &&
        !element.validity.valid,
    );
    setValidation(
      invalid.map(
        (element) =>
          `${element.labels?.[0]?.textContent?.trim() || element.name}: ${element.validationMessage}`,
      ),
    );
    if (invalid.length) {
      const first = invalid[0];
      const section = first.closest("[data-step-stage]");
      if (section) setStep(Number(section.getAttribute("data-step-stage")));
      let ancestor = first.parentElement;
      while (ancestor && ancestor !== e.currentTarget) {
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        ancestor = ancestor.parentElement;
      }
      requestAnimationFrame(() => first.focus());
      return;
    }
    if (
      formRef.current?.elements.namedItem("status") instanceof
        HTMLSelectElement &&
      (formRef.current.elements.namedItem("status") as HTMLSelectElement)
        .value === "published" &&
      !window.confirm("Xuất bản nội dung này công khai trên website?")
    )
      return;
    const saveRevision = saves.current.next();
    const form = e.currentTarget,
      f = new FormData(form),
      status = String(f.get("status"));
    const content = {
      title: f.get("title"),
      slug: f.get("slug"),
      body: f.get("body"),
      ...Object.fromEntries(
        ["category", "referenceUrl", "variants", "seoTitle", "seoDescription"]
          .filter((key) => String(f.get(key) ?? "").trim())
          .map((key) => [key, String(f.get(key)).trim()]),
      ),
      ...(kind === "products"
        ? {
            market: String(f.get("market")),
            orderable: f.get("orderable") === "on",
            ...(f.get("listedPrice")
              ? { listedPrice: Number(f.get("listedPrice")) }
              : {}),
            ...(String(f.get("termsVersion") ?? "").trim()
              ? { termsVersion: String(f.get("termsVersion")).trim() }
              : {}),
            catalogOptions: String(f.get("catalogOptions") ?? "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            featured: f.get("featured") === "on",
            featuredOrder: Number(f.get("featuredOrder") || 9999),
            manufacturingOrigin: String(
              f.get("manufacturingOrigin") ?? "",
            ).trim(),
            brand: String(f.get("brand") ?? "").trim(),
            productSummary: String(f.get("productSummary") ?? "").trim(),
            retailer: String(f.get("retailer") ?? "").trim(),
            sourceUrl: String(f.get("sourceUrl") ?? "").trim(),
            usageSteps: JSON.parse(String(f.get("usageSteps") || "[]")),
            origin: String(f.get("origin") ?? "").trim(),
            functions: String(f.get("functions") ?? "").trim(),
            usage: String(f.get("usage") ?? "").trim(),
            ...(f.get("price")
              ? { referencePrice: Number(f.get("price")) }
              : {}),
            ...(f.get("priceTime")
              ? {
                  priceCheckedAt: new Date(
                    String(f.get("priceTime")),
                  ).getTime(),
                }
              : {}),
          }
        : {}),
      ...(mediaId ? { mediaId } : {}),
      status,
      ...(status === "scheduled"
        ? {
            publishAt: scheduledTimestamp(
              String(f.get("publishAt")),
              current?.publishAt,
            ),
          }
        : {}),
    };
    setBusy(true);
    setError("");
    try {
      await callService("workspaceCommand", {
        action: "saveContent",
        operationId: retry.current.forPayload({
          kind,
          id: current?.id,
          version: current?.version,
          content,
        }),
        ...(current
          ? { id: current.id, expectedVersion: current.version }
          : {}),
        payload: { kind, content },
      });
      if (!saves.current.current(saveRevision)) return;
      retry.current.clear();
      notify("Đã lưu nội dung.", "success");
      setCurrent(null);
      setEditing(false);
      setDirty(false);
      form.reset();
      setMediaId("");
      await load();
    } catch (e) {
      if (saves.current.current(saveRevision)) setError((e as Error).message);
    } finally {
      if (saves.current.current(saveRevision)) setBusy(false);
    }
  }
  return (
    <section className="ceWorkspace">
      <CrmHeading
        title={kind === "products" ? "Sản phẩm" : "Bài viết"}
        description={
          editing
            ? undefined
            : "Quản lý thông tin, hình ảnh và trạng thái xuất bản."
        }
        actions={
          !editing && (
            <>
              <select
                aria-label="Loại nội dung"
                value={kind}
                disabled={busy}
                onChange={(e) => {
                  if (
                    dirty &&
                    !window.confirm(
                      "Đổi loại nội dung và bỏ thay đổi chưa lưu?",
                    )
                  )
                    return;
                  setEditing(false);
                  setDirty(false);
                  setSelected(new Set());
                  setKind(e.target.value as typeof kind);
                }}
              >
                <option value="products">Sản phẩm</option>
                <option value="posts">Bài viết</option>
              </select>
              <button disabled={loading || busy} onClick={() => void load()}>
                <CrmIcon name="refresh" />
                Tải lại danh sách
              </button>
              <button disabled={busy} onClick={() => edit(null)}>
                <CrmIcon name="document" />
                {kind === "products" ? "Thêm sản phẩm" : "Thêm bài viết"}
              </button>
            </>
          )
        }
      />
      {!editing && (
        <>
          <div className="ceToolbar">
            <label className="ceSearch">
              Tìm sản phẩm
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên, thương hiệu hoặc danh mục…"
              />
            </label>
            <label>
              Trạng thái
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </label>
            <label>
              Danh mục
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Tất cả danh mục đã tải</option>
                {[...new Set(rows.map((row) => row.category).filter(Boolean))]
                  .sort()
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {kind === "products" && (
            <ProductSpreadsheet
              rows={rows}
              filtered={visibleRows}
              selected={selected}
              onSaved={() => load()}
            />
          )}
          {loading && <CrmState kind="loading" title="Đang tải nội dung…" />}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {!loading && !visibleRows.length && !error && (
            <CrmState
              kind="empty"
              title={
                rows.length
                  ? "Không có nội dung khớp bộ lọc."
                  : "Chưa có nội dung. Thêm mới hoặc nhập Excel để bắt đầu."
              }
            />
          )}
          <div className="ceTableScroll">
            <table className="ceTable">
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>{kind === "products" ? "Sản phẩm" : "Bài viết"}</th>
                  <th>Danh mục</th>
                  {kind === "products" && (
                    <>
                      <th>Giá tham khảo</th>
                      <th>Giá trọn gói</th>
                    </>
                  )}
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${row.title || row.id}`}
                        checked={selected.has(row.id)}
                        onChange={(e) =>
                          setSelected((previous) => {
                            const next = new Set(previous);
                            if (e.target.checked) next.add(row.id);
                            else next.delete(row.id);
                            return next;
                          })
                        }
                      />
                    </td>
                    <td>
                      <button className="ceProduct" onClick={() => edit(row)}>
                        {row.mediaId && (
                          <img
                            src={`/media/${row.mediaId}`}
                            alt=""
                            width="40"
                            height="40"
                            loading="lazy"
                          />
                        )}
                        <span>
                          <strong>{row.title || "Thiếu tên sản phẩm"}</strong>
                          <small>
                            {row.brand || row.slug || "Cần bổ sung thông tin"}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td data-label="Danh mục">{row.category || "—"}</td>
                    {kind === "products" && (
                      <>
                        <td data-label="Giá tham khảo">
                          {row.referencePrice === undefined
                            ? "Chưa có giá"
                            : `${row.referencePrice.toLocaleString("vi-VN")} ₫`}
                        </td>
                        <td data-label="Giá trọn gói">
                          {row.listedPrice === undefined
                            ? "Chưa niêm yết"
                            : `${row.listedPrice.toLocaleString("vi-VN")} ₫`}
                        </td>
                      </>
                    )}
                    <td data-label="Trạng thái">
                      <span className="crmBadge">
                        {(
                          {
                            published: "Đã xuất bản",
                            scheduled: "Đã lên lịch",
                            archived: "Lưu trữ",
                            draft: "Bản nháp",
                          } as Record<string, string>
                        )[row.status] || row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ceListFooter">
            <span>
              {visibleRows.length} kết quả trong {rows.length} nội dung đã tải
              {next ? " · Còn nội dung chưa tải" : ""}
            </span>
            {next && (
              <button
                disabled={loading || busy}
                onClick={() => void load(next)}
              >
                Tải thêm
              </button>
            )}
          </div>
        </>
      )}
      {editing && (
        <div className="ceEditor" data-step={step}>
          <StepForm
            steps={[
              "Thông tin",
              "Phân loại",
              "Ảnh & chi tiết",
              "Giá & hiển thị",
              "Kiểm tra",
            ]}
            disabled={busy}
            activeStep={step}
            onStepChange={setStep}
            key={`${current?.id ?? "new"}-${editorEpoch}`}
            header={
              <div className="ceEditorNav">
                <h2 className="crmSectionHeading">
                  {current
                    ? "Sửa nội dung"
                    : kind === "products"
                      ? "Thêm sản phẩm"
                      : "Thêm bài viết"}
                </h2>
                <button
                  className="ceListIcon"
                  type="button"
                  disabled={busy}
                  onClick={leave}
                  aria-label="Xem danh sách"
                  title="Xem danh sách"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 4h9M6 9h9M6 14h9" />
                    <path d="M3 4h.01M3 9h.01M3 14h.01" strokeWidth="2.5" />
                  </svg>
                </button>
                <span
                  className={`ceSaveIndicator${dirty ? " isDirty" : ""}`}
                  role="status"
                  aria-label={dirty ? "Chưa lưu" : "Không có thay đổi chưa lưu"}
                  title={dirty ? "Chưa lưu" : "Không có thay đổi chưa lưu"}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    {dirty ? (
                      <circle cx="8" cy="8" r="4" fill="currentColor" />
                    ) : (
                      <path
                        d="M3 8l3 3 7-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </span>
              </div>
            }
            className="panel form ceEditorForm"
            ref={formRef}
            noValidate
            onChange={() => {
              setDirty(true);
              setDraftPreview(null);
            }}
            onInvalidCapture={(event) => {
              const section = (event.target as HTMLElement).closest(
                "[data-step-stage]",
              );
              if (section)
                setStep(Number(section.getAttribute("data-step-stage")));
              requestAnimationFrame(() =>
                (event.target as HTMLElement).focus(),
              );
              let ancestor = (event.target as HTMLElement).parentElement;
              while (ancestor && ancestor !== event.currentTarget) {
                if (ancestor instanceof HTMLDetailsElement)
                  ancestor.open = true;
                ancestor = ancestor.parentElement;
              }
            }}
            onSubmit={(e) => void save(e)}
          >
            {current && (
              <div data-step-stage="4" hidden={step !== 4}>
                <CrmReference label="Mã nội dung" value={current.id} />
              </div>
            )}

            <div data-step-stage="0" hidden={step !== 0}>
              <h3 className="sr-only" tabIndex={-1}>
                Thông tin
              </h3>
              <label>
                <span className="formLabelText">
                  {kind === "products" ? "Tên sản phẩm" : "Tiêu đề"}{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="title"
                  defaultValue={current?.title}
                  onChange={(e) => {
                    if (!slugManual.current) {
                      const field = formRef.current?.elements.namedItem("slug");
                      if (field instanceof HTMLInputElement)
                        field.value = e.target.value
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[đĐ]/g, "d")
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                          .slice(0, 100);
                    }
                  }}
                  required
                  minLength={2}
                  maxLength={160}
                />
              </label>
              <label>
                <span className="formLabelText">
                  Đường dẫn{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <input
                  name="slug"
                  onChange={() => {
                    slugManual.current = true;
                  }}
                  defaultValue={current?.slug}
                  pattern="[a-z0-9-]{2,100}"
                  required
                />
              </label>
              <label>
                <span className="formLabelText">
                  Mô tả{" "}
                  <span className="requiredMark" aria-hidden="true">
                    *
                  </span>
                </span>
                <textarea
                  name="body"
                  defaultValue={current?.body}
                  required
                  minLength={10}
                  maxLength={30000}
                />
              </label>
            </div>
            <div data-step-stage="1" hidden={step !== 1}>
              <h3 className="sr-only" tabIndex={-1}>
                Phân loại
              </h3>
              <div className="ceFieldGrid">
                <label>
                  Danh mục
                  <input
                    name="category"
                    maxLength={80}
                    defaultValue={current?.category}
                  />
                </label>
                <label>
                  Link sản phẩm
                  <input
                    type="url"
                    name="referenceUrl"
                    maxLength={2048}
                    defaultValue={current?.referenceUrl}
                  />
                </label>
                <label>
                  Quy cách
                  <input
                    name="variants"
                    onChange={(event) => setVariantText(event.target.value)}
                    maxLength={500}
                    defaultValue={current?.variants}
                  />
                </label>
                <label>
                  Tiêu đề tìm kiếm
                  <input
                    name="seoTitle"
                    placeholder="Để trống dùng tên nội dung"
                    maxLength={160}
                    defaultValue={current?.seoTitle}
                  />
                </label>
                <label>
                  Mô tả tìm kiếm
                  <textarea
                    name="seoDescription"
                    placeholder="Để trống dùng phần đầu nội dung"
                    maxLength={300}
                    defaultValue={current?.seoDescription}
                  />
                </label>
              </div>
            </div>
            {kind === "products" && (
              <>
                <div data-step-stage="2" hidden={step !== 2}>
                  <h3 className="sr-only" tabIndex={-1}>
                    Ảnh & chi tiết
                  </h3>
                  <ProductInformationFields
                    key={`${current?.id ?? "new"}-${current?.version ?? 0}`}
                    row={current}
                  />
                  <div className="ceFieldGrid">
                    <label>
                      <input
                        name="featured"
                        type="checkbox"
                        defaultChecked={current?.featured !== false}
                      />{" "}
                      Sản phẩm nổi bật
                    </label>
                    <label>
                      Thứ tự hiển thị
                      <input
                        name="featuredOrder"
                        type="number"
                        min={0}
                        max={9999}
                        step={1}
                        defaultValue={current?.featuredOrder ?? 9999}
                      />
                      <small>Số nhỏ hơn được ưu tiên giới thiệu.</small>
                    </label>
                    <label>
                      Nguồn gốc
                      <textarea
                        name="origin"
                        maxLength={4000}
                        defaultValue={current?.origin}
                      />
                    </label>
                    <label>
                      Công dụng
                      <textarea
                        name="functions"
                        maxLength={4000}
                        defaultValue={current?.functions}
                      />
                    </label>
                    <label>
                      Cách dùng
                      <textarea
                        name="usage"
                        maxLength={4000}
                        defaultValue={current?.usage}
                      />
                    </label>
                  </div>
                </div>
                <div data-step-stage="3" hidden={step !== 3}>
                  <h3 className="sr-only" tabIndex={-1}>
                    Giá & hiển thị
                  </h3>
                  <label>
                    <span className="formLabelText">
                      Mua tại{" "}
                      {orderable && (
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      )}
                    </span>
                    <select
                      name="market"
                      required={orderable}
                      defaultValue={current?.market ?? "US"}
                    >
                      <option value="US">Mỹ</option>
                      <option value="JP">Nhật Bản</option>
                      <option value="KR">Hàn Quốc</option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="orderable"
                      checked={orderable}
                      onChange={(event) => setOrderable(event.target.checked)}
                    />{" "}
                    Cho phép đặt mua
                  </label>
                  <label>
                    <span className="formLabelText">
                      Giá bán (₫){" "}
                      {orderable && (
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      )}
                    </span>
                    <input
                      type="number"
                      name="listedPrice"
                      required={orderable}
                      min={1}
                      max={1000000000000}
                      step={1}
                      defaultValue={current?.listedPrice}
                    />
                    <small>
                      Bao gồm toàn bộ phí mua hộ và giao hàng. Không thu thêm
                      đợt hai.
                    </small>
                  </label>
                  <label>
                    <span className="formLabelText">
                      Điều khoản mua hàng{" "}
                      {orderable && (
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      )}
                    </span>
                    <input
                      name="termsVersion"
                      required={orderable}
                      maxLength={80}
                      defaultValue={current?.termsVersion}
                    />
                  </label>
                  <label>
                    <span className="formLabelText">
                      Mẫu sản phẩm{" "}
                      {orderable && Boolean(variantText.trim()) && (
                        <span className="requiredMark" aria-hidden="true">
                          *
                        </span>
                      )}
                    </span>
                    <textarea
                      name="catalogOptions"
                      required={orderable && Boolean(variantText.trim())}
                      defaultValue={current?.catalogOptions?.join("\n")}
                    />
                    <small>
                      Các mẫu dùng chung giá niêm yết. Mẫu khác giá cần sản phẩm
                      riêng.
                    </small>
                  </label>
                  <div className="ceFieldGrid">
                    <label>
                      Giá tham khảo (₫)
                      <input
                        type="number"
                        name="price"
                        min={0}
                        max={1000000000000}
                        step={1}
                        defaultValue={current?.referencePrice}
                      />
                      <small>Chỉ tham khảo, không dùng để thanh toán.</small>
                    </label>
                    <label>
                      Ngày kiểm tra giá
                      <input
                        name="priceTime"
                        type="datetime-local"
                        defaultValue={
                          current?.priceCheckedAt
                            ? new Date(
                                current.priceCheckedAt -
                                  new Date(
                                    current.priceCheckedAt,
                                  ).getTimezoneOffset() *
                                    60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
            <div data-step-stage="2" hidden={step !== 2}>
              <h3 className="crmSectionHeading">Ảnh sản phẩm</h3>
              <MediaUpload onUploaded={setMediaId} />
              {mediaId && (
                <p>
                  <CrmReference label="Ảnh đã lưu" value={mediaId} />. Lưu nội
                  dung để gắn ảnh.
                </p>
              )}
            </div>
            <div data-step-stage="3" hidden={step !== 3}>
              <label>
                Trạng thái
                <select name="status" defaultValue={current?.status ?? "draft"}>
                  <option value="draft">Bản nháp</option>
                  <option value="published">Xuất bản trên website</option>
                  <option value="scheduled">Lên lịch xuất bản</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </label>
              <label>
                Hẹn giờ hiển thị
                <input
                  type="datetime-local"
                  name="publishAt"
                  defaultValue={scheduledInput(current?.publishAt)}
                />
              </label>
              <p className="notice">
                Xuất bản hiển thị công khai. Không đưa chứng từ, thông tin khách
                hoặc nội dung chưa được duyệt vào đây.
              </p>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {validation.length > 0 && (
              <div role="alert" className="error">
                <strong>Kiểm tra các trường sau:</strong>
                <ul>
                  {validation.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            {draftPreview && (
              <article
                className="panel"
                aria-label="Xem trước nội dung chưa lưu"
              >
                <p>Bản xem trước nội dung · chưa lưu hoặc xuất bản</p>
                <h3>{draftPreview.title}</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{draftPreview.body}</p>
              </article>
            )}
            <StepStage index={4}>
              <div className="ceSaveBar">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const data = new FormData(formRef.current!);
                    setDraftPreview({
                      title: String(data.get("title") || "Chưa có tiêu đề"),
                      body: String(data.get("body") || "Chưa có nội dung"),
                    });
                  }}
                >
                  Xem trước nội dung
                </button>
                {!current && (
                  <button
                    type="submit"
                    disabled={busy}
                    onClick={() => {
                      const field =
                        formRef.current?.elements.namedItem("status");
                      if (field instanceof HTMLSelectElement)
                        field.value = "draft";
                    }}
                  >
                    Lưu bản nháp
                  </button>
                )}
                <button type="button" disabled={busy} onClick={leave}>
                  Hủy
                </button>
                <button className="primary" disabled={busy}>
                  <CrmIcon name="check" />
                  {busy ? "Đang lưu…" : "Lưu nội dung"}
                </button>
              </div>
            </StepStage>
          </StepForm>
        </div>
      )}
      {!editing && kind === "products" && (
        <details className="crmItemDetails">
          <summary>Đánh giá sản phẩm</summary>
          <ProductReviewModeration />
        </details>
      )}
    </section>
  );
}
