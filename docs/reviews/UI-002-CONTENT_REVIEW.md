# Product Content Review — UI-002

## Scope

Surfaces: fixed web navigation, footer, home market tiles, published catalog cards/loading/empty/stale/offline/error, route loading and shared toast. Audience: Vietnamese shoppers and authorized staff; task: find a source/item, send a request and understand persisted feedback. Source authority: approved parent SATSUNICGO-001 v1 and current user UI/cache request. Platform: responsive React web; native web links, keyboard focus, polite status/error alert, reduced motion. Apple-only HIG compliance not applicable. Reviewer: current agent, 2026-10-04.

## Context and evidence

Current implementation and HunpeoLabs source were read; no assets or private service content copied. Motion preserves Satsunic white/navy/royal-blue identity. Market artwork is abstract decoration, not a purchasable product/brand/availability claim. Only published products/posts enter the new in-memory cache. Unit fixtures verify lifecycle; no browser-rendered proof exists because the previously rejected local URL cannot be accessed through another surface.

## Content inventory and state coverage

Full candidate literal extraction: CONTENT_STRING_INVENTORY.json (superset; string extraction is not rendered acceptance). New strings reside in SiteChrome.tsx, App.tsx, Content.tsx, public-content.ts, live-cache.ts, Toast.tsx and explicit request/transfer/CMS notices.

| Surface/state | Content/meaning | Source evidence | Rendered gate |
| --- | --- | --- | --- |
| Navbar default/current/focus | Sản phẩm, Cách mua hộ, Biểu phí, Membership, Bài viết, Hỗ trợ; current NavLink | SiteChrome; horizontal mobile nav; CSS focus | BLOCKED_EXTERNAL |
| Account disabled/pending/result/error | Đăng nhập Google, Đang đăng nhập…, Đã đăng nhập/đăng xuất; safe error and persistent banner | App authBusy; notice only after SDK result; durable inline error | BLOCKED_EXTERNAL |
| Footer/default | Real destination groups, truthful pending commercial policy | SiteFooter and existing routes/publicCopy | BLOCKED_EXTERNAL |
| Market tiles/action | US/JP/KR, Gửi yêu cầu mua hộ; no price/stock/delivery claim | Link to real request form; graphic aria-hidden | BLOCKED_EXTERNAL |
| Catalog pending | Đang tải nội dung…; static skeleton not falsely empty | cache loading includes initial empty SDK cache pending server | BLOCKED_EXTERNAL |
| Catalog empty/error/retry | Published empty distinct from failed query; retry is read-only | Catalog and cache fail/retry; permission rejection discards snapshot | BLOCKED_EXTERNAL |
| Catalog stale/offline | Last-load label and ngoại tuyến; no claim of current price | metadata.fromCache + online events; published-only query | BLOCKED_EXTERNAL |
| Catalog price/date | Giá tham khảo, price check date; staff verifies before quote | Existing referencePrice/priceCheckedAt semantics retained | BLOCKED_EXTERNAL |
| Shared toast pending | Đang xử lý… after 400ms; no automatic business success | Reference-counted callable activity; inline recovery retained | BLOCKED_EXTERNAL |
| Shared toast result/hover/focus/hidden | Five-second result budget; all holds end before resume; stale-ID-safe close | feedback unit tests; Toast host timers/cleanup | BLOCKED_EXTERNAL |
| Request success | Đã gửi yêu cầu mua hộ; real order navigation | Server command returns before notify/navigation | BLOCKED_EXTERNAL |
| Transfer result | Đã gửi thông báo… chờ đối soát; not paid | transferReview confirmation, immutable finance path unchanged | BLOCKED_EXTERNAL |
| CMS result | Đã lưu nội dung; does not imply published or marketing sent | saveContent resolves before notice | BLOCKED_EXTERNAL |
| Confirmation/destructive | No new destructive action or automatic consent | No server financial/access contract changed | NOT_APPLICABLE |

## Eight principles and platform fit

| Principle | Current source rationale | Current final gate |
| --- | --- | --- |
| Purpose | Market/catalog links lead to browsing and real purchase requests | BLOCKED: rendered task not run |
| Agency | Reachable mobile links, retry/dismiss, focus/hover holds; no forced sale | BLOCKED: keyboard/viewport not run |
| Responsibility | Cached/offline labels and transfer pending distinguish source from authoritative money | BLOCKED: complete in-context review not run |
| Familiarity | Standard nav/footer/cards and concise Vietnamese controls | BLOCKED: rendered/accessibility not run |
| Flexibility | 3 desktop cards, mobile row tiles, responsive catalog/nav, reduced motion | BLOCKED: 390/768/1440 and keyboard not run |
| Simplicity | Single notice; loading distinguished from empty; footer groups task links | BLOCKED: density/overlap not run |
| Craft | Fixed header offset, reserved image aspect ratio, cleanup and stale callback guards | BLOCKED: browser layout/motion not run |
| Delight | Gentle finite transitions and preserved work/cached public reads | BLOCKED: timing/frame-time not measured |

Overall BLOCKED. Natural-source copy and compiler/tests do not replace current rendered evidence. No 100% parity, no-lag, FPS, contrast, mobile-keyboard or screen-reader certification.
