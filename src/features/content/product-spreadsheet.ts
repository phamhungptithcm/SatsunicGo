import { z } from "zod";
import {
  catalogOptionsSchema,
  catalogProductSchema,
} from "../../../packages/domain/catalog-checkout";
import { csvCell } from "../../../packages/domain";
import { productInformationShape } from "../../../packages/domain/product-information";
import type { ContentRow } from "../../shared/public-content";

export const columns = [
  "id",
  "version",
  "title",
  "slug",
  "body",
  "brand",
  "category",
  "productSummary",
  "manufacturingOrigin",
  "retailer",
  "sourceUrl",
  "referenceUrl",
  "variants",
  "referencePrice",
  "listedPrice",
  "orderable",
  "market",
  "termsVersion",
  "catalogOptions",
  "usageSteps",
  "origin",
  "functions",
  "usage",
  "seoTitle",
  "seoDescription",
  "featured",
  "featuredOrder",
  "mediaId",
  "priceCheckedAt",
  "status",
  "publishAt",
] as const;
export type Column = (typeof columns)[number];
export const columnLabels = Object.fromEntries(
  columns.map((key, i) => [
    key,
    [
      "Mã sản phẩm",
      "Phiên bản",
      "Tên sản phẩm",
      "Đường dẫn",
      "Mô tả",
      "Thương hiệu",
      "Danh mục",
      "Tóm tắt",
      "Xuất xứ sản xuất",
      "Nhà bán hàng",
      "Nguồn thông tin",
      "Link tham khảo",
      "Quy cách",
      "Giá tham khảo (VND)",
      "Giá trọn gói (VND)",
      "Cho đặt mua (true/false)",
      "Thị trường (US/JP/KR)",
      "Phiên bản điều khoản",
      "Lựa chọn đặt mua",
      "Các bước sử dụng",
      "Thông tin xuất xứ",
      "Công dụng",
      "Cách dùng",
      "Tiêu đề tìm kiếm",
      "Mô tả tìm kiếm",
      "Nổi bật (true/false)",
      "Thứ tự nổi bật",
      "Mã ảnh đã upload",
      "Ngày kiểm tra giá (timestamp ms)",
      "Trạng thái xuất bản",
      "Giờ xuất bản (timestamp ms)",
    ][i],
  ]),
) as Record<Column, string>;
const price = z.number().int().min(0).max(1e12);
export const spreadsheetContent = z
  .object({
    title: z.string().min(2).max(160),
    slug: z.string().regex(/^[a-z0-9-]{2,100}$/),
    body: z.string().min(10).max(30000),
    status: z.enum(["draft", "published", "archived", "scheduled"]),
    market: z.enum(["US", "JP", "KR"]).optional(),
    category: z.string().max(80).optional(),
    referenceUrl: z
      .string()
      .url()
      .max(2048)
      .regex(/^https?:\/\//)
      .optional(),
    variants: z.string().max(500).optional(),
    seoTitle: z.string().min(2).max(160).optional(),
    seoDescription: z.string().min(2).max(300).optional(),
    ...productInformationShape,
    origin: z.string().max(4000).optional(),
    functions: z.string().max(4000).optional(),
    usage: z.string().max(4000).optional(),
    referencePrice: price.optional(),
    listedPrice: price.positive().optional(),
    orderable: z.boolean().optional(),
    termsVersion: z.string().trim().min(1).max(80).optional(),
    catalogOptions: catalogOptionsSchema.optional(),
    featured: z.boolean().optional(),
    featuredOrder: z.number().int().min(0).max(9999).optional(),
    mediaId: z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,80}$/)
      .optional(),
    priceCheckedAt: z.number().int().positive().optional(),
    publishAt: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.orderable && (!v.listedPrice || !v.termsVersion || !v.market))
      c.addIssue({
        code: "custom",
        message: "Đặt mua cần giá trọn gói, quốc gia và phiên bản điều khoản.",
      });
    if (v.orderable) {
      const check = catalogProductSchema.safeParse({
        ...v,
        status: "published",
        version: 1,
      });
      if (!check.success)
        c.addIssue({
          code: "custom",
          message: "Lựa chọn đặt mua chưa hợp lệ theo hợp đồng catalog.",
        });
    }
    if (v.status === "scheduled" && (!v.publishAt || v.publishAt <= Date.now()))
      c.addIssue({ code: "custom", message: "Giờ xuất bản phải ở tương lai." });
  });
