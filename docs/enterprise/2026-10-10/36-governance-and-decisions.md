# Quản trị yêu cầu và thay đổi

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Nguồn quyết định

Mã nguồn nói hệ thống đang làm gì. Yêu cầu duyệt nói cần làm gì. Evidence nói điều đã kiểm chứng ở bản/môi trường cụ thể. Khi khác nhau, ghi chênh lệch và người quyết định, không chọn nguồn thuận tiện để kết luận hoàn tất.

Mockup, tên API hoặc TODO không tự thành chính sách. Quy tắc tiền/quyền cần người sở hữu và approval. Không tự bổ sung giả định thương mại để tài liệu trông đầy đủ.

## Quy trình thay đổi

Đề nghị, kiểm nguồn/ảnh hưởng, lập plan, duyệt phạm vi, thực hiện, kiểm thử, review mới rồi phát hành/nghiệm thu theo quyền. Duyệt code không tự duyệt deploy hoặc dữ liệu thật. Đổi scope cần đánh giá phần tăng thêm.

Impact xét bên gọi/sử dụng, dữ liệu, tích hợp, quyền, đồng thời, hiệu năng, tương thích, vận hành và quay về. Index cũ hỗ trợ tìm kiếm nhưng critical facts vẫn phải đọc nguồn.

## Quyết định và hồ sơ

Ghi vấn đề, phương án, cơ sở, người duyệt, ngày, scope, ràng buộc và thời điểm xem lại. Policy có phiên bản/hiệu lực/điều khoản. Kiến trúc ghi đánh đổi thực; không viết ADR như đã có đồng thuận khi chưa có.

Hồ sơ gắn manifest hoặc artifact. HEAD không đại diện thay đổi chưa commit. Nguồn đổi cần review lại; generated outputs tạo từ mã nguồn, không sửa để che mismatch.

## Trách nhiệm

Product giữ yêu cầu; engineering giữ design/implementation; QA giữ execution bằng chứng; finance giữ chính sách tiền; operations giữ hướng dẫn vận hành và môi trường; người có thẩm quyền giữ pháp lý/thương mại. Cần bổ nhiệm cụ thể trước vận hành theo hợp đồng. Tài liệu không thay approval hoặc nghiệm thu thực tế.
