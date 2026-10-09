import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CheckoutLine } from "../../packages/domain/purchase-checkout";
export type PurchaseReceiptData = {
  id: string;
  ownerId: string;
  lines: CheckoutLine[];
  total: number;
  provider: string;
  paymentMethod?: "BANK_TRANSFER";
  merchant?: string;
  invoice?: string;
  testMode?: boolean;
  reference: string;
  paidAt: number;
  purpose: "initial" | "balance";
  balanceReason?: "sourcing" | "final";
  previouslyPaid: number;
  finalTotal?: number;
  previousReceiptId?: string;
  snapshotHash: string;
  shipping: { state: string; amountUsdMinor?: number };
};
/** Bounded PDF renderer: embedded licensed Unicode TTF, explicit text mapping,
 * integer financial snapshots. No HTML, remote fonts, scripts or user URLs. */
export function renderPurchaseReceipt(receipt: PurchaseReceiptData): Buffer {
  if (
    receipt.lines.length < 1 ||
    receipt.lines.length > 30 ||
    !Number.isSafeInteger(receipt.total) ||
    receipt.total <= 0 ||
    receipt.lines.reduce((s, l) => s + l.total, 0) !== receipt.total
  )
    throw Error("RECEIPT_INVALID");
  if (
    receipt.purpose === "balance" &&
    receipt.previouslyPaid + receipt.total !== receipt.finalTotal
  )
    throw Error("RECEIPT_BALANCE_INVALID");
  const compiledFont = resolve(
    __dirname,
    "../../../assets/NotoSans-Regular.ttf",
  );
  const font = readFileSync(
    existsSync(compiledFont)
      ? compiledFont
      : resolve(__dirname, "../assets/NotoSans-Regular.ttf"),
  );
  const tables = new Map<string, number>();
  for (let i = 0; i < font.readUInt16BE(4); i++)
    tables.set(
      font.toString("ascii", 12 + 16 * i, 16 + 16 * i),
      font.readUInt32BE(20 + 16 * i),
    );
  const head = tables.get("head")!,
    hhea = tables.get("hhea")!,
    hmtx = tables.get("hmtx")!,
    cmap = tables.get("cmap")!,
    units = font.readUInt16BE(head + 18),
    metrics = font.readUInt16BE(hhea + 34);
  let map = 0;
  for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
    const off = cmap + font.readUInt32BE(cmap + 8 + 8 * i);
    if (font.readUInt16BE(off) === 4) map = off;
  }
  if (!map) throw Error("FONT_CMAP_MISSING");
  function glyph(code: number) {
    const n = font.readUInt16BE(map + 6) / 2,
      end = map + 14,
      start = end + 2 * n + 2,
      delta = start + 2 * n,
      ranges = delta + 2 * n;
    for (let i = 0; i < n; i++) {
      const a = font.readUInt16BE(start + 2 * i),
        b = font.readUInt16BE(end + 2 * i);
      if (code < a || code > b) continue;
      const d = font.readInt16BE(delta + 2 * i),
        r = font.readUInt16BE(ranges + 2 * i);
      if (!r) return (code + d) & 65535;
      const g = font.readUInt16BE(ranges + 2 * i + r + 2 * (code - a));
      return g ? (g + d) & 65535 : 0;
    }
    return 0;
  }
  const used = new Map<number, { cid: number; gid: number; width: number }>();
  function char(code: number) {
    let x = used.get(code);
    if (!x) {
      let gid = glyph(code);
      if (!gid) gid = glyph(63);
      x = {
        cid: used.size + 1,
        gid,
        width: Math.round(
          (font.readUInt16BE(hmtx + 4 * Math.min(gid, metrics - 1)) * 1000) /
            units,
        ),
      };
      used.set(code, x);
    }
    return x;
  }
  const normalize = (s: string) =>
    s
      .normalize("NFC")
      .replace(/[\r\n\t]+/g, " ")
      .split("")
      .filter((c) => c.charCodeAt(0) >= 32)
      .join("")
      .slice(0, 500);
  const width = (s: string, size: number) =>
    Array.from(s).reduce(
      (v, c) => v + (char(c.codePointAt(0)!).width * size) / 1000,
      0,
    );
  const encode = (s: string) =>
    Array.from(s)
      .map((c) => char(c.codePointAt(0)!).cid.toString(16).padStart(4, "0"))
      .join("");
  const pages: string[][] = [[]];
  let page = pages[0],
    y = 786;
  // Match the website palette in src/styles/global.css without a runtime CSS dependency.
  const navy = "0.066667 0.109804 0.207843", // #111c35
    blue = "0.086275 0.235294 1", // #163cff
    muted = "0.392157 0.439216 0.529412", // #647087
    border = "0.886275 0.901961 0.937255", // #e2e6ef
    paper = "0.968627 0.972549 0.988235", // #f7f8fc
    green = "0.16 0.40 0.29";
  function text(
    s: string,
    x: number,
    top: number,
    size = 9,
    color = navy,
    emphasis = false,
  ) {
    page.push(
      `q BT /F1 ${size} Tf ${color} rg ${color} RG ${emphasis ? "0.18 w 2 Tr" : "0 Tr"} 1 0 0 1 ${x.toFixed(2)} ${top.toFixed(2)} Tm <${encode(normalize(s))}> Tj ET Q`,
    );
  }
  function right(
    s: string,
    edge: number,
    top: number,
    size = 9,
    color = navy,
    emphasis = false,
    maxWidth = Number.POSITIVE_INFINITY,
  ) {
    const measured = width(normalize(s), size);
    if (measured > maxWidth) size *= maxWidth / measured;
    text(s, edge - width(normalize(s), size), top, size, color, emphasis);
  }
  function line(top: number, left = 44, end = 551) {
    page.push(`q ${border} RG 0.6 w ${left} ${top} m ${end} ${top} l S Q`);
  }
  function panel(x: number, top: number, w: number, h: number, color = paper) {
    const r = 6,
      k = r * 0.55228475,
      bottom = top - h;
    page.push(
      `q ${color} rg ${x + r} ${bottom} m ${x + w - r} ${bottom} l ${x + w - r + k} ${bottom} ${x + w} ${bottom + r - k} ${x + w} ${bottom + r} c ${x + w} ${top - r} l ${x + w} ${top - r + k} ${x + w - r + k} ${top} ${x + w - r} ${top} c ${x + r} ${top} l ${x + r - k} ${top} ${x} ${top - r + k} ${x} ${top - r} c ${x} ${bottom + r} l ${x} ${bottom + r - k} ${x + r - k} ${bottom} ${x + r} ${bottom} c f Q`,
    );
  }
  function wrap(s: string, max: number, size = 9) {
    const out: string[] = [];
    let row = "";
    for (const word of normalize(s).split(/\s+/)) {
      if (!word) continue;
      if (width(word, size) > max) {
        if (row) out.push(row);
        row = "";
        for (const c of Array.from(word)) {
          if (width(row + c, size) > max) {
            out.push(row);
            row = c;
          } else row += c;
        }
      } else if (width(row ? `${row} ${word}` : word, size) <= max) {
        row = row ? `${row} ${word}` : word;
      } else {
        out.push(row);
        row = word;
      }
    }
    if (row) out.push(row.trim());
    return out;
  }
  const balance = receipt.purpose === "balance";
  const money = (n: number) => `${n.toLocaleString("vi-VN")} ₫`;
  function header() {
    // Fixed vector equivalent of SiteChrome's 32x32 parcel mark; no image fetch.
    page.push(
      `q 0.9375 0 0 -0.9375 44 811 cm ${blue} RG 1.8 w 1 j 16 3 m 28 10 l 16 17 l 4 10 l h S 4 10 m 4 23 l 16 30 l 28 23 l 28 10 l S 16 17 m 16 30 l S 10 6 m 22 13 l S Q`,
    );
    text("Satsunic", 82, 787, 22, navy, true);
    text("Go", 82 + width("Satsunic", 22), 787, 22, blue, true);
    text("MUA HỘ QUỐC TẾ", 82, 770, 7.5, muted);
    right("CHỨNG TỪ THANH TOÁN", 551, 784, 9, navy, true);
    line(752);
    y = 724;
  }
  function tableHeading() {
    text("Sản phẩm", 44, y, 8, muted);
    if (balance) {
      text("SL", 433, y, 8, muted);
      right("Khoản bổ sung", 551, y, 8, muted);
    } else {
      text("SL", 287, y, 8, muted);
      right("Đơn giá", 391, y, 8, muted);
      right("Phí mua hộ", 466, y, 8, muted);
      right("Thành tiền", 551, y, 8, muted);
    }
    line(y - 12);
    y -= 32;
  }
  function space(height: number, table = false) {
    if (y - height < 90) {
      page = [];
      pages.push(page);
      header();
      text("Thanh toán mua hộ - tiếp theo", 44, y, 13, navy, true);
      y -= 20;
      text(`Mã chứng từ: SG-${receipt.id}`, 44, y, 8, muted);
      y -= 30;
      if (table) tableHeading();
    }
  }
  header();
  text("Thanh toán mua hộ", 44, y, 21, navy, true);
  panel(430, y + 14, 121, 26, "0.94 0.98 0.95");
  page.push(
    `q ${green} RG 1.2 w 440 ${y + 1} m 443 ${y - 2} l 449 ${y + 5} l S Q`,
  );
  text("Đã thanh toán", 456, y - 1, 8.5, green, true);
  y -= 21;
  text(
    balance
      ? receipt.balanceReason === "sourcing"
        ? "Chênh lệch giá mua đã duyệt"
        : "Chi phí cuối đã duyệt"
      : "Giá hàng và phí mua hộ ban đầu",
    44,
    y,
    9,
    muted,
  );
  const receiptRows = wrap(`SG-${receipt.id}`, 229, 8.5),
    referenceRows = wrap(receipt.reference, 224, 8.5),
    methodRows = wrap(
      receipt.provider === "demo"
        ? "Thanh toán demo"
        : receipt.provider === "sepay_sandbox"
          ? "QR chuyển khoản · SePay sandbox"
          : receipt.provider === "payos"
            ? "PayOS"
            : receipt.provider,
      229,
      9,
    );
  const methodLabelY =
      651 - Math.max(receiptRows.length, referenceRows.length) * 12 - 19,
    methodValueY = methodLabelY - 14,
    metadataBottom =
      methodValueY -
      Math.max(
        14,
        methodRows.length * 13 + (receipt.provider === "demo" ? 12 : 0),
      ) -
      12 -
      (receipt.provider === "sepay_sandbox" ? 38 : 0);
  panel(44, 683, 507, 683 - metadataBottom);
  text("Mã chứng từ", 58, 665, 7.5, muted);
  receiptRows.forEach((row, i) => text(row, 58, 651 - i * 12, 8.5));
  text("Mã giao dịch", 313, 665, 7.5, muted);
  referenceRows.forEach((row, i) => text(row, 313, 651 - i * 12, 8.5));
  text("Phương thức thanh toán", 58, methodLabelY, 7.5, muted);
  methodRows.forEach((row, i) =>
    text(row, 58, methodValueY - i * 13, 9, navy, true),
  );
  if (receipt.provider === "demo")
    text("Không thu tiền thật", 58, methodValueY - 14, 7.5, muted);
  text("Thời gian thanh toán", 313, methodLabelY, 7.5, muted);
  const paidTime = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(receipt.paidAt));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    paidTime.find((p) => p.type === type)?.value;
  text(
    `${part("day")}/${part("month")}/${part("year")} · ${part("hour")}:${part("minute")}:${part("second")}`,
    313,
    methodValueY,
    9,
    navy,
    true,
  );
  text("Giờ Việt Nam (GMT+7)", 313, methodValueY - 14, 7.5, muted);
  if (receipt.provider === "sepay_sandbox") {
    text("Mã thanh toán SePay", 58, methodValueY - 36, 7.5, muted);
    text(receipt.invoice ?? "Chưa có mã", 58, methodValueY - 50, 8);
    text("Mã đơn vị SePay", 313, methodValueY - 36, 7.5, muted);
    text(receipt.merchant ?? "Chưa có mã", 313, methodValueY - 50, 8);
  }
  y = metadataBottom - 25;
  tableHeading();
  for (const item of receipt.lines) {
    const nameWidth = balance ? 364 : 226;
    const rows = wrap(
      balance ? item.name.replace(/^Bổ sung chi phí · /, "") : item.name,
      nameWidth,
      9.5,
    );
    const detail = balance
      ? receipt.balanceReason === "sourcing"
        ? "Chênh lệch giá mua đã duyệt"
        : "Chi phí cuối đã duyệt"
      : item.kind === "custom"
        ? "Cần tìm mua"
        : "Giá niêm yết trọn gói";
    const details = wrap(
      (item.variant ? `${item.variant} · ` : "") + detail,
      nameWidth,
      8,
    );
    const orderRows = wrap(`Mã đơn: #${item.orderId}`, nameWidth, 7.5);
    const height =
      rows.length * 14 +
      details.length * 12 +
      orderRows.length * 12 +
      21 +
      (!balance && !Number.isSafeInteger(item.goods / item.quantity) ? 14 : 0);
    space(height, true);
    rows.forEach((row, i) => text(row, 44, y - 14 * i, 9.5, navy, true));
    text(String(item.quantity), balance ? 436 : 290, y, 9.5);
    if (!balance) {
      // Unit goods price and row service fee are different bases. Never turn
      // a balance increment into an invented per-product purchase price.
      const unit = item.goods / item.quantity;
      right(
        Number.isSafeInteger(unit) ? money(unit) : "Theo tổng dòng",
        391,
        y,
        8.5,
        navy,
        false,
        82,
      );
      right(
        item.kind === "catalog" ? "Đã gồm" : money(item.service),
        466,
        y,
        8.5,
        navy,
        false,
        64,
      );
    }
    right(money(item.total), 551, y, 9.5, navy, true, balance ? 92 : 79);
    y -= rows.length * 14 + 1;
    details.forEach((row) => {
      text(row, 44, y, 8, muted);
      y -= 12;
    });
    orderRows.forEach((row) => {
      text(row, 44, y, 7.5, muted);
      y -= 12;
    });
    // If conversion only yielded a total, expose that exact goods amount
    // rather than rounding a derived unit amount into a different charge.
    if (!balance && !Number.isSafeInteger(item.goods / item.quantity)) {
      text(`Giá hàng cả dòng: ${money(item.goods)}`, 44, y, 8, muted);
      y -= 14;
    }
    line(y - 3);
    y -= 20;
  }
  const hasCustom = receipt.lines.some((l) => l.kind === "custom");
  const note = balance
    ? receipt.balanceReason === "sourcing"
      ? "Bạn đã trả phần chênh lệch giá mua. Cước và phí còn lại sẽ được chốt trước khi gửi hàng."
      : "Bạn đã thanh toán phần chi phí còn lại theo tổng tiền đã duyệt."
    : hasCustom
      ? "Cước vận chuyển, thông quan và giao nội địa của hàng cần tìm mua chưa thu. Bạn duyệt các phí này trước khi gửi hàng." +
        (receipt.lines.some((item) => item.kind === "catalog")
          ? " Hàng niêm yết giữ giá trọn gói."
          : "")
      : "Giá niêm yết là giá trọn gói.";
  const noteRows = wrap(note, 252, 8.5);
  const previousRows =
    balance && receipt.previousReceiptId
      ? wrap(`SG-${receipt.previousReceiptId}`, 252, 8)
      : [];
  const summaryHeight = Math.max(
    146,
    37 +
      noteRows.length * 13 +
      (previousRows.length ? 34 + previousRows.length * 12 : 0),
  );
  space(summaryHeight + 18);
  const summaryTop = y + 8;
  text(
    balance ? "Nội dung thanh toán" : "Thông tin mua hộ",
    44,
    y - 9,
    9.5,
    navy,
    true,
  );
  let noteY = y - 29;
  noteRows.forEach((row) => {
    text(row, 44, noteY, 8.5, muted);
    noteY -= 13;
  });
  if (previousRows.length) {
    noteY -= 12;
    text("Chứng từ trước", 44, noteY, 7.5, muted);
    noteY -= 14;
    previousRows.forEach((row) => {
      text(row, 44, noteY, 8);
      noteY -= 12;
    });
  }
  panel(322, summaryTop, 229, 137);
  const summaryRow = (label: string, value: number, top: number) => {
    text(label, 336, top, 8, muted);
    right(money(value), 537, top, 9, navy, true, 201 - width(label, 8) - 14);
  };
  if (balance) {
    summaryRow(
      receipt.balanceReason === "sourcing"
        ? "Tổng giá đã duyệt"
        : "Tổng chi phí đã duyệt",
      receipt.finalTotal!,
      y - 13,
    );
    summaryRow("Đã thanh toán trước", receipt.previouslyPaid, y - 36);
  } else {
    summaryRow(
      "Giá sản phẩm",
      receipt.lines.reduce((sum, l) => sum + l.goods, 0),
      y - 13,
    );
    summaryRow(
      "Phí mua hộ",
      receipt.lines.reduce((sum, l) => sum + l.service, 0),
      y - 36,
    );
  }
  line(y - 51, 336, 537);
  text(
    balance ? "Thanh toán lần này" : "Đã thanh toán",
    336,
    y - 73,
    9,
    navy,
    true,
  );
  right(money(receipt.total), 537, y - 105, 21, blue, true, 201);
  for (let i = 0; i < pages.length; i++) {
    page = pages[i];
    if (i === pages.length - 1) {
      const thanks =
        "Cảm ơn bạn đã tin tưởng và chọn dịch vụ mua hộ của SatsunicGo.";
      text(thanks, (595.28 - width(thanks, 8.5)) / 2, 74, 8.5);
    }
    line(58);
    text("Không thay thế hóa đơn thuế.", 44, 42, 7, muted);
    right(`Trang ${i + 1}/${pages.length}`, 551, 42, 7, muted);
  }
  if (pages.length > 12) throw Error("PDF_TOO_LARGE");
  const objects: Buffer[] = [];
  const add = (value: string | Buffer) => {
    objects.push(
      typeof value === "string" ? Buffer.from(value, "ascii") : value,
    );
    return objects.length;
  };
  const stream = (value: Buffer, extra = "") =>
    Buffer.concat([
      Buffer.from(`<< /Length ${value.length} ${extra} >>\nstream\n`),
      value,
      Buffer.from("\nendstream"),
    ]);
  add("<< /Type /Catalog /Pages 2 0 R >>");
  add("");
  const fontId = add("");
  const descriptor = add(
    `<< /Type /FontDescriptor /FontName /NotoSans /Flags 32 /FontBBox [-600 -400 2200 1100] /ItalicAngle 0 /Ascent 1069 /Descent -293 /CapHeight 714 /StemV 80 /FontFile2 5 0 R >>`,
  );
  add(stream(font, `/Length1 ${font.length}`));
  const cidMap = Buffer.alloc((used.size + 1) * 2);
  for (const x of used.values()) cidMap.writeUInt16BE(x.gid, x.cid * 2);
  const mapId = add(stream(cidMap));
  const cmapText =
    `/CIDInit /ProcSet findresource begin 12 dict begin begincmap /CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def /CMapName /NotoSansUnicode def /CMapType 2 def 1 begincodespacerange <0000> <FFFF> endcodespacerange\n` +
    Array.from(used.entries())
      .reduce((chunks: string[][], [code, x], i) => {
        if (i % 100 === 0) chunks.push([]);
        chunks
          .at(-1)!
          .push(
            `<${x.cid.toString(16).padStart(4, "0")}> <${Buffer.from(String.fromCodePoint(code), "utf16le").swap16().toString("hex")}>`,
          );
        return chunks;
      }, [])
      .map((c) => `${c.length} beginbfchar\n${c.join("\n")}\nendbfchar`)
      .join("\n") +
    "\nendcmap CMapName currentdict /CMap defineresource pop end end";
  const unicodeId = add(stream(Buffer.from(cmapText, "ascii")));
  const widths = Array.from(used.values())
    .map((x) => `${x.cid} [${x.width}]`)
    .join(" ");
  const cidId = add(
    `<< /Type /Font /Subtype /CIDFontType2 /BaseFont /NotoSans /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${descriptor} 0 R /CIDToGIDMap ${mapId} 0 R /W [${widths}] >>`,
  );
  objects[fontId - 1] = Buffer.from(
    `<< /Type /Font /Subtype /Type0 /BaseFont /NotoSans /Encoding /Identity-H /DescendantFonts [${cidId} 0 R] /ToUnicode ${unicodeId} 0 R >>`,
  );
  const kids = pages.map((p) => {
    const content = add(stream(Buffer.from(p.join("\n"), "ascii")));
    return add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${content} 0 R >>`,
    );
  });
  objects[1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((n) => `${n} 0 R`).join(" ")}] >>`,
  );
  const parts: Buffer[] = [
      Buffer.from("%PDF-1.7\n%\xff\xff\xff\xff\n", "binary"),
    ],
    offsets = [0];
  let offset = parts[0].length;
  objects.forEach((obj, i) => {
    offsets.push(offset);
    const part = Buffer.concat([
      Buffer.from(`${i + 1} 0 obj\n`),
      obj,
      Buffer.from("\nendobj\n"),
    ]);
    parts.push(part);
    offset += part.length;
  });
  parts.push(
    Buffer.from(
      `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
        .slice(1)
        .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
        .join(
          "",
        )}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`,
    ),
  );
  return Buffer.concat(parts);
}
