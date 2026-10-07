# Product Content Review — operations and shipping CRM delta

## Current scoped status — final round4 evidence

This top section supersedes historical pending/Craft status below only for the tested subset. Independently read output/playwright/release026/crm-final199-native-round4.json:199 expected,0 unexpected/skipped/flaky. Five assigned source hashes match their recorded UI/Returns snapshots; no source edits or runner by this reviewer. Whole-suite local receipt is confirmed as a test result, not all-state/product/provider/production certification.

Craft: PASSED for clean populated shipping layout/native-invalid scope, based on actual three previously inspected immutable crm-ready-state-focused5-images/crm-populated-shipping-{390,768,1440}.png. Processing toast/loading no longer obscures first parcel heading. Full IDs wrap, packed dispatch versus in-transit manual update, warehouse/route/1500g/allocation and form labels/actions remain readable and contained. Native required-field English bubble remains browser-locale controlled; no product localization guarantee. Current scoped eight-principle populated layout/native-invalid subset is PASSED as bounded in the tables below; this does not replace unavailable evidence for other states.

Whole five-screen Product Language Gate: BLOCKED for unseen valid writes/success persistence, server error/retry/offline/stale paths, all role/closed variants, parcel creation/batch seal/dispatch success, selected Workbench/OperationsDetails PII and all nested states, assistive technology, zoom and full keyboard sequence. Existing local tests may cover distinct portions, but this reviewer does not infer those missing in-context states from aggregate199. Production NOT_READY; provider, deployed index and operational acceptance not established. No deployment/datafix/schema changes. Historical failed/interrupted receipts and previous reviews retained. Memory candidates None; token/cost totals unavailable.

## Scope

Assigned five files: operations/Workbench.tsx, OperationsDetails.tsx, Returns.tsx; shipping/Shipping.tsx, Consolidation.tsx. Audience: authorized Vietnamese staff processing order purchase, receiving, packing, returns, parcels and consolidation. Platform: responsive web CRM, semantic buttons/forms/details/table; product brand/shared primitives supplied by root. Apple-specific platform contract not applicable; bundled human-interface principles used as quality reference. Reviewer: database specialist, 2026-10-05. Approved CRM_UI_PLAN scope; no backend/index changes in this UI delta. Repository intelligence DEGRADED, bounded source inspected.

## Verified facts and content inventory

