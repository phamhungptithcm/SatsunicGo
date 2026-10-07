import { useId, useState } from "react";
import type { ContentRow } from "../../shared/public-content";
import "./product-detail080.css";
export function ProductInformationFields({ row }: { row: ContentRow | null }) {
  const inputId = useId();
  const [steps, setSteps] = useState<string[]>(row?.usageSteps ?? []);
  const [summary, setSummary] = useState(row?.productSummary ?? "");
  return (
    <details className="crmItemDetails sgProductFields" open>
      <summary>Thông tin sản phẩm</summary>
      <label>
        Xuất xứ sản xuất
        <input
          name="manufacturingOrigin"
          maxLength={200}
          defaultValue={row?.manufacturingOrigin}
          placeholder="Theo nhãn hoặc nguồn hãng"
        />
      </label>
      <label>
        Thương hiệu
        <input name="brand" maxLength={120} defaultValue={row?.brand} />
      </label>
      <div>
        <label htmlFor={`${inputId}-summary`}>Mô tả ngắn</label>
        <textarea
          id={`${inputId}-summary`}
          name="productSummary"
          maxLength={500}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
      <label>
        Nơi dự kiến mua
        <input
          name="retailer"
          maxLength={120}
          defaultValue={row?.retailer}
          placeholder="Costco, Walmart…"
        />
      </label>
      <label>
        Nguồn kiểm chứng
        <input
          type="url"
          name="sourceUrl"
          maxLength={2048}
          defaultValue={row?.sourceUrl}
        />
      </label>
      <h3 className="crmSectionHeading">Hướng dẫn sử dụng</h3>
      <input
        type="hidden"
        name="usageSteps"
        value={JSON.stringify(steps.map((s) => s.trim()).filter(Boolean))}
      />
      {steps.map((step, index) => (
        <div className="sgUsageRow" key={index}>
          <input
            aria-label={`Hướng dẫn ${index + 1}`}
            maxLength={500}
            value={step}
            onChange={(e) =>
              setSteps((old) =>
                old.map((s, i) => (i === index ? e.target.value : s)),
              )
            }
          />
          <button
            type="button"
            aria-label={`Đưa hướng dẫn ${index + 1} lên`}
            disabled={index === 0}
            onClick={() =>
              setSteps((old) => {
                const next = [...old];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                return next;
              })
            }
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Xóa hướng dẫn ${index + 1}`}
            onClick={() => setSteps((old) => old.filter((_, i) => i !== index))}
          >
            ×
          </button>
        </div>
      ))}
      <div className="sgUsageActions">
        <button
          type="button"
          disabled={steps.length >= 20}
          onClick={() => setSteps((old) => [...old, ""])}
        >
          Thêm hướng dẫn
        </button>
      </div>
      {row?.usage && !steps.some((s) => s.trim()) && (
        <p className="notice">
          Trang sản phẩm tiếp tục dùng cách dùng đã lưu bên dưới khi chưa có
          hướng dẫn dạng danh sách.
        </p>
      )}
      <details>
        <summary>Xem trước</summary>
        {summary && <p>{summary}</p>}
        <ul className="sgUsagePreview">
          {steps
            .filter((s) => s.trim())
            .map((s, i) => (
              <li key={i}>{s}</li>
            ))}
        </ul>
      </details>
    </details>
  );
}
