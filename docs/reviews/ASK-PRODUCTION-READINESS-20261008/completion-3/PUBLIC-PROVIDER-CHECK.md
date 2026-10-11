# Gemini · Thông tin công khai

Đối chiếu ngày 2026-10-08 từ tài liệu chính thức Google. Đây là public documentation readback, không phải gọi model, xác nhận IAM/billing/project health hoặc acceptance của ứng dụng.

- Model page hiện ghi gemini-2.5-flash-lite ở GA, hỗ trợ us-central1 và retirement ngày **20-10-2026**. Trang được cập nhật 07-10-2026. [Model](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash-lite) · [Lifecycle](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/model-versions).
- Standard text pricing hiện là USD0.10/1M input tokens và USD0.40/1M output tokens. Search grounding có quota chung được công bố và mức phí riêng khi vượt quota; chưa biết usage chung của project. Không suy quota còn lại hoặc actual charge từ bảng giá. [Pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing).
- URL Vertex docs/pricing hiện redirect tới Gemini Enterprise Agent Platform. Đây là redirect tài liệu công khai, không chứng minh endpoint/project hoặc region đã đổi.

Source research hiện cố định model/region và pricing expiry 2026-10-09T00:00:00Z. Không kéo dài expiry, thay model hoặc mở paid dispatch từ readback này. Delta cần review model lifecycle, current rates/limits và oracle trước triển khai; không silent fallback khi model hết hỗ trợ. Lifetime ledger vẫn reserved50.000₫, actual cost Unavailable. Không gọi countTokens/generateContent, không đọc credentials/customer/billing data hoặc gửi provider prompt trong đợt kiểm tra này.