| Surface/state | Changed content/presentation | Task and source evidence |
| --- | --- | --- |
| Workbench heading/default | Existing title preserved; “Chọn đơn để xem thông tin và thực hiện thao tác phù hợp.”; icon Tải lại | Existing select and reload callbacks retained |
| Workbench list/selected | Product fallback “Xem đơn hàng”; full “Đơn” reference; stage badge; “Tạm giữ:”; “Đã thu ròng:” | stage label from domain; hold exact stored reason; collected-refunded only existing showMoney roles, not available-to-spend balance |
| Workbench decision facts | “Tổng số lượng:”, “Đã nhận:”, “Đã đóng gói:”, authorized “Đã thu ròng:” | quantities derived/existing counts, undefined received/packed omitted, zero preserved |
| Workbench loading/error/empty | “Đang tải hàng đợi…”; “Chưa tải hoặc lưu được đơn” with unchanged raw error and Tải lại; existing assigned-scope empty | Existing busy/error/loading actions retained; error also includes mutation failure |
| Workbench action/secondary | “Thao tác với đơn”; “Trao đổi, bằng chứng và công cụ của đơn” disclosure | Existing action select/form and all keyed role-gated children retained; secondary components remain mounted |
| OperationsDetails lazy/default | “Dữ liệu mua, nhận kho và đóng gói”; existing latest-record qualifier and internal-print qualifier | Existing readOrderOperations lazy toggle/generation preserved |
| OperationsDetails loading/error/action | Shared loading “Đang tải dữ liệu kho…”; error title “Chưa tải được dữ liệu kho”, existing guidance; icon print/reload | Existing authorized recipient and last purchase/receive/pack facts preserved; no recipient summary in list |
| Returns default/selected | Heading retained; state badge; full “Hồ sơ trả” reference; existing line table and primary save with icon | Authorized/received/accepted/damaged remain separate; role close guard and no-auto-refund warning retained |
| Returns loading/error/empty | Existing state copy rendered shared state, explicit “Chưa tải được hàng trả” and Thử lại | Same load callback; generation retained; true empty only !busy&&!error |
| Shipping heading/default | “Kiện hàng và xuất gửi”; “Tạo kiện, bàn giao và ghi nhận hành trình vận chuyển.”; existing internal-label and 30-record limit | Existing calls and mayPack/mayTrack preserved |
| Shipping loading/error/empty/stale | “Đang tải đơn và kiện…”; “Chưa tải được hàng đợi kiện”/Thử lại; “Chưa có kiện trong phạm vi đang xem”; prior-data notice on failed reload | New presentation loading/loadError distinct from mutation error; existing fetch calls unchanged |
| Shipping item/details/actions | “Kiện hàng” + full “Kiện” ID; “Hàng trong kiện” disclosure; icons on existing create/dispatch/track primary labels | Parcel state/warehouse/route/weight remain visible; allocations available expanded; packed/no-batch role branch unchanged |
| Consolidation heading/default | Existing heading/limit/all-parcels/same-route/seal-not-payment qualifiers retained; icons reload/create | Existing seal/dispatch callbacks unchanged |
| Consolidation loading/error/empty/stale | “Đang tải lô gom…”; “Chưa tải được lô gom”/Thử lại; “Chưa có lô gom trong phạm vi đang xem”; prior-data notice on failed reload | Presentation loading/loadError separated from save status; load requests unchanged |
| Consolidation item/actions | “Lô gom” + full “Lô” ID; icons on existing seal/dispatch labels | Cutoff/local date, route/hub/service, VND freight/shares remain visible before action; no money authority change |

All unchanged field names, required/min/max constraints, warnings, success and mutation-error copy retained. Icons are decorative aria-hidden in shared primitive; accompanying visible text supplies names. No new action eligibility inference, payment guarantees, autoapply, refund or role authority.

## State coverage and data semantics

Default/action, loading/pending/disabled, empty, error/retry, success: source covered; rendered execution NOT_RUN by specialist. Offline/forbidden uses existing error, no offline detection invented. Failed shipping/consolidation reload explicitly qualifies previously loaded rows; live freshness is not claimed. No destructive confirmation workflow introduced. Mutation controls retain existing busy logic and payloads. IDs remain complete through CrmReference. Net collected excludes reserved refunds by existing definition and is not labeled spendable balance. VND/grams/cm/vi-VN/local dates preserved. Recipient PII remains inside authorized expanded OperationsDetails; no new list exposure. 30-record shipping/consolidation limit remains explicit.

## Mandatory Human Interface principles

| Principle | Status | Evidence/remaining verification |
| --- | --- | --- |
| Purpose | NOT_RUN | Source puts job/stage/hold/facts before existing action; root rendered task evidence pending |
| Agency | NOT_RUN | Existing choices and named retry/disclosures retained; keyboard/task flow pending |
| Responsibility | NOT_RUN | Financial/privacy/partial-data qualifiers retained; current rendered review pending |
| Familiarity | NOT_RUN | Vietnamese task terms, native forms/details and labeled icons; in-context pending |
| Flexibility | NOT_RUN | Shared responsive classes and full references, no icon-only controls; mobile/zoom/keyboard pending |
| Simplicity | NOT_RUN | Compact list and secondary disclosures; density/content usability pending |
| Craft | NOT_RUN | Source state mapping and unchanged handlers inspected; compile/native/wrapping pending |
| Delight | NOT_RUN | Calm direct feedback and less repeated detail; rendered care/recovery pending |

## Platform fit and pattern checks

