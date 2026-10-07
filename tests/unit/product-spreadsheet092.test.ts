import { describe, expect, it } from "vitest";
import { Workbook } from "exceljs";
import {
  contentOnly,
  executeImportRows,
  parseCsv,
  previewRows,
  readSpreadsheet,
} from "../../src/features/content/product-spreadsheet";
import type { ContentRow } from "../../src/shared/public-content";
const product: ContentRow = {
  id: "real-product",
  version: 4,
  title: "Original product",
  slug: "original-product",
  body: "Verified description",
  status: "published",
  referencePrice: 300000,
  listedPrice: 500000,
  orderable: true,
  termsVersion: "terms-v1",
  market: "US",
  brand: "Brand",
  mediaId: "owned-media",
  usageSteps: ["Use per label"],
  catalogOptions: ["Large"],
};
describe("product spreadsheet safety and roundtrip", () => {
  it("parses quoted commas/newlines/escaped quotes and CRLF", () => {
    expect(
      parseCsv('title,body\r\n"Cream, gentle","Line one\nLine ""two"""'),
    ).toEqual([
      ["title", "body"],
      ["Cream, gentle", 'Line one\nLine "two"'],
    ]);
  });
  it("rejects broken quoting and row overflow", () => {
    expect(() => parseCsv('title\n"unclosed')).toThrow();
    expect(() => parseCsv("x\n" + Array(501).fill("v").join("\n"))).toThrow();
  });
  it("creates draft without inventing prices", () => {
    const [r] = previewRows(
      [
        ["title", "slug", "body"],
        ["Cream", "new-cream", "Verified description"],
      ],
      ["title", "slug", "body"],
      [],
    );
    expect(r.error).toBeUndefined();
    expect(r.content).toMatchObject({ status: "draft", orderable: false });
    expect(r.content).not.toHaveProperty("referencePrice");
    expect(r.content).not.toHaveProperty("listedPrice");
  });
  it("preserves fields and publication when partial update has blank cells", () => {
    const [r] = previewRows(
      [
        ["id", "title", "slug", "brand", "referencePrice"],
        [product.id, "Updated product", product.slug, "", ""],
      ],
      ["id", "title", "slug", "brand", "referencePrice"],
      [product],
    );
    expect(r.error).toBeUndefined();
    expect(r.content).toMatchObject({
      brand: "Brand",
      mediaId: "owned-media",
      referencePrice: 300000,
      listedPrice: 500000,
      status: "published",
      usageSteps: ["Use per label"],
    });
    expect(r.existing?.version).toBe(4);
  });
  it("keeps reference and listed prices separate", () => {
    const [r] = previewRows(
      [
        ["title", "slug", "body", "referencePrice"],
        ["Cream", "new-cream", "Verified description", "200000"],
      ],
      ["title", "slug", "body", "referencePrice"],
      [],
    );
    expect(r.content.referencePrice).toBe(200000);
    expect(r.content).not.toHaveProperty("listedPrice");
  });
  it("rejects duplicate identities, stale version and unknown IDs", () => {
    const rows = [
      ["title", "slug", "body"],
      ["Cream", "new-cream", "Verified description"],
      ["Cream again", "new-cream", "Verified description"],
    ];
    expect(previewRows(rows, rows[0], [])[1].error).toMatch(/trùng/);
    expect(
      previewRows(
        [
          ["id", "title", "slug", "version"],
          [product.id, "Cream", product.slug, "2"],
        ],
        ["id", "title", "slug", "version"],
        [product],
      )[0].error,
    ).toMatch(/Phiên bản/);
    expect(
      previewRows(
        [
          ["id", "title", "slug"],
          ["unknown", "Cream", "new-cream"],
        ],
        ["id", "title", "slug"],
        [],
      )[0].error,
    ).toMatch(/không tồn tại/);
  });
  it("rejects ambiguous/negative prices, formulas and invalid booleans", () => {
    for (const value of ["1,000", "1.000", "-1", "=SUM(A1)"]) {
      expect(
        previewRows(
          [
            ["title", "slug", "body", "referencePrice"],
            ["Cream", "new-cream", "Verified description", value],
          ],
          ["title", "slug", "body", "referencePrice"],
          [],
        )[0].error,
      ).toBeTruthy();
    }
    expect(
      previewRows(
        [
          ["title", "slug", "body", "orderable"],
          ["Cream", "new-cream", "Verified description", "yes"],
        ],
        ["title", "slug", "body", "orderable"],
        [],
      )[0].error,
    ).toBeTruthy();
  });
  it("requires actual terms/market/listed price before ordering", () => {
    expect(
      previewRows(
        [
          ["title", "slug", "body", "orderable"],
          ["Cream", "new-cream", "Verified description", "true"],
        ],
        ["title", "slug", "body", "orderable"],
        [],
      )[0].error,
    ).toMatch(/Đặt mua/);
  });
  it("strips identity/audit/private metadata from exported content", () => {
    const content = contentOnly({
      ...product,
      author: "private",
      mediaAlt: "alt",
    });
    expect(content).not.toHaveProperty("id");
    expect(content).not.toHaveProperty("author");
    expect(content).not.toHaveProperty("mediaAlt");
    expect(content.mediaId).toBe("owned-media");
  });
  it("reads a real xlsx workbook and roundtrips product fields", async () => {
    const book = new Workbook(),
      sheet = book.addWorksheet("Products");
    sheet.addRow(["title", "slug", "body", "referencePrice"]);
    sheet.addRow(["Cream", "new-cream", "Verified description", "200000"]);
    const bytes = new Uint8Array(await book.xlsx.writeBuffer());
    const data = await readSpreadsheet(new File([bytes], "products.xlsx"));
    expect(
      previewRows(data[0].rows, data[0].rows[0], [])[0].content.referencePrice,
    ).toBe(200000);
  });
  it("rejects actual xlsx formula cells", async () => {
    const book = new Workbook(),
      sheet = book.addWorksheet("Products");
    sheet.addRow(["title"]);
    sheet.getCell("A2").value = {
      formula: 'HYPERLINK("https://invalid", "link")',
      result: "link",
    };
    const bytes = new Uint8Array(await book.xlsx.writeBuffer());
    await expect(
      readSpreadsheet(new File([bytes], "products.xlsx")),
    ).rejects.toThrow(/công thức/);
  });
  it("rejects oversized or unsupported input before parsing", async () => {
    await expect(
      readSpreadsheet(new File(["abc"], "products.xlsm")),
    ).rejects.toThrow(/Chỉ nhận/);
    await expect(
      readSpreadsheet(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "products.xlsx"),
      ),
    ).rejects.toThrow(/5 MB/);
  });
});

