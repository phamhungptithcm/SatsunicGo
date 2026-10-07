# Product Content Review — financial/document CRM presentation

## Scope
Five owned files: Finance.tsx, Refunds.tsx, FinancialReview.tsx, Documents.tsx, documents.css under src/features. Vietnamese web CRM for staff financial reconciliation; Documents also serves account/customer and shared print statement. Source-backed presentation change under root CRM_UI_PLAN approval. Native platform is web; Apple HIG platform-specific contract not applicable, bundled human-interface principles applied. Reviewer backend,2026-10-05.

## Context and evidence
Verified source: Finance confirms bank inflow then activates membership; transfer notification is not confirmed money. Refund request reserves funds, confirm records actual outflow, cancel releases reservation. FinancialReview closes exception without money, allocates verified inbound, or reverses existing inbound. Documents snapshots are immutable after issue; void is not order cancel/refund. Print StatementView and print CSS unchanged. Handler/state/request/version/operation ref logic untouched. Root shared CrmIcon decorative/text labels and CrmReference full IDs reused. Assumption: existing CRM typography/colors from root shared styles. Current rendered/focus/overflow/print evidence pending root; older207/252 and native6 baseline do not verify new presentation.

## Content inventory
| Location/state | Changed content/meaning | User job and source evidence |
|---|---|---|
| Finance default | Đối soát thanh toán; named Thông báo chuyển khoản/Hóa đơn membership/Ngoại lệ thanh toán groups | Separate loaded queues; no global count claim |
| Finance membership item | Plan name primary, Gói membership fallback; Mã hóa đơn secondary; Số tiền/Trạng thái facts | Name not a fabricated identifier; full ID preserved |
| Finance exception | Đối soát giao dịch chưa khớp; Mã ngoại lệ secondary; Số tiền/Trạng thái facts | State still source-derived open/allocated/closed |
| Finance transfer | Chờ đối soát chuyển khoản; Mã đơn secondary | Existing amount/reference and unconfirmed-money qualification retained |
| Finance empty | Chưa có hóa đơn membership / ngoại lệ thanh toán / thông báo chờ đối soát trong trang này | Loaded-page scope explicit; not whole-system absence |
| Refund item | Yêu cầu hoàn tiền; Mở đơn; Mã đơn/Mã yêu cầu secondary; Số tiền yêu cầu/Trạng thái/Lý do facts | Order link unchanged; reason and reservation-vs-confirmed outflow retained |
| Documents list | Issue number/draft title, total primary, state badge; Mã chứng từ secondary; Mở chứng từ | Same open handler and immutable totals; button has outcome label |
| FinancialReview | Decorative warning icon and compact disclosure | All existing decision/consequence strings unchanged |
| Loading/empty/error | Existing text moved into CrmState semantics; pergroup empties above | Loading status/error alert preserved, no fake success |
| Print/statement | No string/value/print-rule changes | Existing tax/snapshot/catalog/custom qualifiers retained |

## State coverage
Default/actions source-reviewed. Pending/disabled preserve busy/pending checks and saved-operation retry. Empty states remain gated by !busy&&!error and page scope. Success done/message text unchanged. Error/recovery text unchanged with alert primitive; offline enters existing error path. Partial pagination qualification unchanged (30 loaded maximum, not global). Unauthorized controlled by existing backend and list flags; no new UI authority. Consequential confirmation/void/share/reversal copy and input min/max/required retained. Focus/selected/text scaling/keyboard in context NOT_RUN pending root.

## Data semantics
VND vi-VN amounts unchanged; loaded-page groups have no fabricated totals. Full IDs remain selectable secondary references; no short codes or new names invented. Snapshot totals remain distinguished from current order balance. No source query/filter/normalization changes. Privacy and roles unchanged; share24h disclosure remains explicit.

## Mandatory Human Interface Principles
| Principle | Status | Evidence |
|---|---|---|
| Purpose | NOT_RUN | Source grouping prioritizes reconciliation/amount; current native pending |
| Agency | NOT_RUN | All actions/retry/cancel preserved; native pending |
| Responsibility | NOT_RUN | Money/void/share consequences retained; native pending |
| Familiarity | NOT_RUN | Vietnamese established terminology and web controls retained; native pending |
| Flexibility | NOT_RUN | Shared responsive classes, full ID wrapping; viewport/keyboard pending |
| Simplicity | NOT_RUN | Named facts and secondary IDs; native density check pending |
| Craft | NOT_RUN | Source states inventoried; rendered/print pending |
| Delight | NOT_RUN | Calm compact grouping, no animation; current context pending |

## Platform fit and pattern checks
Web semantic heading/dl/article/form/details/button/link retained. Icons decorative, visible text supplies meaning. Root owns shared responsive/styles and root visual validation. No Apple-only conventions. Writing/actions/feedback/consequences/privacy source-reviewed; accessibility/localization/text expansion current runtime NOT_RUN.

