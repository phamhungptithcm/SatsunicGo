# Product Content Review — PAGES-007

Scope: Catalog(kind=posts), PostsHeading/PostsEmpty/PostsShortcuts, Support. Approved PAGES-007 v1. Audience: Vietnamese web visitors reading buying information or requesting support. Locale: vi-VN. Platform: responsive web, native links/select/inputs/details; no Apple-platform compliance claim. Human Interface reference used as quality principles. Reviewed 2026-10-04 by Codex.

## Context and evidence
Verified: /posts uses public published-content cache; /request, /fees and /how-it-works exist. Support sends workspaceCommand/openTicket and reads owner-filtered tickets, with existing Thread replies. Submit requires configured Firebase and user, uses UUID operationId, preserves input on failure and resets on success. Data-request submission is not completed export/deletion. Service hours are unconfirmed. No turnaround guarantee added.
Assumption: the two screenshots request both surfaces. Unknown: live support acceptance, provider/auth readiness and actual commercial policies; no claim added. Browser evidence includes actual local app plus an isolated fixture server using real changed components and mock Firebase/cache; synthetic content was never added to the app or Firestore.

## Content inventory
| Location/state | Final changed content | User job and verified meaning |
| --- | --- | --- |
| Posts heading/default, beta | Bài viết · SatsunicGo; Hiểu rõ hơn trước khi mua. | Identify reading surface; existing introduction retained |
| Posts empty/default, beta | Góc đọc của bạn; Bài viết đang được cập nhật | Identify unavailable published content, not invented articles |
| Posts empty/default | Chưa có bài viết được xuất bản. Nếu đã có món hàng muốn mua, bạn có thể gửi tên hoặc link cho SatsunicGo. | Explain true empty and existing /request next step |
| Posts empty/beta | Nội dung sẽ xuất hiện tại đây khi được xuất bản.; Xem yêu cầu mua hộ | Existing beta meaning/destination retained |
| Posts error | Tải nội dung; Nội dung chưa tải được; Thử tải lại hoặc gửi yêu cầu mua hộ nếu bạn đã chọn được món hàng. | Distinguish failure from empty and point to existing retry |
| Posts action | Gửi yêu cầu mua hộ | /request, unchanged action wording with new prominence |
| Posts shortcuts | aria-label Thông tin mua hộ; Cách mua hộ; Tìm hiểu các bước gửi yêu cầu; Biểu phí; Xem thông tin phí mua hộ | Existing /how-it-works and /fees destinations, no price claims |
| Support intro | Hỗ trợ · SatsunicGo; Bạn cần hỗ trợ gì?; Gửi câu hỏi về mua hộ hoặc đơn của bạn. Xem và trao đổi phản hồi ngay tại đây. | Existing private ticket and reply flow |
| Support guidance | Thêm một chút thông tin; Nếu câu hỏi liên quan đến đơn hàng, bạn có thể ghi kèm mã đơn để nhân viên dễ kiểm tra. | Optional context; no new required identifier |
| Support hours | Giờ nhân viên trực đang chờ đơn vị vận hành xác nhận. | Existing unconfirmed-hours meaning retained, separated visually |
| Support tickets | Yêu cầu của bạn | Only rendered when tickets exist |
| Support form | Gửi yêu cầu hỗ trợ; Mô tả điều bạn cần giúp trong biểu mẫu dưới đây. | Form heading, accessible name and submit label aligned |
| Data topics | Nhân viên sẽ kiểm tra danh tính và phạm vi xử lý. Gửi yêu cầu không có nghĩa là dữ liệu đã được xuất hoặc xóa; chứng từ có thể cần lưu theo chính sách được duyệt. | Full identity/scope/retention caveat; associated via aria-describedby |
| Purchase subject placeholder | Ví dụ: Cần kiểm tra thông tin món hàng | Example only; persistent Chủ đề label retained |
| Data subject placeholder | Ví dụ: Yêu cầu về dữ liệu cá nhân | Relevant example for export/deletion |
| Purchase message placeholder | Mô tả câu hỏi của bạn, kèm link món hàng hoặc mã đơn nếu có… | Optional context, persistent Nội dung label |
| Data message placeholder | Mô tả dữ liệu bạn cần xuất hoặc xóa… | Matches selected data-request type |
| Busy form | aria-busy=true; Đang gửi… | Existing pending text retained; disabled button |