export function contentOnly(row: ContentRow) {
  return Object.fromEntries(
    columns
      .filter(
        (c) =>
          c !== "id" &&
          c !== "version" &&
          row[c as keyof ContentRow] !== undefined,
      )
      .map((c) => [c, row[c as keyof ContentRow]]),
  );
}
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted) {
        quoted = false;
        closed = true;
      } else if (!cell && !closed) quoted = true;
      else throw Error("Dấu ngoặc kép CSV không hợp lệ.");
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.replace(/\r$/, ""));
      if (row.length > 100) throw Error("Tối đa 100 cột.");
      cell = "";
      closed = false;
      if (c === "\n") {
        rows.push(row);
        if (rows.length > 501) throw Error("Tối đa 500 dòng sản phẩm.");
        row = [];
      }
    } else {
      if (closed && c !== "\r") throw Error("CSV có ký tự sau ô đã đóng.");
      cell += c;
    }
  }
  if (quoted) throw Error("CSV thiếu dấu ngoặc kép đóng.");
  row.push(cell.replace(/\r$/, ""));
  if (row.length > 100) throw Error("Tối đa 100 cột.");
  if (row.some(Boolean)) rows.push(row);
  if (rows.length > 501) throw Error("Tối đa 500 dòng sản phẩm.");
  return rows;
}
async function safeZip(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () =>
    Error("Tệp Excel hỏng hoặc định dạng ZIP không được hỗ trợ.");
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === bytes.length
    ) {
      end = i;
      break;
    }
  }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true))
    throw invalid();
  const count = view.getUint16(end + 10, true);
  const centralSize = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true),
    total = 0;
  const centralEnd = offset + centralSize;
  if (!count || count > 1000 || centralEnd !== end) throw invalid();
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > centralEnd || view.getUint32(offset, true) !== 0x02014b50)
      throw invalid();
    const flags = view.getUint16(offset + 8, true),
      method = view.getUint16(offset + 10, true);
    const packed = view.getUint32(offset + 20, true),
      size = view.getUint32(offset + 24, true);
    const n = view.getUint16(offset + 28, true),
      extra = view.getUint16(offset + 30, true),
      comment = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    if (
      offset + 46 + n + extra + comment > centralEnd ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      size === 0xffffffff ||
      packed === 0xffffffff
    )
      throw invalid();
    const name = new TextDecoder().decode(
      bytes.slice(offset + 46, offset + 46 + n),
    );
    if (
      /vbaProject|externalLinks/i.test(name) ||
      name.split("/").includes("..")
    )
      throw Error(
        "Không nhận macro, liên kết ngoài hoặc đường dẫn không hợp lệ.",
      );
    total += size;
    if (
      total > 20 * 1024 * 1024 ||
      local + 30 > centralEnd ||
      view.getUint32(local, true) !== 0x04034b50
    )
      throw invalid();
    const dataStart =
      local +
      30 +
      view.getUint16(local + 26, true) +
      view.getUint16(local + 28, true);
    if (dataStart + packed > centralEnd) throw invalid();
    if (method === 0) {
      if (packed !== size) throw invalid();
    } else {
      // Check actual inflated bytes before the workbook parser allocates XML trees.
      if (typeof DecompressionStream === "undefined")
        throw Error(
          "Trình duyệt chưa hỗ trợ đọc Excel an toàn. Dùng CSV hoặc cập nhật trình duyệt.",
        );
      const stream = new Blob([bytes.slice(dataStart, dataStart + packed)])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"));
      const reader = stream.getReader();
      let inflated = 0;
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          inflated += chunk.value.byteLength;
          if (inflated > size) {
            await reader.cancel();
            throw invalid();
          }
        }
      } finally {
        reader.releaseLock();
      }
      if (inflated !== size) throw invalid();
    }
    offset += 46 + n + extra + comment;
  }
  if (offset !== centralEnd) throw invalid();
}
export async function readSpreadsheet(
  file: File,
): Promise<{ name: string; rows: string[][] }[]> {
  if (file.size > 5 * 1024 * 1024) throw Error("Tệp tối đa 5 MB.");
  if (/\.csv$/i.test(file.name))
    return [
      {
        name: "CSV",
        rows: parseCsv((await file.text()).replace(/^\uFEFF/, "")),
      },
    ];
  if (!/\.xlsx$/i.test(file.name)) throw Error("Chỉ nhận .xlsx hoặc .csv.");
  const buffer = await file.arrayBuffer();
  await safeZip(new Uint8Array(buffer));
  const { Workbook } = await import("exceljs");
  const book = new Workbook();
  await book.xlsx.load(buffer);
  return book.worksheets.map((sheet) => {
    if (sheet.rowCount > 501 || sheet.columnCount > 100)
      throw Error("Tối đa 500 dòng và 100 cột mỗi sheet.");
    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const cells: string[] = [];
      for (let col = 1; col <= sheet.columnCount; col++) {
        const value = row.getCell(col).value;
        if (
          typeof value === "object" &&
          value !== null &&
          !(value instanceof Date)
        )
          throw Error(
            "Không nhận công thức, liên kết hoặc ô định dạng phức tạp.",
          );
        cells.push(
          value instanceof Date ? String(value.getTime()) : String(value ?? ""),
        );
      }
      rows.push(cells);
    });
    return { name: sheet.name, rows };
  });
}
export type ImportRow = {
  line: number;
  content: Record<string, unknown>;
  existing?: ContentRow;
  error?: string;
  operationId: string;
  result?: "saved" | "failed";
  committed?: { id: string; version: number };
  message?: string;
};
export function previewRows(
  rows: string[][],
  mapping: string[],
  inventory: ContentRow[],
): ImportRow[] {
  if (rows.length > 501) throw Error("Tối đa 500 dòng.");
  const mapped = mapping.filter(Boolean);
  if (new Set(mapped).size !== mapped.length)
    throw Error("Một trường đang ghép với nhiều cột.");
  if (!mapped.includes("title") || !mapped.includes("slug"))
    throw Error("Cần ghép cột title và slug.");
  const seen = new Set<string>();
  return rows.slice(1).flatMap((cells, index) => {
    if (!cells.some((cell) => cell.trim())) return [];
    const content: Record<string, unknown> = {};
    let existing: ContentRow | undefined, error: string | undefined;
    try {
      const record = Object.fromEntries(
        mapping.flatMap((key, i) => (key ? [[key, cells[i] ?? ""]] : [])),
      );
      const id = record.id?.trim();
      const slug = record.slug?.trim();
      existing = id
        ? inventory.find((r) => r.id === id)
        : inventory.find((r) => r.slug === slug);
      if (id && !existing) throw Error("Mã sản phẩm không tồn tại.");
      if (
        existing &&
        record.version &&
        String(existing.version) !== record.version.trim()
      )
        throw Error("Phiên bản đã thay đổi; xuất lại dữ liệu trước khi nhập.");
      if (
        slug &&
        inventory.some((r) => r.slug === slug && r.id !== existing?.id)
      )
        throw Error("Đường dẫn đã thuộc sản phẩm khác.");
      const key = existing?.id ?? slug;
      if (!key || seen.has(key)) throw Error("Sản phẩm bị trùng trong tệp.");
      seen.add(key);
      if (existing) Object.assign(content, contentOnly(existing));
      else Object.assign(content, { status: "draft", orderable: false });
      for (const [field, raw] of Object.entries(record)) {
        if (field === "id" || field === "version") continue;
        if (!(columns as readonly string[]).includes(field))
          throw Error("Cột không được hỗ trợ.");
        const value = raw.trim();
        if (!value) continue;
        if (/^[=+@]/.test(value) || /^-[^0-9]/.test(value))
          throw Error(
            `${columnLabels[field as Column]} có công thức hoặc tiền tố không an toàn.`,
          );
        if (
          [
            "referencePrice",
            "listedPrice",
            "priceCheckedAt",
            "publishAt",
            "featuredOrder",
          ].includes(field)
        ) {
          if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
            throw Error(
              `${columnLabels[field as Column]} cần số nguyên, không dùng dấu phân cách.`,
            );
          content[field] = Number(value);
        } else if (["orderable", "featured"].includes(field)) {
          if (!["true", "false"].includes(value))
            throw Error(
              `${columnLabels[field as Column]} cần true hoặc false.`,
            );
          content[field] = value === "true";
        } else if (["usageSteps", "catalogOptions"].includes(field))
          content[field] = value
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean);
        else content[field] = value;
      }
      Object.assign(content, spreadsheetContent.parse(content));
    } catch (e) {
      error =
        e instanceof z.ZodError
          ? e.issues
              .map(
                (i) =>
                  `${columnLabels[i.path[0] as Column] || "Thông tin sản phẩm"}: ${i.code === "custom" && /[à-ỹ]/i.test(i.message) ? i.message : i.code === "too_small" ? "Giá trị nhỏ hoặc ngắn hơn giới hạn cho phép." : i.code === "too_big" ? "Giá trị vượt giới hạn cho phép." : "Kiểu dữ liệu, giá trị hoặc định dạng chưa hợp lệ."}`,
              )
              .join("; ")
          : (e as Error).message;
    }
    return [
      {
        line: index + 2,
        content,
        existing,
        error,
        operationId: crypto.randomUUID(),
      },
    ];
  });
}
export async function executeImportRows(
  rows: ImportRow[],
  dependencies: {
    stopped: () => boolean;
    commit: (row: ImportRow) => Promise<{ id: string; version: number }>;
    readback: () => Promise<ContentRow[]>;
    progress: (row: ImportRow) => void;
  },
) {
  for (const row of rows) {
    if (dependencies.stopped()) break;
    if (row.error || row.result === "saved" || row.committed) continue;
    dependencies.progress(row);
    try {
      const result = await dependencies.commit(row);
      if (
        !result.id ||
        !Number.isSafeInteger(result.version) ||
        result.version < 1
      )
        throw Error(
          "Chưa xác minh được kết quả lưu; giữ mã thao tác để thử lại.",
        );
      row.committed = result;
      row.message = "Đã gửi thành công, đang chờ kiểm tra dữ liệu.";
    } catch (e) {
      row.result = "failed";
      row.message = (e as Error).message;
    }
    dependencies.progress(row);
  }
  const pending = rows.filter((row) => row.committed && row.result !== "saved");
  if (!pending.length) return;
  let committed: ContentRow[] = [],
    readError = "";
  try {
    committed = await dependencies.readback();
  } catch (e) {
    readError = (e as Error).message;
  }
  for (const row of pending) {
    const result = row.committed!;
    const item = committed.find((candidate) => candidate.id === result.id);
    if (
      readError ||
      !item ||
      item.version !== result.version ||
      Object.entries(row.content).some(
        ([key, value]) =>
          JSON.stringify(item[key as keyof ContentRow]) !==
          JSON.stringify(value),
      )
    ) {
      row.result = "failed";
      row.message =
        readError || "Kết quả đọc lại chưa khớp; giữ mã thao tác để thử lại.";
    } else {
      row.result = "saved";
      row.message = `Đã xác minh phiên bản ${result.version}`;
    }
    dependencies.progress(row);
  }
}
export async function downloadSheet(
  rows: Record<string, unknown>[],
  name: string,
  format: "xlsx" | "csv",
) {
  const stringify = (v: unknown) =>
    Array.isArray(v) ? v.join("\n") : String(v ?? "");
  let bytes: BlobPart;
  if (format === "csv")
    bytes =
      "\uFEFF" +
      [
        columns.join(","),
        ...rows.map((row) =>
          columns.map((c) => csvCell(stringify(row[c]))).join(","),
        ),
      ].join("\r\n");
  else {
    const { Workbook } = await import("exceljs");
    const book = new Workbook();
    const sheet = book.addWorksheet("Products");
    sheet.addRow([...columns]);
    for (const row of rows) sheet.addRow(columns.map((c) => stringify(row[c])));
    if (name === "mau-san-pham") {
      const guide = book.addWorksheet("Hướng dẫn");
      guide.addRow(["Trường", "Ý nghĩa"]);
      columns.forEach((key) => guide.addRow([key, columnLabels[key]]));
      guide.addRow([
        "Ô trống",
        "Giữ giá trị cũ khi cập nhật; không xóa trường.",
      ]);
      guide.addRow([
        "Giá",
        "Số nguyên VND, không dấu phân cách. Giá tham khảo không dùng thanh toán.",
      ]);
      guide.addRow([
        "Thời gian",
        "Timestamp Unix mili giây. Trạng thái: draft, published, scheduled, archived.",
      ]);
      guide.addRow([
        "Ảnh",
        "mediaId đã upload qua form với quyền sử dụng ảnh; không nhận URL ảnh.",
      ]);
      guide.addRow([
        "Ví dụ",
        "Thay dòng mẫu ở sheet Products bằng dữ liệu đã xác minh trước khi nhập.",
      ]);
      guide.columns.forEach((column) => (column.width = 45));
    }
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((c) => (c.width = 24));
    bytes = new Uint8Array(await book.xlsx.writeBuffer());
  }
  const url = URL.createObjectURL(
    new Blob([bytes], {
      type:
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
