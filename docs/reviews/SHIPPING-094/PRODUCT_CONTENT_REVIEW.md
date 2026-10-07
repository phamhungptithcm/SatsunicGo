# Product Content Review — SHIPPING-094 v1

## Scope

Surface: Shipping/Consolidation, staff CRM web; Vietnamese; warehouse/operations users create parcels, consolidate freight and hand off shipments. Files: Shipping.tsx, Consolidation.tsx, shipping-workbench.css. Goal: clear action hierarchy and accountable shipping decisions. Reviewer: Codex, 2026-10-06 America/Chicago.

Native HTML forms/details, WAI-ARIA tabs, persistent labels, native numeric/datetime validation. Apple-platform compliance: NOT_APPLICABLE; human-centered principles used on the web without Apple controls or expression.

## Context and evidence

Verified against source: max selection 10 orders and 20 parcels, item quantities keyed by order/line, g/cm/VND fields, local-time cutoff. Lists are paginated views, not global totals. Seal allocates freight; it does not collect payment. Non-catalog final total requires customer review before shipping. Existing snapshots, permission predicates, generation checks, locks, reconciliation and unknown-command retry remain unchanged (token-level named-function comparison in CANDIDATE.json).

Assumption: task refers to the staff Shipping screen shown in the supplied screenshot; confirmed by source text and route /crm/shipping. No new business workflow, discount, ETA, totals, filtering or carrier integration is invented.

## Content inventory

Each new or modified string below is matched to its in-context role. Existing field labels, domain statuses, outcome, error/recovery text and accessible names are preserved.

| Location/state | New or revised content | User job / meaning evidence |
| --- | --- | --- |
| Heading | Kiện & vận chuyển | Identify entire shipping workspace |
| Heading description | Đóng kiện, gom lô và theo dõi bàn giao. | Existing pack/seal/dispatch/track flows |
| Tablist accessible label | Kiện và lô gom | Distinguish the two views |
| Tabs/section heading | Kiện hàng; Lô gom & cước | Parcel vs batch records; mounted hidden panels preserve drafts |
| Parcel toolbar | Quản lý kiện từ đóng gói đến bàn giao và giao hàng. | Existing states packed/in_transit/delivered/failed/returned |
| Parcel create action | Tạo kiện | Opens form; performs no command |
| Parcel empty heading | Chưa có kiện trong trang này | Loaded page only, not system-wide absence |
| Parcel empty, pack role | Chọn Tạo kiện để đóng kiện từ các đơn đã kiểm và đóng gói. | Existing packingComplete and hold predicate; action visible only to pack roles |
| Parcel empty, other role | Kiện sẽ xuất hiện tại đây khi có dữ liệu trong phạm vi được xem. | Honest scoped absence; no promised refresh or permission |
| Pack disclosure | Tạo kiện từ đơn đã đóng gói | Existing form operates on packed orders |
| Both create disclosures | Thu gọn | Collapses form; draft retained; returns focus to create button |
| Pack sections | 1 Chọn đơn; 2 Hàng trong kiện; 3 Thông tin kiện; 4 Kiểm tra đóng gói | Numbered groups, not wizard steps; all editable |
| Pack selection group accessible label | Đơn đủ điều kiện đóng kiện | Filter packingComplete && !hold; checkbox list |
| Pack item empty hint | Chọn đơn để nhập số lượng sản phẩm trong kiện. | Quantity inputs rendered only for selected eligible orders |
| Pack consequence hint | Kiện nội bộ dùng để quản lý hàng, không thay thế nhãn của hãng vận chuyển. | Existing internal parcel object; no carrier-label generation |
| Parcel pagination | Trang {page} · {length} kiện trong trang | Loaded page count, no invented system total |
| Batch toolbar | Gom kiện cùng kho và tuyến, phân bổ cước rồi bàn giao theo lô. | Existing consolidation invariants and dispatch |
| Batch create button | Tạo lô gom | Opens existing seal form |
| Batch empty heading | Chưa có lô gom trong trang này | Loaded batch page, not global count |
| Batch empty hint | Tạo lô gom từ các kiện đã đóng gói để phân bổ cước và bàn giao cùng nhau. | Existing sealed/dispatch flows |
| Batch sections | 1 Chọn kiện; 2 Phân bổ khối lượng; 3 Cước & dịch vụ; 4 Kiểm tra và chốt lô | Actual fields and seal consequence |
| Batch constraint hint | Chọn toàn bộ kiện của các đơn tham gia. Các kiện phải cùng kho và tuyến. | Existing backend/domain invariant, moved to selection context |
| Batch selection group accessible label | Kiện đủ điều kiện gom lô | state packed && !batchId; only eligible rows |
| Seal consequence | Chốt lô chỉ phân bổ cước, chưa ghi nhận thu tiền. Tổng cuối của đơn mua hộ cần được khách duyệt trước khi xuất gửi. | Existing seal behavior and needsFinalReview acknowledgment |
| Batch pagination | Trang {page} · {length} lô trong trang | Batch page only |