## Gate results / verification
Meaning matches behavior, audience context, terminology and data/privacy source-reviewed without findings. All current in-context/keyboard/viewport/print checks NOT_RUN; automated frontend compiler/lint awaiting root coordinated window. Root must verify desktop/tablet/mobile, disclosure/empty/loading/error/pending/retry, bank/refund consequence forms, document draft/issued/void/share/print and permissions. Native evidence not available at this snapshot.

## Decision
Product Language Gate BLOCKED pending current in-context evidence; this is a prepared review, not passed handoff. No known source content defect; residual sharedstyle integration/visual/print validation pending. No new permission request needed: root owns final checks under existing approval. Memory candidates None. Token/cost unavailable.

## Current scoped checks and final source audit
Four owned TSX eslint PASS exit0; frontend tsc --noEmit --incremental false PASS exit0. Root shared CSS composition update applied to document list only: title,total,state,fullreference within crmItemMain; sibling crmActions, preserving amount before action. Repeated Documents eslint and frontend noEmit after this edit PASS exit0. Handlers/request/version/operationrefs untouched, form labels/constraints and financial/void/share consequences preserved, StatementView and original printCSS unchanged. Screen-only CSS additions do not affect print media. No test/service/native runners. Current-context native/viewport/keyboard/print evidence remains NOT_RUN; eight principles remain NOT_RUN and Product Language Gate BLOCKED.

## Approved Documents footer delta
Current images at390/768/1440 found Finance group icon/text separation and Documents varying widths/footerinline; root source triage traced shared heading justify spacing and legacy workspace div.noPrint flexwrap specificity. Root owns CSS fix. Root opened window after full168157 PASS/11 FAIL; document functional failures are reported by root as old button-label selectors, not claimed passed until source-backed assertions rerun. Backend owns only move existing pagination out of documentList into distinct crmActions noPrint footer. list.next condition, same load(list.next!) handler, disabledbusy and Trang tiếp label unchanged. No ancestor read-loss/logout/stale/print handling edits. Before-edit impact recorded; no runner.

## Current bounded viewport observations and approved Finance delta
Read nine real current viewport images finance/refunds/documents390/768/1440; all mtimes verified newer than crm-final-native-before.json. Finance headings now group icon/text left; Documents equal fullwidth rows and clear right action at768/1440, stacked mobile. Visible viewport regions have no observed horizontal clipping. Refunds images are EMPTY/default only; Finance paid membership populated plus empty transfers; Documents draft/issued/void populated list only. No expanded financial form, detail/share/print, screenreader or full keyboard evidence established by these photos. Footer lies outside visible viewport; no claim of footer screenshot verification.

Eight principle bounded observations: Purpose amount/state/issue job visible; Agency labelled reload/open/disclosures and visible focusring, not tab-order proof; Responsibility membership-vs-order money, reserve-vs-outflow, immutableissued qualifiers readable; Familiarity Vietnamese web controls; Flexibility three widths stack and IDs fit, zoom/AT pending; Simplicity groupedfacts/secondaryrefs, residual Finance ID precedence; Craft prior two layout defects fixed but Finance touchingcard gap; Delight calm empty feedback/canonical styling. These observations do not certify all states or eight principles PASSED.

Root whole169 receipt reported168 PASS/1 Dashboard39012s loading failure, zero357input drift; not a fullpass. Root tracked Finance delta approval before edit; exact path validation with docs/approvals/SATSUNICGO-HARDENING-026.md PASS. Applied JSX-only invoices crmList wrapper, plan heading then prominent amount/state then secondary fullID; existing state text, form, handler, query, input constraints, busy and paging unchanged. Root owns shared gap/title/density CSS and runners. No current AFTER-delta photos/native/compiler/lint run in this chat; previous checks/photos are BEFORE this change. Product content gate remains BLOCKED pending required current context evidence. Source and private documents frozen after handoff.

## Current populated evidence — supersedes earlier pending list/form observations
Root-authorized private-review update only; all five owned source files remain frozen. Current receipt `output/playwright/release026/crm-populated-after18.json`: 18 expected PASS, zero unexpected/skipped/flaky, 55.483 seconds, start 2026-10-06T01:08:34.308Z. Read six actual populated Refunds/Finance viewport PNGs at390/768/1440; their mtimes are after this start. Earlier genuine BEFORE15 had6 PASS/9 FAIL, including touching cards; approved change added only crmList wrappers to refunds and finance exceptions. Current images show separated cards. Receipt's native-invalid/zero-command/unchanged-database controls are local evidence; photos alone do not establish those controls. Other populated modules and aggregate review belong to root/other owners.

