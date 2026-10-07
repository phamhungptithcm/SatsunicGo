# Product Content Review — content slice r2

Surface: CMS editor, campaigns and personal notifications. Audience: Vietnamese staff editors and signed-in customers. Platform: web React forms/links; Apple-only styling not applicable. Reviewer: content agent, 2026-10-04. Contracts read: product-content-integrity, product-content profile, write-product-content principle and surface references.

Verified behavior: server published status controls public visibility; campaign socialPosting remains disabled; listWork pagination limited30; notifications owner filter and createdAt DESC. Unknown: rendered desktop/mobile/focus/screen-reader and live provider delivery NOT_RUN.

| Location/state | Changed strings | Meaning/source |
|---|---|---|
| CMS/loading | Đang tải nội dung… | In-flight listWork only |
| CMS/empty | Chưa có nội dung. | Completed empty list with no error |
| CMS/pagination | Xem thêm nội dung | Server next cursor, preserves rows |
| CMS/recovery | Tải lại danh sách | Retries current kind |
| Campaign/loading | Đang tải chiến dịch… | In-flight listWork |
| Campaign/empty | Chưa có chiến dịch. | Completed empty list without message |
| Campaign/pagination | Xem thêm chiến dịch | next cursor |
| Campaign/recovery | Tải lại danh sách | Refresh current collection |
| Notifications/title | Thông báo của bạn · 30 thông báo mới nhất | ownerId filter, descending createdAt, limit30 |
| Notifications/loading | Đang tải thông báo… | Listener awaiting result |
| Notifications/disconnected | Thông báo chưa kết nối được. Thử lại sau. | Missing Firebase db, no false zero |
| Notifications/recovery | Tải lại | Resubscribes listener |
| Notifications/event | Membership đã được kích hoạt; Membership đã hết hạn | Actual membershipActivated/membershipExpired producers |
| Notifications/unknown | Bạn có cập nhật mới | Generic event, no assumed order |
| Notifications/targets | Xem membership; Xem tài khoản | Membership route or safe account fallback |

State coverage: default actions and disabled pending covered in source; loading/empty/errors explicit; save success existing toast/message preserved; provider errors preserved; offline uses listener failure recovery, no offline-provider success claim; unauthorized enforced server, UI displays existing error; no destructive action introduced. Dates local display, server timestamp retained on unchanged minute input; null schedule explicitly cleared. Sources are authoritative documents/callables; no demo money/data invented, no customer PII surfaced to public.

| Principle | Status | Evidence |
|---|---|---|
| Purpose | NOT_RUN | Source identifies task; needs rendered verification |
| Agency | NOT_RUN | Retry/pagination/action explicit; needs keyboard/browser |
| Responsibility | NOT_RUN | Accurate newest30/unknown targets; live states unverified |
| Familiarity | NOT_RUN | Natural Vietnamese web controls; rendered check absent |
| Flexibility | NOT_RUN | Local timestamps/account cleanup; device check absent |
| Simplicity | NOT_RUN | Bounded pages and inline recovery; browser check absent |
| Craft | NOT_RUN | Source/test regression evidence; layout/accessibility absent |
| Delight | NOT_RUN | No new motion; current interaction browser check absent |

Platform fit: standard web controls and role status/alert preserved; no Apple-only expression copied. Pattern checks writing/feedback/accounts/localization source-reviewed, rendered evidence NOT_RUN. Product Language Gate BLOCKED pending parent current screenshots and in-context accessibility/interaction verification. No successful final product handoff claimed.