Responsive web, not Apple-native. No Apple-specific gestures/assets/terminology introduced. Shared CRM design system owns colors/density/wrapping. Writing/controls, feedback, help, permissions/privacy and inclusion/localization are source-reviewed but NOT_RUN in current context. Alerts use shared error semantics; success status retained. No onboarding/extra confirmation introduced.

## Gate results and verification

All final content dimensions (principles/platform fit/business meaning/context/tone/conciseness/state coverage/data privacy/accessibility/localization/terminology/in-context) NOT_RUN pending root current rendered verification. Source-only evidence is not a successful Product Language Gate. Mutation handler text comparison with immediate before copies PASSED for Workbench ActionForm, ReturnForm, Shipping and Consolidation. This is static integrity evidence, not runtime proof. All API calls, operationID creation/reuse, expectedVersion, orderVersions/parcelVersions, refs and role conditions retained. No runner/services started by database.

Decision: Product Language Gate BLOCKED pending root compile/native/current visual evidence; implementation ready for that verification, not final success. Residual load-generation risk in Shipping/Consolidation predates changes and is outside approved presentation-only delta; no request fencing introduced. Root must exercise tools/conversation/image/print. No production readiness claim. Memory candidates None; token/cost totals unavailable.

## Fresh review delta: nested disclosure access

Root reported completed native9 (7 pass, 2 image-access failures): new outer disclosure hid the existing nested OrderImages summary. This source UX finding invalidates the earlier discoverability assumption. After explicit root GO, only Workbench outer details/summary was replaced with section/h3 using the same visible group label. Nested children, role conditions, keys and mutation handlers are unchanged. Inner semantic disclosures now remain directly accessible without an extra employee click. Prior inventory row describing an outer disclosure is historical; current group is a section heading. No test/timeout/force-click changes. Root current build/image/proposal/full-native verification pending; principle and gate results remain NOT_RUN/BLOCKED until current evidence.

## Fresh populated AFTER18 in-context review

2026-10-06 UTC. Independently read crm-populated-after18.json:18 expected,0 unexpected/skip/flaky,55.483s; all entries passed. Inspected actual nine current viewport images crm-populated-{returns,shipping,batches}-{390,768,1440}.png, mtime01:08:39–01:09:20Z after receipt start01:08:34Z. Source remains frozen; only private review updated. Refund/finance/campaign receipts exist in aggregate but their visual approval belongs to other owners, not this review.

Inventory revision: Returns Hàng trả title/Mở đơn/full order ref, semantic table name Số lượng hàng trả and data-labels matching five existing columns; Xử lý hàng trả closed-default disclosure. Other form subtree/handler unchanged. Populated390 shows long name across full record width, authorized4/received3/accepted2/damaged1 distinct and visible;768 uses labeled record,1440 keeps columns. Expanded form appears after explicit summary interaction, with all required labels. Earlier overflowing/narrow-name finding fixed within these widths. Parcel images show packed versus in-transit, warehouse/route/1500g, full ID and allocations, distinct dispatch/manual tracking forms. Batch images show sealed state, local cutoff, total120000VND and per-order120000VND before dispatch fields. Native browser required-field bubble is English in this Chromium locale; product labels remain Vietnamese. No custom localized browser-message guarantee.

| Principle | Current bounded status | Current evidence and scope |
| --- | --- | --- |
| Purpose | PASSED | Relevant populated facts visible before named action for return/parcel/batch fixtures |
| Agency | PASSED | Returns summary explicitly opened; native invalid submission focuses required control and sends no command; existing editable form retained. Success/retry flows not covered |
| Responsibility | PASSED | Distinct return counts, full IDs and dispatch versus manual-update wording; invalid path exact DB unchanged. Financial/provider authority not certified |
| Familiarity | PASSED | Vietnamese labels and native forms/details, table/record mappings use existing task vocabulary |
| Flexibility | PASSED | Actual390/768/1440 populated control/fact bounds and long-name/ID wrapping; visible focused control. Screen reader/zoom/full tab order NOT_RUN |
| Simplicity | PASSED | Returns processing form closed by default, expanded on demand; all decision counts preserved without duplicate DOM |
| Craft | PASSED | Before defect fixed in current images, AFTER native-invalid assertions preserved, source handler/form equality; test screenshots may auto-scroll to focused lower form |
| Delight | PASSED | Calm named actions, visible focus and safe required-field recovery in these fixture states; no animation or subjective user-research claim |