Decorative SVG, arrows and shortcut numbers are aria-hidden. No new accessible image names needed.

## State coverage
| State | Result/evidence |
| --- | --- |
| Default/actions | PASSED: local posts/support screenshots, destinations inspected in App.tsx |
| Loading/pending/disabled | PASSED: actual posts loading plus fixture loading, pending disabled and aria-busy; actual signed-out submit disabled |
| Empty | PASSED: local empty screenshot and fixture; no fabricated publication |
| Success | PASSED for UI: mock resolves, subject/message clear and topic resets; persistence/server acceptance NOT TESTED |
| Error/recovery | PASSED for UI: posts failed/partial fixtures, support rejected-submit fixture retains subject/message/type, ticket-read error alert |
| Offline/stale/partial | PASSED for presentation: stale/partial fixture retains articles with existing warning; cache lifecycle regression tests. Live offline integration NOT TESTED |
| Unauthorized | PASSED for presentation: actual signed-out notice/disabled submit; backend controls unchanged |
| Confirmation/destructive | NOT_APPLICABLE: sending a data request does not export/delete data; caveat preserved |

## Data semantics
Source: public content cache and owner-filtered supportTickets. No units, prices, dates or enum mappings changed. True empty, failed load and stale content remain distinct. No new data collection, logging, persistence or access. FormData fields and limits retained. Fixture output contains synthetic data only.

## Mandatory principles
| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Reading surface and support form have one clear main action |
| Agency | PASSED | Native request-type choice; existing retry, optional shortcuts and replies; preserved failed input |
| Responsibility | PASSED | Sign-in boundary and full data caveat retained; no reply-time promise |
| Familiarity | PASSED | Established Vietnamese purchase/support terms, standard web form controls |
| Flexibility | PASSED | 1280px desktop, 390px mobile, 640px reflow proxy; long-ticket wrap and keyboard navigation |
| Simplicity | PASSED | Data caveat shown only for applicable topics; no fake cards in empty state |
| Craft | PASSED | Type-specific examples, persistent labels, select description, focus outline, empty/error/stale/loading checked |
| Delight | PASSED | Calm blue illustration, balanced layout and direct copy; no animation or interruption added |

## Platform fit and pattern checks
PASSED: web controls and native keyboard interaction; visible form label matches accessible name. Product white/navy/royal-blue identity retained. No Apple-only conventions/assets. Meaning, audience context, tone, brevity, terminology, data privacy and in-context verification PASSED within UI scope. Vietnamese line wrapping checked in real rendered screens. Accessibility PASSED for bounded keyboard/AX-label/focus/contrast/source checks; full screen-reader audit and cross-browser certification NOT TESTED. RTL NOT_APPLICABLE to Vietnamese-only scope. No changed animation; existing reduced-motion handling retained.

## Verification evidence and limits
Local actual-app screenshots: PAGES-007-posts-desktop.jpg, PAGES-007-posts-mobile.jpg, PAGES-007-support-desktop.jpg. Fixture screenshots: PAGES-007-posts-populated-mobile-fixture.jpg, PAGES-007-support-data-final-fixture.jpg, PAGES-007-support-tickets-mobile-fixture.jpg. CUA DOM/AX confirms selected topic/caveat and Tab from subject to message. Width checks: 390/390 and 640/640; posts mobile grid is one 350px column. 640px is a 200%-zoom reflow proxy, not an actual browser zoom or text-scaling certification.

## Decision
Product Language Gate: PASSED for approved UI scope. Findings fixed: purchase-only examples in data topics; internal “ticket” wording; positional retry instruction. No live auth/provider/backend acceptance claimed. No required owner decision within approved presentation scope.