Inventory extension: populated Refunds shows full order/refund references,240000₫ request, pending refund with money not yet confirmed out, synthetic reason, selected confirmation decision, bank-reference qualification, evidence/cancel-reason and save control. Populated Finance shows full exception reference,240000₫, reconciliation state, unmatched-context explanation and expanded FinancialReview disclosure. Selected decision closes after inspection without additional money; allocation/reversal order qualification and evidence/reason inputs remain visible. No strings or behavior changed in the gap correction. Long fixture references wrap within all three observed widths; vertical controls and card separation are visible. Native required-field feedback/focus ring is visible on desktop; browser feedback language is browser-controlled, not newly authored application copy.

| Principle | Current bounded result | Current evidence and limit |
|---|---|---|
| Purpose | PASS for observed populated states | Money/state and reconciliation/refund job remain readable; successful mutation outcomes not observed here |
| Agency | PASS for observed controls | Labelled order link, decision select, disclosure and save controls visible; full keyboard/assistive-technology journey NOT_TESTED |
| Responsibility | PASS for observed consequences | Pending refund versus confirmed outflow and close-only versus allocation money meaning explicit; provider/actual transfer NOT_TESTED |
| Familiarity | PASS for observed web context | Vietnamese business labels and ordinary web controls; browser-native validation retains browser locale |
| Flexibility | PASS for observed widths |390/768/1440 full IDs wrap, controls fit, no horizontal clipping observed; zoom/text expansion/AT NOT_TESTED |
| Simplicity | PASS for observed cards | Meaningful titles, amount/state facts, secondary full references and separated cards; unobserved loading/recovery states not certified |
| Craft | PASS for observed layout and invalid submission | Current gap regression receipt18/18, focused fields and readable forms; all consequential states/print NOT_TESTED |
| Delight | PASS for observed static context | Calm consistent spacing and readable feedback; no claim about motion or broader user experience |

Current decision: no new content/layout finding in these six observed viewport regions. Scoped populated gap regression PASS; overall Product Language Gate remains BLOCKED for complete handoff until required unobserved states have current evidence. Allocation/reversal selection and successful submission, pending/retry/error recovery, document detail/share/void/actual print, complete keyboard/AT and live money/provider flows remain NOT_TESTED by this review. Root's full197 run and fresh aggregate final review are pending; no full-product success or production readiness asserted. Repository intelligence remains DEGRADED; production NOT_READY. Memory candidates None; token/cost unavailable.

## Archived full199 round1 — current bounded refresh
Actual reporter `output/playwright/release026/crm-final199-native-round1.json` verified:138 PASS,7 FAIL,54 SKIPPED,0 flaky; start2026-10-06T01:53:07.164Z, duration698.562s. Root reports325inputs/zero drift and dedicated Functions/Auth/Storage crash `spawn node EAGAIN`; failures/skips are not accepted product evidence. No whole199 PASS asserted. Root separately confirms57 CRM default checks and18 populated checks PASS in this round; their coverage does not substitute for the skipped54 or full-product acceptance.

Read immutable archived pixels directly: `crm-screen-documents-390.png`, `crm-screen-finance-390.png`, `crm-populated-refunds-390.png`, `crm-populated-finance-1440.png` under `crm-final199-native-round1-images`. Documents mobile shows draft/issued/void list states, amounts, full references and labelled open controls fitting card width. Finance mobile shows page-scoped qualification, empty transfer state and paid membership cards with amount/state preceding full reference. Refund mobile shows request consequence explanation, pending-outflow meaning, full references wrapping and visible labelled confirmation form. Desktop Finance shows expanded close-only reconciliation form, allocation/reversal qualification, readable evidence/reason fields and separated cards. No new scoped pixel/content finding. These four current pixels refresh prior bounded observations, not every archived image or nested workflow.

Eight principles remain bounded PASS for observed regions: Purpose visible financial/document jobs and amount/state; Agency labelled controls and visible mobile reload focus; Responsibility immutable-issued, membership-vs-order, reserve-vs-outflow and close-only consequences; Familiarity Vietnamese web terminology; Flexibility mobile wrapping/stacking and desktop form fit; Simplicity grouped facts with secondary IDs; Craft current separated cards and coherent list states; Delight calm feedback/spacing. Mobile layout is OBSERVED for these current states, superseding historical mobile NOT_RUN. Complete keyboard/tab-order, AT, zoom/text expansion, allocation/reversal selected or successful outcome, pending/retry/error recovery, document detail/share/void operation/actual print and live provider/money remain NOT_TESTED. Overall Product Language Gate BLOCKED for complete handoff; production NOT_READY. Source/private-review freeze resumes after this authorized document-only refresh; no runner/source mutation. Memory candidates None; token/cost unavailable.
