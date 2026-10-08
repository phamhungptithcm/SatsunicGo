# Product Content Review — approved guidance

## Scope
Owner Settings knowledge approval, Vietnamese web form; customer quoted-guidance answer in VI/EN. Existing Membership required radio-group marker supporting fix. Reviewed 2026-10-07 Chicago against current source and actual component rendered on shared 5207. Browser backend/auth are synthetic; no production MFA/App Check acceptance inferred. Apple platform contract: not applicable; human interface principles applied as cross-platform quality reference.

## Context and evidence
Observed: backend requires verified Google, OWNER, recent MFA, active unlocked staff; explicit published source, hash/version and language/effective dates; rechecks source for each answer. Approval never opens LLM budget. Source edits/unpublishing/revocation invalidate evidence. Immutable revisions retained. Unknown result retries same command. Approved-but-unusable sources remain revocable. Unknown: authoritative production article IDs and approved business policies; no business terms invented.

## Content inventory
| Location/state | Current content and user job | Behavior/data evidence |
|---|---|---|
| Owner heading/explanation | Hướng dẫn cho Ask; only reviewed articles and effective dates; approval does not enable LLM spending | Server lifecycle and existing paid gate |
| Source inputs | Nguồn bài viết, Bài viết, Blog, Mã bài viết, required *, Kiểm tra nguồn | Valid source enum/ID; source preview from server |
| Evidence states | Source title/body; Đang được duyệt / bản duyệt hiện không dùng được / chưa có nguồn đang được duyệt; Phiên bản | active is current hash+time; approved means stored approval, not current availability |
| Approval fields | Ngôn ngữ, Tiếng Việt, English, Có hiệu lực từ, Hết hiệu lực lúc; browser timezone; review checkbox | Exact language and UTC instant; dates validated server-side |
| Actions | Duyệt nguồn cho Ask, Thu hồi nguồn, Đối chiếu thao tác đang chờ | Explicit review for approve; revoke unavailable source; immutable retry op ID |
| Loading/disabled | Đang kiểm tra nguồn…; actions and source fields disabled while pending | running ref and pending operation |
| Success | Đã duyệt / đã thu hồi; tải lại để kiểm tra trạng thái mới | Validated response version expected+1, not optimistic result |
| Definite failure | Chưa duyệt được nguồn; tải lại và kiểm tra quyền, nội dung hoặc phiên bản mới | Typed backend rejection clears preview; no success claim |
| Unknown/offline | Chưa xác minh được kết quả; đối chiếu thao tác đang chờ | Same immutable command reused; changing payload blocked |
| Preview failure | Chưa kiểm tra được nguồn; kiểm tra mã bài viết và xác thực quản trị | User-safe error, no private data exposed |
| Unavailable body | Nội dung hiện không khả dụng; vẫn có thể thu hồi nguồn đã duyệt | Missing/unpublished preview vs approved state |
| Customer VI/EN | From reviewed guidance; excerpts are not a quotation or order confirmation | Quoted source text only, no generated inference or financial status |
| Membership radio group | Loại gói * | One required group marker, no false requirement on every option |

## State coverage
Default, pending, disabled, explicit approve, revoke, stale, success, unknown/recovery and mobile exercised in six actual-component browser scenarios. Backend forbidden/MFA/locked/unpublished/language/date/hash/version/direct-read cases exercised in seven demo integration cases. Live offline, authenticated real account, screen-reader and production acceptance NOT_RUN. No-result returns to existing guarded Ask path; bounded lexical retrieval does not imply corpus completeness.

## Data semantics
Source of truth: published document plus exact approval hash/version/time; title/body are escaped React text. No raw HTML execution. Epoch/account ownership fences discard late callbacks. Browser timezone explicitly shown; no invented fees, policies, ETA or payment state. Corpus quotas limit work, not paid model tokens. Current public citation link is not revision-specific; immutable snapshot is audit evidence, not a new public citation page.

## Mandatory Human Interface Principles
| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED within slice | Review exact source before making it available to Ask |
| Agency | PASSED within slice | Explicit checkbox + approve; independent revoke and same-operation retry |
| Responsibility | PASSED within slice | No inferred approval or spending; dates/hash/version enforced; quoted-answer qualification |
| Familiarity | PASSED within slice | Natural Vietnamese controls, retained LLM and English where appropriate |
| Flexibility | PASSED within slice | Desktop/mobile, VI/EN source choice; browser timezone explicit |
| Simplicity | PASSED within slice | Source→preview→review→approve; no hidden execution from chat |
| Craft | PASSED within slice | Actual mobile screenshot inspected; required marker repaired; no horizontal overflow |
| Delight | PASSED within slice | Source preserved on unknown result, no duplicate operation on retry |

## Platform fit and evidence limits
Native select, datetime-local, labelled inputs, heading association, role=status and disabled fieldsets. Required marker aria-hidden accompanies native required article ID. Source evidence wraps and scrolls in constrained panel. Screenshots: output/knowledge-approval/mobile-preview.png, expired-revoke-preview.png and state PNGs. Fixture proves rendering and client transitions only. Current component is Vietnamese owner UI; complete English owner Settings and entire Ask task expansion are not claimed.

Decision: scoped copy/behavior review PASSED; full platform and production handoff BLOCKED by recorded acceptance gaps. Memory candidates: None.
