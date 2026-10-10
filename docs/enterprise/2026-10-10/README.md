# SatsunicGo — Enterprise Documentation & Due Diligence

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Mục đích và cách sử dụng

Bộ hồ sơ gồm 40 chương nghiệp vụ, thiết kế, hợp đồng kỹ thuật, kiểm thử, vận hành và thương mại. Phần thuyết minh dùng tiếng Việt; tên API, trường dữ liệu và biểu thức kiểm tra giữ đúng mã nguồn. Đơn vị thu tiền là VND; thị trường nguồn trong nghiệp vụ gồm US, JP, KR. Nhân viên thực hiện mua hàng và vận hành kho; AI không tự phê duyệt tiền hoặc xuất hàng.

| Chương | Nội dung |
| --- | --- |
| 01 | [Yêu cầu nghiệp vụ](01-business-requirements.md) |
| 02 | [Đặc tả chức năng](02-functions.md) |
| 03 | [Quy tắc nghiệp vụ](03-business-rules.md) |
| 04 | [Tài liệu hệ thống](04-system-documentation.md) |
| 05 | [Thiết kế tổng thể hệ thống](05-high-level-design.md) |
| 06 | [Thiết kế chi tiết hệ thống](06-detailed-design.md) |
| 07 | [Tài liệu hạ tầng](07-infrastructure.md) |
| 08 | [Triển khai và quay về phiên bản trước](08-deployment.md) |
| 09 | [Tài liệu cấu hình](09-configuration.md) |
| 10 | [Củng cố hệ thống và nghiệm thu chất lượng](10-hardening-and-acceptance.md) |
| 11 | [Kịch bản demo và hồ sơ giới thiệu](11-demo-and-commercial.md) |
| 12 | [Hồ sơ thẩm định và quyết định còn mở](12-data-room.md) |
| 13 | [Liên kết yêu cầu, mã nguồn và kiểm chứng](13-traceability.md) |
| 14 | [Tài khoản, đăng nhập và phân quyền](14-identity-and-access.md) |
| 15 | [Danh mục sản phẩm, biến thể và giá](15-catalog-and-pricing.md) |
| 16 | [Hành trình khách hàng và trạng thái giao diện](16-customer-journeys.md) |
| 17 | [Yêu cầu mua hộ, báo giá và tìm nguồn](17-request-quote-sourcing.md) |
| 18 | [Mua hàng, tiếp nhận và vận hành kho](18-buying-and-warehouse.md) |
| 19 | [Vận chuyển, gom kiện và theo dõi giao hàng](19-logistics-and-tracking.md) |
| 20 | [Thu tiền, đối soát, số dư và hoàn tiền](20-finance-and-reconciliation.md) |
| 21 | [Thay thế, hủy, trả hàng và ngoại lệ](21-changes-and-returns.md) |
| 22 | [Membership, chứng từ và lịch sử phát hành](22-membership-and-documents.md) |
| 23 | [Thông báo và lựa chọn liên lạc](23-notifications-and-consent.md) |
| 24 | [AI, tri thức và hành động có kiểm soát](24-ai-and-knowledge.md) |
| 25 | [Analytics và định nghĩa chỉ số](25-analytics-and-kpis.md) |
| 26 | [Nội dung, hình ảnh và xuất bản](26-content-media-and-publication.md) |
| 27 | [Sổ tay vận hành thường ngày](27-operations-handbook.md) |
| 28 | [Sự cố và khôi phục dịch vụ](28-incident-response.md) |
| 29 | [Sao lưu, phục hồi và chuyển đổi dữ liệu](29-backup-restore-and-migration.md) |
| 30 | [Chiến lược kiểm thử và nghiệm thu](30-quality-and-test-strategy.md) |
| 31 | [Tích hợp với hệ thống ngoài](31-integration-contracts.md) |
| 32 | [Bảo mật, quyền riêng tư và rủi ro](32-security-and-privacy.md) |
| 33 | [Hiệu năng, tải và chi phí](33-performance-and-cost.md) |
| 34 | [Bàn giao, đào tạo và hỗ trợ](34-handover-and-support.md) |
| 35 | [Hồ sơ thương mại và gọi vốn](35-commercial-and-investment.md) |
| 36 | [Quản trị yêu cầu và thay đổi](36-governance-and-decisions.md) |
| 37 | [Hợp đồng backend chi tiết](37-api-contracts.md) |
| 38 | [Từ điển dữ liệu và schema nghiệp vụ](38-data-dictionary.md) |
| 39 | [Hướng dẫn sử dụng theo vai trò](39-user-guides.md) |
| 40 | [Danh mục yêu cầu và biên bản nghiệm thu](40-requirements-and-acceptance-record.md) |
| Phụ lục | [Danh mục export Functions](functions-inventory.md) |
| Phụ lục | [Danh mục biến cấu hình](configuration-inventory.md) |

## Quy ước bằng chứng

- **OBSERVED_SOURCE**: có mã nguồn/cấu hình được đọc tại snapshot này; chưa chứng minh chạy đúng.
- **DESIGN_TARGET**: mục tiêu nghiệm thu hoặc vận hành đề xuất, chưa phải cam kết sản phẩm.
- **NOT_RUN**: chưa chạy kiểm tra trong nhiệm vụ tài liệu này.
- **NOT_VERIFIED**: chưa đối chiếu trực tiếp với môi trường hoặc nhà cung cấp hiện tại.
- **TODO(owner)**: quyết định thương mại, pháp lý hoặc vận hành cần người sở hữu cung cấp.

Các báo cáo kiểm thử trước đây là bằng chứng lịch sử. Không chuyển chúng thành kết quả kiểm thử của snapshot hiện tại. Doanh thu, khách hàng, thị phần, SLA, chứng nhận, khả năng đa tenant và định giá chưa được chứng minh trong nhiệm vụ này.

## Quản trị và phát hành tài liệu

Chủ sản phẩm duyệt yêu cầu/quy tắc; engineering duyệt thiết kế; finance duyệt tiền/hoàn tiền; operations duyệt runbook; người có thẩm quyền duyệt nội dung thương mại. Vai trò là đề xuất trách nhiệm, chưa có người được chỉ định. Mỗi thay đổi cần revision, người duyệt và nguồn mới. Khi nguồn đổi, kiểm tra lại manifest và hạ các claim liên quan về NOT_VERIFIED.

Chỉ chia sẻ deck giới thiệu ra ngoài sau kiểm tra nội dung thương mại. Tài liệu thiết kế, inventory và review là tài liệu nội bộ, cung cấp dưới NDA theo phạm vi thẩm định. Không gửi snapshot dữ liệu khách hàng, secret hoặc cấu hình thực tế kèm hồ sơ.

## Phát hiện cần chú ý

Tài liệu cũ mô tả custom luôn thanh toán hai đợt. Mã hiện tại còn có custom upfront checkout với `deposit = total`. Không được áp quy tắc 50% cho mọi custom order. `releaseCapabilities.email` hiện là true trong nguồn nhưng điều kiện môi trường và policy vẫn bắt buộc; nguồn này không chứng minh email production đã gửi. Workflow release hiện có WIF và kiểm tra provider, khác tài liệu deployment cũ. Có guest tracking theo mã chia sẻ hạn chế; order ID đơn thuần vẫn không cấp quyền xem đơn riêng tư.
