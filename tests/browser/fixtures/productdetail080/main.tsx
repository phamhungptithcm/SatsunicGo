import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { ProductDetails } from "../../../../src/features/content/ProductDetail";
import { ContentEditor } from "../../../../src/features/content/ContentEditor";
import { ProductReviewModeration } from "../../../../src/features/content/ProductReviewModeration";
import "../../../../src/styles/global.css";
import "../../../../src/styles/public-ux.css";
import "../../../../src/features/crm/Workspace.css";
import "../../../../src/features/crm/crm-ux028.css";
const w = window as unknown as {
  product080Render: (kind?: string, long?: boolean) => void;
};
const root = createRoot(document.getElementById("app")!);
w.product080Render = (kind = "product", long = false) =>
  root.render(
    <MemoryRouter>
      {kind === "editor" ? (
        <section className="workspaceShell">
          <div className="workspaceContent">
            <ContentEditor />
          </div>
        </section>
      ) : kind === "moderation" ? (
        <section className="page">
          <ProductReviewModeration />
        </section>
      ) : (
        <section className="page productDetail">
          <ProductDetails
            key={long ? "long" : "short"}
            row={{
              id: "product-1",
              title: long
                ? "Tên sản phẩm Việt Nam rất dài ".repeat(12)
                : "Kirkland Signature Vitamin E 180 mg",
              slug: "vitamin-e",
              body: long
                ? "Thông tin sản phẩm đã xác minh. ".repeat(100)
                : "500 viên nang mềm.",
              status: "published",
              version: 1,
              market: "US",
              brand: "Kirkland Signature",
              retailer: "Costco",
              usageSteps: [
                "Đọc hướng dẫn trên nhãn.",
                "Xem lưu ý và bảo quản.",
              ],
              origin: "",
              sourceUrl: "javascript:alert(1)",
            }}
          />
        </section>
      )}
    </MemoryRouter>,
  );
w.product080Render();