## State coverage

| State | Result | Current evidence |
| --- | --- | --- |
| Default/action/selected | PASSED | Toolbar, tabs, pack groups and batch groups screenshots; browser tab assertions |
| Loading/pending/disabled | PASSED | Delayed intercepted queue; tabs disabled while shared read lock active; unknown command locks tab changes |
| Empty/no results | PASSED | desktop-empty.png; empty state box icon does not suggest successful completion; no global total |
| Success | PASSED | success.png; intercepted acknowledged command, result region focused after readback |
| Error/recovery | PASSED | error.png; preserved draft and disabled mutation until reconciliation; same-command retry verified |
| Offline/stale/partial | PASSED within local UI scope | UNAVAILABLE response and uncertain.png; no fresh/zero claim on error; true network-offline/provider behavior NOT_TESTED |
| Unauthorized | PASSED | Permission-denied response removes all tab panels and private data; exact existing message asserted |
| Confirmation/consequences | PASSED | Parcel label caveat and seal-payment caveat near submit; existing handoff evidence requirements preserved |
| Destructive action | NOT_APPLICABLE | No destructive operation added |

## Data semantics

Source: listWork rows and readRecords snapshots. Counts labeled in-page; empty pagination hidden only on first empty page, later-page recovery preserved. Selection zero is explicit user selection, not unavailable telemetry. Units g/cm/₫ and local datetime remain attached to labels; existing locale formatting remains. No new persistence, logs, third-party dependencies, tracking or privileged data access. Frontend fixture data is synthetic and requests to command endpoints are intercepted; screenshot evidence is not real financial or logistics proof.

## Mandatory Human Interface principles

| Principle | Status | In-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Two workspaces; create action at toolbar; stages match user task |
| Agency | PASSED | Editable groups, native collapse, preserved drafts across tabs and errors; same-command recovery |
| Responsibility | PASSED | Internal-label boundary and no-payment seal consequence at decision points; permission failure hides data |
| Familiarity | PASSED | Existing Vietnamese terms, HTML input/detail controls, semantic tabs; blue/navy shared tokens |
| Flexibility | PASSED | Desktop 1440, mobile 390/320, 200% zoom, arrow/Home keyboard, persistent labels, 80-character identifiers, reduced-motion media |
| Simplicity | PASSED | One queue per view; pagination beside matching queue; four meaningful form groups; no repeated global explanation |
| Craft | PASSED | Desktop/mobile screenshots inspected, dimension row optimized, collapse focus restored and tested; page identity/no framework overlay/no uncaught runtime error checked |
| Delight | PASSED | Draft retention, calm empty/error text and predictable recovery save work; no gratuitous animation |

## Platform fit and pattern checks

Web target; WAI-ARIA tab/tabpanel associations and roving focus; native disclosure and validation. Brand uses existing royal blue/navy/white tokens with isolated selectors. Screenreader manual announcement testing and non-Chromium browsers NOT_TESTED; semantic names/groups and keyboard behavior verified programmatically. No Apple-only convention or asset introduced.

| Pattern | Status | Evidence |
| --- | --- | --- |
| Writing/labels/controls | PASSED | Inventory above, persistent field labels and consequence-specific submits |
| Feedback/interruption | PASSED | Existing loading/error/status feedback preserved; opening forms never issues a command |
| Alerts/consequential choices | PASSED | Existing alert/reconcile flow and field guards, proximate cước caveat |
| Help/onboarding | PASSED | Short contextual hints, no mandatory tour |
| Privacy/permission | PASSED | Existing role predicates and denied state retained |
| Inclusion/localization | PASSED in scoped Chromium checks | Natural Vietnamese, wrapped IDs, 320px, keyboard and zoom; RTL is not a supported locale in this screen |

## Gate results

All required scoped dimensions PASSED: principle mapping, web fit, source meaning, business/user context, tone, concise meaning, state coverage, data/privacy, semantic accessibility, Vietnamese wrapping and terminology, current rendered context. Current evidence: tests/browser/shipping094.spec.ts and /private/tmp/shipping094 screenshots. Product Language Gate: PASSED for local presentation scope. No live-provider or production certification.

Findings fixed: full-width create header; explicit Thu gọn affordance; focus returns on collapse; dimensions grouped; empty-page pagination removed; selection list bounded and exposed as named group. Residual limits: manual assistive technology and other browser engines; actual billed cost/provider tokens unavailable. Required owner decision: None within approved scope.
