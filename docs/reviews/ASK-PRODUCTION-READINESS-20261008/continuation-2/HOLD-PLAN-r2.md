# Giữ feedback cleanup ngoài bản phát hành

Phiên bản2 — trạng thái: PROPOSAL_NOT_APPLIED. Bản vá riêng đã chuẩn bị; chưa sửa application, release script hoặc tests thực tế.

Rủi ro xác minh từ source: preflight nhận diện93 Functions, nhưng artifact giữ đúng7 exports cũ; askFeedbackCleanup không được giữ. Scheduler sẽ gọi xóa record hết hạn mỗi60phút nếu export được deploy. Việc retention còn chờ chốt chưa ngăn scheduler này. Không có bằng chứng đã deploy/chạy/xóa production.

Phạm vi cụ thể chỉ gồm scripts/release/artifact.mjs:applyProductionHolds/HELD_EXPORTS và tests/unit/release108.test.mjs. Thêm cleanup vào danh sách giữ; giữ nguyên quy tắc đủ7 exports cũ; chấp nhận inventory legacy không có cleanup; cleanup có thể được giữ độc lập. Bỏ đúng export binding cleanup khỏi compiled index và inventory/manifest. Giữ lifecycle import cùng các endpoint withdraw/inbox/evaluation vì chúng cùng module. Reject cleanup binding thừa/thiếu/duplicate và partial legacy inventory. Không chạy module, không gọi scheduler, không sửa dữ liệu.

Không thay backend, retention, policy, API, database, dependency, CI YAML, nguồn/generated assets hoặc các7 holds cũ. Tăng parse một AST cho case trước đây zero-hold: đây là release CLI, không request handler. Không tuyên bố kiểm tra mọi compiled side effect; giữ/import module cần thiết không triển khai binding bị bỏ. Nếu cấu trúc compiler khác, fail closed; phục hồi bằng bản script trước trong candidate chưa deploy. Không rebuild hoặc sửa artifact đã phát hành.

Tests:8 ca mới + cập nhật duy nhất expected count7→8 trong ca cũ. Red chạy candidate tests trên baseline implementation chứng minh lỗi thật; green trên proposed implementation. Covers immutable holds, cleanup-only/legacy/all-held, source/compiled mismatch, duplicate, artifact manifest + packaged index giữ endpoint còn lại và checksum verification. Synthetic fixture không chứng minh production rollout hoặc actual source/build binding.

Sau human duyệt exact patch: kiểm tra baseline hash/current source trước git apply; chạy actual51 Node tests, preflight, lint/syntax/diff, fresh independent review. Không tự áp dụng từ báo cáo agent, không push/deploy. Corpus, feedback policy, layout và activation vẫn là quyết định riêng.

Cycle1 tái hiện export trực tiếp/module.exports bị bỏ qua. Revision2 reject explicit cleanup writes qua assignment/member/bracket/module.exports/object literal/Object.assign/Object.defineProperties; terminal void0 compiler declarations vẫn được giữ vì không expose Function. Guard này không chứng minh dynamic aliases/effects hay toàn chương trình. Candidate51cases pass, r1implementation+r2testsshow1meaningfulfailure. Đối chiếu current diagnostic TypeScript output riêng trước approval; no release package/module execution.
