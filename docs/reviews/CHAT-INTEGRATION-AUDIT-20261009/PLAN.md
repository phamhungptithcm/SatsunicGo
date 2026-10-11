# Kiểm tra các chat và ghép đủ changes local

Scope: các chat SatsunicGo hoạt động ngày 8–9/10/2026, múi giờ America/Chicago, và source hiện hành. Yêu cầu trực tiếp: kiểm tra override giữa các chat, không bỏ sót functions/changes mới nhất, đưa đủ code local đã duyệt vào release bình thường.

Repository intelligence: DEGRADED (CodeGraph stale; CocoIndex stale/unhealthy). Dùng Git, source canonical, lịch sử execution metadata, handoff hashes và receipt phát hành. Không dùng kết quả này làm fresh whole-system review.

## Bằng chứng và quyền hiện có

- Production v0.7.1/99822aa đã verified nhưng chỉ chứa phần CI đã commit; App.tsx production vẫn có Cọc 50%. Local App.tsx và candidate da9369f giống byte-for-byte, đúng nội dung ảnh người dùng gửi.
- Quyền tích hợp/phát hành tự động và các delta email v1/v1.1/v1.2 đã được người dùng duyệt trong chat chính.
- CI-REPAIR v1 được duyệt trực tiếp tại chat release ngày 09/10 21:40:53Z; candidate da9369f đã CI green. Người dùng chọn hoàn tất PRE-001 trước deploy ngày 09/10 22:13:26Z.
- Người dùng yêu cầu AI review optional trong chat CI; main99822aa chứa delta này và đã release bình thường. Giữ AI optional, các quality gate bắt buộc giữ nguyên.

## Thực hiện trong scope đã duyệt

1. Kiểm tra 14 chat người dùng và 13 subagent được local index xác định hoạt động trong hai ngày; loại guardian approval reviews khỏi danh sách chat phát triển. Lưu chỉ metadata đường dẫn/file/hash, không transcript, reasoning, credential hay production payload.
2. Đối chiếu mọi input canonical Git-visible trong src, functions/src/assets, packages, scripts, tests, public, workflows và config. Browser output, cache và generated public-assets được ghi riêng, không sao chép mù vào release.
3. Kiểm tra các file nhiều owner đã sửa bằng current source/candidate hashes, owner manifest và diff liên quan. Không gọi hash cũ khác là mất code nếu có thay đổi tiếp theo được duyệt. Không gọi patch invocation là bằng chứng write thành công.
4. Tạo checkout Git riêng từ candidate da9369f. Merge đúng committed main99822aa (8 net CI/docs paths từ baseline0d6) vào branch hunpeolabs/integrate-all-local-20261009. Hai changed-path sets không giao nhau; nếu phát sinh conflict hoặc drift không giải thích được, dừng trước khi sửa.
5. Giữ tất cả application source đã duyệt và 12 source/test/config files của CI repair; giữ 6 canonical files của AI optional mới nhất từ main. Không copy browser output, node_modules, env, secret hoặc generated file cũ. Regenerate public assets bằng build trong checkout riêng nếu cần.
6. Kiểm tra tree coverage toàn bộ; typecheck và các regression CI/release bị ảnh hưởng. Không khởi động/reseed runtime hoặc tạo frontend mới; không chiếm harness PRE001 của owner.
7. Final review riêng cho audit/integration integrity; whole production vẫn NOT_READY đến genuine MFA acceptance, combined CI/review, immutable deployment, readback và activation/live gates. Không push main hay bật provider khi thiếu gate.

## Rủi ro, rollback và giới hạn

Chỉ ghép code đã có approval; không đổi domain rule, payment, auth/MFA, consent, quota hoặc dependency. Checkout riêng có thể bỏ đi mà shared WIP không thay đổi. Không rollback bằng cách khôi phục file snapshot cũ lên các file đang có thay đổi tiếp theo. Artifact runtime và deployed Functions phải được kiểm tra theo release workflow, source export list chỉ chứng minh contract tên.

Token usage/actual billed cost: Unavailable. Memory candidates: None.