Statuses apply only to populated layout and tested native-invalid fixture scope, not every applicable state. This scoped assessment supersedes NOT_RUN for that bounded subset only. Full five-screen Product Language Gate remains BLOCKED: server error/retry, offline/stale reload, successful submit persistence/status, closed-return role variants, parcel creation, batch seal/dispatch success, selected Workbench/OperationsDetails PII, assistive technology, text zoom and full keyboard sequence are NOT_RUN or require current separate root receipts. Default empty screenshots already reviewed but are not populated action proof. Local fixture amounts/counts are not global totals, real money/provider delivery or production acceptance. Whole197/full native result pending root, no inferred pass. Memory candidates None.

## Current immutable full199 round1 evidence refresh

Reporter independently read: output/playwright/release026/crm-final199-native-round1.json, start2026-10-06T01:53:07.164Z, duration698561.901ms,138 expected/7 unexpected/54 skipped/0 flaky. This is an incomplete failing aggregate, not whole199 acceptance. Root reports325inputs0drift and dedicated CLI EAGAIN crash; no causal/runtime reliability or production conclusion inferred by database. All18 populated entries have expected/passed status in this reporter. CRM57 default pass is root-reported; prior independently viewed default images remain bounded evidence, not silently upgraded runtime certification.

Viewed actual nine immutable current PNGs from crm-final199-native-round1-images/crm-populated-{returns,shipping,batches}-{390,768,1440}.png. New fixture identifiers differ from prior AFTER18, confirming this refresh uses round1 pixels. Returns long name/all4 count facts/fullIDs and expanded form remain readable; mobile/tablet record layout and desktop columns retain corrected meaning. Parcel/batch populated facts and exact named forms remain visible; batch amounts still fixture120000VND, not real accounting. Shipping390 screenshot includes a loading state and processing toast partially over the first parcel heading: it is mixed/transient-state evidence, not clean default/populated visual acceptance. No source changes proposed from that single capture. Native validation bubble language remains Chromium-controlled English.

| Principle | Current scoped status | Round1 evidence and limit |
| --- | --- | --- |
| Purpose | PASSED | Returns/parcel/batch facts and action labels support the specific fixture job |
| Agency | PASSED | Current populated tests retain explicit summary/form controls and native invalid/no-command assertions; actual successful action/retry untested |
| Responsibility | PASSED | Counts/status/IDs/cost qualifiers preserved; no invalid fixture mutation; not provider/money certification |
| Familiarity | PASSED | Vietnamese task terms and native semantic form/table/detail conventions retained |
| Flexibility | PASSED | Current390/768/1440 populated control bounds and return no-overflow assertions; AT/zoom/full tab order NOT_TESTED |
| Simplicity | PASSED | Return facts stay visible with deliberate processing disclosure; no duplicated count DOM |
| Craft | NOT_RUN | Returns/tablet/desktop layout supported; clean shipping390 heading/state evidence is obscured by transient toast/loading and all nested states are not exercised |
| Delight | PASSED | Calm labeled feedback and visible focus in tested invalid fixture states; no broad usability/user-research claim |

Current review decision remains BLOCKED for complete five-screen content-state acceptance. Preserve every prior gap: successful submit/persistence/status, server errors/retry/offline/stale, closed/role variants, parcel creation/batch seal/dispatch success, selected Workbench/OperationsDetails/PII, screen reader/zoom/full keyboard are NOT_TESTED here. No source/runners/services/database/index edits during this private-doc refresh. Whole199 and production NOT_READY; memory candidates None.