describe("confirmed import execution", () => {
  it("keeps identities on retry, skips saved rows and verifies readback", async () => {
    const rows = previewRows(
      [
        ["title", "slug", "body"],
        ["First product", "first-product", "Verified description"],
        ["Second product", "second-product", "Verified description"],
      ],
      ["title", "slug", "body"],
      [],
    );
    const identities = rows.map((row) => row.operationId);
    const saved: ContentRow[] = [];
    const calls: string[] = [];
    let fail = true;
    const dependencies = {
      stopped: () => false,
      progress: () => {},
      readback: async () => saved,
      commit: async (row: (typeof rows)[number]) => {
        calls.push(row.operationId);
        if (row === rows[1] && fail) throw Error("Temporary failure");
        const id = String(row.content.slug);
        saved.push({ ...row.content, id, version: 1 } as ContentRow);
        return { id, version: 1 };
      },
    };
    await executeImportRows(rows, dependencies);
    expect(rows.map((row) => row.result)).toEqual(["saved", "failed"]);
    fail = false;
    await executeImportRows(rows, dependencies);
    expect(calls).toEqual([identities[0], identities[1], identities[1]]);
    expect(rows.map((row) => row.result)).toEqual(["saved", "saved"]);
  });
  it("cancellation stops unsent rows and mismatch stays retryable", async () => {
    const rows = previewRows(
      [
        ["title", "slug", "body"],
        ["First product", "first-product", "Verified description"],
        ["Second product", "second-product", "Verified description"],
      ],
      ["title", "slug", "body"],
      [],
    );
    let stopped = false;
    let count = 0;
    await executeImportRows(rows, {
      stopped: () => stopped,
      progress: () => {},
      readback: async () => [],
      commit: async () => {
        count++;
        stopped = true;
        return { id: "first-product", version: 1 };
      },
    });
    expect(count).toBe(1);
    expect(rows[0].result).toBe("failed");
    expect(rows[1].result).toBeUndefined();
  });
  it("retains original Excel row numbers across blank rows", () => {
    const rows = previewRows(
      [
        ["title", "slug", "body"],
        [],
        ["Product name", "product-name", "Verified description"],
      ],
      ["title", "slug", "body"],
      [],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].line).toBe(3);
  });
});

it("rejects dishonest ZIP inflated size before workbook loading", async () => {
  const book = new Workbook();
  book.addWorksheet("Products").addRow(["title", "slug", "body"]);
  const bytes = new Uint8Array(await book.xlsx.writeBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset + 46 < bytes.length; offset++)
    if (
      view.getUint32(offset, true) === 0x02014b50 &&
      view.getUint32(offset + 24, true) > 0
    ) {
      view.setUint32(offset + 24, 1, true);
      break;
    }
  await expect(
    readSpreadsheet(new File([bytes], "dishonest.xlsx")),
  ).rejects.toThrow();
});

it("caps CSV columns and preserves blank line positions", () => {
  expect(() => parseCsv(Array(102).fill("column").join(","))).toThrow(
    "100 cột",
  );
  expect(
    parseCsv("title,slug,body\n\nName,name,Verified description"),
  ).toHaveLength(3);
});
it("does not resubmit a committed row when readback recovers", async () => {
  const rows = previewRows(
    [
      ["title", "slug", "body"],
      ["Product name", "product-name", "Verified description"],
    ],
    ["title", "slug", "body"],
    [],
  );
  let commits = 0;
  let unavailable = true;
  const dependencies = {
    stopped: () => false,
    progress: () => {},
    commit: async () => {
      commits++;
      return { id: "product-name", version: 1 };
    },
    readback: async () => {
      if (unavailable) throw Error("Offline");
      return [
        { ...rows[0].content, id: "product-name", version: 1 } as ContentRow,
      ];
    },
  };
  await executeImportRows(rows, dependencies);
  expect(rows[0].result).toBe("failed");
  unavailable = false;
  await executeImportRows(rows, dependencies);
  expect(commits).toBe(1);
  expect(rows[0].result).toBe("saved");
});
