import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { WorkbenchComposer095 } from "../../src/features/crm/FinanceContent095";

describe("095 retained inline composer semantics", () => {
  it("keeps draft controls mounted when closed, and names the inline region", () => {
    const html = renderToStaticMarkup(
      createElement(WorkbenchComposer095, {
        open: false,
        title: "Bản nháp",
        onClose() {},
        children: createElement("input", {
          name: "draft",
          defaultValue: "Giữ nội dung",
        }),
      }),
    );
    expect(html).toContain('hidden=""');
    expect(html).toContain('value="Giữ nội dung"');
    expect(html).toContain("aria-labelledby=");
    expect(html).not.toContain('role="dialog"');
  });
  it("prevents dismissing an uncertain command through the close control", () => {
    const html = renderToStaticMarkup(
      createElement(WorkbenchComposer095, {
        open: true,
        locked: true,
        title: "Yêu cầu",
        onClose() {},
        children: "Đang chờ",
      }),
    );
    expect(html).not.toContain('hidden=""');
    expect(html).toContain(
      '<button type="button" disabled="">Đóng biểu mẫu</button>',
    );
  });
});
