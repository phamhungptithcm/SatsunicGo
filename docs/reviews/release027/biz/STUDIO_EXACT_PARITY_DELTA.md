# Studio exact-copy acceptance — current matrix

## Current acceptance snapshot — 2026-10-06

The active requirement is the complete original HunpeoLabs Studio interface, features, mechanics and styling, with only necessary Go authentication, transport and security adaptations. The requirement has not been reduced to the ten tested mechanics. Overall exact-copy acceptance remains **INCOMPLETE**; final product/parity review remains **BLOCKED**. Earlier missing-feature statements below describe older candidates and are superseded by this snapshot.

Reference: `/Users/hunpeo97/Desktop/Workspace/Coder/HunpeoLabs/components/blog-admin`, `components/blog-editor`, `styles/blog-design.css` and original article/preview helpers. Actual Go entry is `Studio.tsx` → `SourceStudio.tsx`; the generic `StudioEditor.tsx` is not mounted by that entry.

- Owned source/unit manifest: `docs/reviews/release027/biz/STUDIO_CANDIDATE_HASHES.json`, 51 files, SHA-256 `a628d008c521bfbcdbdca2b8fe39aa742cf45efa0a4201fdc6f0b6bcaaea02db`.
- Native mechanics file: `tests/browser/release-studio-mechanics027.spec.ts`, SHA-256 `e1c5ccbf61fcd1284728c51b626d5d16eb590993de39b61836b13ff6befac226`.
- Root reports backend candidate `ece89`; backend/full-candidate binding remains root-owned. This document does not independently certify that abbreviated backend identity.
- Source has not changed during these native test corrections. Existing AST string inventory is retained, not regenerated. It is a candidate inventory, not rendered evidence.
- Latest specialist source checks: 43 focused tests/4 files PASS; owned lint and whole TypeScript PASS. Latest test-only scoped lint/TypeScript PASS. No specialist runtime/build/browser execution.

### Verified native receipts and their bounds

`output/playwright/release027/studio-mechanics-native-round4/browser-results.json`: 10 expected, 0 unexpected, 0 skipped, 0 flaky; all ten result records passed. Real guarded emulator commands/readback; history uses disclosed browser-clock control only to preserve the dirty assertion. It then resumes real timers, performs actual save and restores an actual archived revision. No mocked service success. Earlier mechanics rounds and failures remain historical evidence, not the accepted result.

`output/playwright/release027/recovery-current-round4/browser-results.json`: 3 passed, covering lost hide and report-resolve responses and >1000 queues with bounded report hydration. `output/playwright/release027/media-round1/browser-results.json`: one passed Storage-emulator privacy transition case; its older candidate binding must be confirmed by root before using it as current whole-candidate evidence. `output/playwright/release027/native-round5/browser-results.json`: individual Studio 390/768/1440 publish/private-edit cases passed, but the overall receipt has one unexpected failure and predates the latest recovery delta; it cannot certify the entire current candidate. Full current 258-case native run is pending.

### Current original-feature and state matrix

`IMPLEMENTED` means inspected source exists and is wired, not that every state has native proof. `NATIVE_PASS_SCOPED` is limited to the named receipt/assertions.

| Original feature / relevant states | Current wired source and Go adaptation | Current evidence / remaining acceptance |
| --- | --- | --- |
| Standalone shell/sidebar/mobile menu/account navigation | `source-shell.tsx`, `Studio.tsx`, `SourceStudio.tsx`; root Workspace standalone mount, Go routes/identity, CRM return entry | IMPLEMENTED; exact shell responsive/menu/nav loading screenshots NOT_RUN |
| Original layout, typography, density, icons and responsive CSS | `source-design.css` matches original stylesheet in direct diff; original `source-ui.tsx`, account module; old generic CSS not mounted | IMPLEMENTED; state-by-state visual comparison 390/768/1440 NOT_RUN |
| Dashboard counts/nulls/list/search/category/state/cursor | `source-dashboard.tsx`; real advanced summary/list; unavailable counts show em dash, server pagination | IMPLEMENTED; search/filter/paging/create and null/empty/error native acceptance NOT_RUN |
| Dashboard archive restoration and scheduled badges | Original controls with viewed CAS; actual draft/schedule projection | IMPLEMENTED; archive restoration and stale/blocked badge edges NOT_RUN |
| Editor title/summary/author/assignee/slug/language/sources/answer/comment switch | `source-editor.tsx`; strict real draft projection/capabilities | IMPLEMENTED; complete field and validation-state matrix NOT_RUN |
| Rich heading/marks and undo/redo | Original `rich-editor.tsx` controls | NATIVE_PASS_SCOPED formatting/H2/bold/undo/redo/save/reload; all mark/heading combinations and selection bubble NOT_RUN |
| Lists/ordered lists/quotes/code/link dialog | Original rich controls and dialog | IMPLEMENTED; actual node persistence, URL validation and dialog failure variants NOT_RUN |
| Tables and row/column actions | Original TableKit/toolbar | NATIVE_PASS_SCOPED initial 3×3, add row/column, reload, delete table; delete-row/delete-column edges NOT_RUN |
| Slash insertion/keyboard/dismissal/prose | Original `editor-actions.ts`/rich-editor handlers | NATIVE_PASS_SCOPED heading query, ArrowDown/Enter→H3, Escape and prose; every slash command/real IME NOT_RUN |
| Block move/duplicate/delete | Original block transactions/menu | NATIVE_PASS_SCOPED exact up/order/duplicate/delete; down and boundary cases NOT_RUN |
| Focus mode/inert isolation/dialog keyboard/Escape | Original rich focus with portal scope adaptation | NATIVE_PASS_SCOPED focus isolation, modal Tab, two Escape stages and focus return; full AT/keyboard traversal/reduced-motion states NOT_RUN |
| Category autocomplete/create and tags | Original taxonomy helpers; real categoryCreate callback | NATIVE_PASS_SCOPED keyboard category selection, Escape rollback, tags dedup/removal/reload; creation/rename/composition/limits/error edges NOT_RUN |
| Manual/autosave/CAS/recovery/local draft | `source-editor.tsx`, `source-services.ts`, UID/schema/time-scoped original localStorage recovery | IMPLEMENTED with focused terminal/unknown retry tests; root save/CAS native binding must be included in final report; reload/dirty-navigation/account-cleanup matrix NOT_RUN |
| Composite save→review/archive partial failure | Immutable submitted generation/operation identity; terminal rejection reconciles confirmed metadata without replacing newer text | 43-test unit receipt includes lost response, validation correction and terminal partial success; full current native edge matrix not certified here |
| Revision history/restore | Real paged revision reads, viewed CAS, restore to new private draft | NATIVE_PASS_SCOPED archived revision, dirty restore disabled, real save/restore/new revision/title/private-only; pagination/missing/CAS/permission edges NOT_RUN |
| SEO/share preparation and saved private preview | Original SEO cards/checklist, dedicated preview route/tab and popup helper | IMPLEMENTED; blocked popup, generation races, all SEO states NOT_RUN |
| Preview article/TOC/headings/code-copy/image zoom/Mermaid | `source-preview.tsx`, `blog-*.tsx`, `source-mermaid.tsx`; canonical private blobs and sanitized SVG | IMPLEMENTED; complete interaction/copy/zoom/error/long-content native matrix NOT_RUN. Public-only branches are excluded exactly as original staff preview excludes them |
| Publish/review/unpublish/archive and immutable public snapshot | Explicit original actions plus authoritative Go workflow/CAS | IMPLEMENTED; older width tests prove their own publish/edit isolation only; all current lifecycle/failure/revoke states pending root |
| Calendar/schedule/cancel | Original picker/timezone helpers with actual viewed revision | NATIVE_PASS_SCOPED future calendar selection/time→stored ISO instant, private-only and cancellation; calendar key bounds/DST/revocation/job failure NOT_RUN |
| Cover/body/avatar media, alt/rights/resize/drop/paste/remote URL | Original controls; necessary UID-fenced private media, rights/alt confirmation, WebP normalization | IMPLEMENTED; Storage-emulator receipt is scoped/older; paste/drop/resize/alignment/remote rejection/cancellation/media faults NOT_RUN |
| Author profiles/create/edit/Google email/avatar | `source-settings.tsx`; server-returned IDs and catalog CAS, verified Google identity binding | IMPLEMENTED; author mutation/avatar/binding/self/error/100-item bounds NOT_RUN |
| Taxonomy settings create/rename | Original settings dialogs; real versioned catalog commands | IMPLEMENTED; full settings create/rename/validation/error matrix NOT_RUN |
| Members add/role/self guard/revoke | Original controls; eligible Go Google email invitations, UID/email self guard, no CRM grants | NATIVE_PASS_SCOPED pending invite display and actual revoke; binding/role-change/self/eligibility/concurrency edges NOT_RUN |
| Export | Original export control; real bounded authorized JSON download (Go filename/schema) | NATIVE_PASS_SCOPED actual download/parse/owned draft+author/schema; limit/permission/failure states NOT_RUN |
| Moderation pending/approved/hidden/rejected/spam/detail | Original moderation surface; one bounded actual page plus explicit continuation, viewed comment CAS | IMPLEMENTED; native >1000-page/report hydration scoped pass; every status/detail/action/destructive dialog edge NOT_RUN |
| Report dismiss/hide→resolve and unavailable comment | Real open reports, authorized inline public comment or null, separate report/comment revision; immutable composite retry cursor | NATIVE_PASS_SCOPED lost hide/resolve replay and bounded hydration; resolved/missing/permission/CAS/terminal UI states NOT_RUN |
| Public reader comment submit/list/moderation integration | Root-owned `BlogComments.tsx` and `functions/src/blog-comments.ts`; actual separate public authority | IMPLEMENTED; not absent. Public surface/current full native evidence is root-owned, not certified by these ten staff tests |
| Account/signed-out/unauthorized | Original account panel with Go identity/logout and staff guards | NATIVE_PASS_SCOPED links/logout/private-editor absent after logout; live Google/expired/loading/role downgrade states NOT_RUN |
| Toast/pending/progress | Original toast/countdown/dialog host; existing Go `callService`→`withProgress` feeds global progress | IMPLEMENTED; native success/dismiss and modal handling tested narrowly; timeout/offline/countdown/focus/hover/AT announcements and exact progress appearance NOT_RUN |

### Necessary differences, not missing features

Go branding/routes/authentication replace reference host/provider paths. Callables, operation receipts, viewed revisions and UID fences replace HTTP client transport; Go authority/eligibility remains authoritative. Private media, rights/alt safeguards, image normalization and SVG isolation remain enforced. Pagination/export limits preserve bounded service behavior. Original nested main landmarks become divs inside Go's main. Pending/unknown data never becomes invented zero. These are disclosed adaptations; the human's exact-copy requirement still requires original non-security interface/style/mechanics acceptance, not arbitrary redesign.

### Remaining completion gates

Current full native run; original-to-Go visual comparison for every applicable loading/empty/error/disabled/default/success/confirmation state at target widths; assistive-technology testing, real IME, paste/drop/resize and media faults, history/lifecycle/race edge cases above; full eight-principle product review; refreshed intelligence and current final implementation review. No production/provider/deployment claim. Source/tests/runtimes remain frozen; this lease changes only two documentation files.

### Product content review — current scoped in-context evidence

Surface: Vietnamese Studio web administration, audience authors/publishers/admins; task edit, recover, schedule and administer content using real Go authority. Browser-native roles/labels, keyboard and web focus conventions apply. The bundled Human Interface principles are a quality reference; no current Apple-platform HIG compliance is claimed. Reviewer: specialist source/receipt readback, 2026-10-06. No new user-facing strings changed in this docs lease.

Verified facts: actual rendered controls in the ten-case receipt triggered real mutations/downloads and persisted readback. Assumptions are limited to untested states listed in the matrix. A parsed test receipt proves its assertions, not subjective readability or whole-screen quality. Existing string inventory is conservative and cannot replace rendered review.

| State | Current content/data meaning | In-context evidence / limitation |
| --- | --- | --- |
| Default/actions | Named formatting, block, history, calendar, member/export/account controls | Ten mechanics cases use real named controls; full screen inventory pending |
| Loading/pending/disabled | Dirty restore disabled; command busy locks; original progress/status | Dirty restore native assertion passed; all pending/offline states NOT_RUN |
| Empty/unavailable | No historical revision before first mutation; missing report comment unavailable; null counts em dash | Source verified; native empty/no-results/null visual and AT interpretation NOT_RUN |
| Success | Saved node/revision, scheduled instant, revoked pending invite, JSON download | Actual persisted readback/download passed; no general-success extrapolation |
| Error/recovery | Unknown hide/resolve outcome preserves operation identity, viewed revisions | Three recovery cases passed with disclosed delivery fault injection; all error text/AT states incomplete |
| Unauthorized/stale | Private editor absent after logout; Go eligibility/CAS remains enforced | Logout case passed; current full stale/role/permission matrix pending |
| Confirmation/destructive | Actual member revoke dialog; restore creates newer private revision | Scoped native pass; archive/unpublish/media destructive states incomplete |

Data semantics: draft and published snapshot are separate; restore creates a newer private draft; displayed local scheduling maps to an ISO instant; comment revision and report revision are independent; invitation does not grant Go CRM/content eligibility; export is authorized/limited and includes actual collections. Server readback is source of truth. Unknown/missing/partial data is unavailable, not zero. UID fencing and media privatization protect private content. DST/edge freshness/AT comprehension remain unverified.

| Principle | Status for scoped tested interactions | Concrete evidence and remaining bound |
| --- | --- | --- |
| Purpose | PASSED | Named history/scheduling/export controls in mechanics receipt complete their corresponding actual user task; full surface content relevance pending |
| Agency | PASSED | Native undo/redo, block reversal, dirty restore disabled, actual schedule cancellation and member revoke; all recovery/destructive paths pending |
| Responsibility | PASSED | Native restored draft remains unpublished, invite revoke succeeds, logout removes private editor; recovery receipts preserve exact viewed authority. Full privacy/error wording and provider context pending |
| Familiarity | PASSED | Native accessible toolbar names, table controls, slash arrows/Enter/Escape, modal Tab/Escape and web links; AT and real IME remain unverified |
| Flexibility | PASSED | Native keyboard slash entry, focus mode, undo and history recovery use multiple task paths; full keyboard traversal/mobile/AT pending |
| Simplicity | PASSED | Native named controls trigger directly corresponding persisted actions and bounded report continuation avoids inaccessible corpus; full copy/state comprehension pending |
| Craft | NOT_RUN | Current exhaustive original-to-rendered visual/state, viewport, AT, media/IME and lifecycle-edge review is incomplete; ten passing cases are insufficient |
| Delight | NOT_RUN | Scoped focus/caret/keyboard recovery works, but humane completeness across errors, IME, media and all transitions has not been observed in context |

Overall Product Language Gate: **BLOCKED**. Scoped PASSED rows do not certify those principles across the whole changed Studio. Any required untested state remains unapproved; current Craft/Delight and full matrix coverage cannot be replaced by generic polish claims.

Final source review cycle 11 remains a historical BLOCKED review; subsequent native receipts resolve specific mechanics blockers but do not silently turn that JSON into PASSED. Root must record a fresh current review after intelligence and full acceptance evidence. Weighted progress is unavailable without the runtime criteria ledger. Tokens and billed cost Unavailable. Memory candidates None. No commit/PR/deployment or production-readiness assertion.

## Historical snapshots and review cycles — superseded where inconsistent

# Exact Studio parity delta — current source review

Reference root: `/Users/hunpeo97/Desktop/Workspace/Coder/HunpeoLabs`. Go root: `/Users/hunpeo97/Desktop/Workspace/Coder/SatsunicGo`. This supersedes any implication that the current Go Studio is a complete copy. Source inspection establishes mechanics only; no row below certifies visual or native parity. Auth and data transport must use existing Go authority. No company marketing surfaces are included.

| Reference source / feature | Go source / current state | Exact delta and next step |
|---|---|---|
| components/blog-admin/chrome.tsx StudioShell/StudioLinks | features/crm/Workspace.tsx + Studio.tsx; different CRM shell | Port standalone Studio sidebar, mobile menu, compact identity and navigation progress; coordinator owns wrapper/routes. Preserve Go auth. |
| styles/blog-admin.module.css, styles/blog-design.css, components/blog-admin/account.module.css | studio/studio.css newly designed scoped CSS | Exact source layout/typography/spacing/style is NOT ported. Scope original styles under Studio, resolve collisions, preserve source responsive behavior. |
| components/blog-admin/ui.tsx brand/icons/avatar/cover/status | studio/ui.tsx smaller icon set + CrmPresentation | Port complete original primitives, adapt brand to Go and authenticated media resolver; do not substitute approximate icons. |
| components/blog-admin/toast.tsx notice controls/lifecycle | inline notice/error paragraphs | Port original toast and notice provider behavior, dismissal and severity. |
| components/blog-admin/dashboard.tsx status summaries | Studio.tsx paged cards | Missing global aggregate summaries/pending count. Backend must return authorized totals separately from paged rows, never infer global totals from loaded page. |
| dashboard.tsx title/search/category/status URL filters | Studio.tsx loaded-page status filter | Missing title/category search, query persistence, server-filtered pagination and source table/card mechanics. Add read contract query/state/category + consistent next cursor. |
| dashboard.tsx post cover/author/update/link/archive restore | Studio.tsx card/detail/open | Cover thumbnails, author presentation, exact table actions and archive restoration missing. Adapt existing restore command semantics explicitly: archived post restoration differs from restoring a historical revision. |
| components/blog-editor/editor.tsx title/summary/metadata | StudioEditor.tsx implemented | Layout differs; port original compact editor topbar and metadata placement. Native390 editor disappearance unresolved. |
| editor.tsx cover preview/change/remove | StudioEditor.tsx cover ID/upload/remove | Actual cover preview absent. Use canonical private media resolver, retain source controls/layout. |
| editor.tsx autosave/manual save/conflict recovery | StudioEditor.tsx CAS/autosave/sessionStorage | Receipt/CAS transport adapted. Source uses localStorage recovery across sessions; Go currently tab-only. Needs explicit privacy-safe equivalent semantics, logout cleanup and source recovery UI. |
| editor.tsx navigation/dirty recovery guards | StudioEditor.tsx beforeunload/back save | SPA route changes are not fully guarded; source navigation semantics must be ported and verified with coordinator routing. |
| editor.tsx saved preview/open-preview.ts | StudioEditor.tsx saved modal | Source opens saved preview in dedicated route/tab with failure recovery; current modal differs. Coordinator must mount staff preview route; port popup/blocked-popup behavior. |
| editor.tsx history/restore | StudioEditor.tsx paged revisions/CAS | Core implemented; source timeline, revision labels and restore confirmation layout differ. |
| editor.tsx SEO/publication prep | StudioEditor.tsx fields/hints/modal | Core implemented; exact source SEO preview cards and checklist layout missing. Hints now require category/source/body; backend authoritative. |
| editor.tsx schedule cancel/retry/publish routing | StudioEditor.tsx calendar + command schedule | Missing explicit cancel-schedule command/button; save currently cancels schedule as backend side effect. Source returns to list on publication; Go remains editor. Add cancelSchedule versioned action + exact UI. |
| editor.tsx role-gated publisher vs author | StudioEditor.tsx all active editor roles see publish | Missing source editorial author/publisher separation. Root/domain must specify safe mapping to Go OWNER/CONTENT_EDITOR or dedicated capabilities before displaying equivalent controls. Never weaken Go staff checks. |
| editor.tsx slug lock after first publication | StudioEditor.tsx editable slug | Backend protects snapshot; exact UI disabled/locked source semantics must be applied. |
| components/blog-editor/rich-editor.tsx rich commands | studio/rich-editor.tsx direct source port | Bold/italic/strike/code/link/headings/lists/quote/table/code block, undo/redo present. Browser keyboard and focus parity NOT_RUN. |
| rich-editor.tsx slash menu/IME/block moves | studio/rich-editor.tsx + editor-actions.ts | Direct mechanics ported; rendered selection/highlight positioning and mobile viewport unverified. |
| rich-editor.tsx inline image controls/drop/paste/remote URL | studio/rich-editor.tsx + media.ts | Canonical Go media adapter and rights/alt flow differs. Alt preservation fixed. Actual image resize/paste/bookmark races NOT_RUN. Backend now reencodes WebP; source contract bounds need native tests. |
| rich-editor.tsx focus mode/inert/Escape | studio/rich-editor.tsx | Direct port; portal parent upload dialog adjustment applied. Focus return and nested dialog/native mobile behavior NOT_RUN. |
| diagram-code-block.tsx + Mermaid renderer | studio/diagram-code-block.tsx/MermaidDiagram.tsx/svg-safety.ts | Code/diagram switch present; strict isolated SVG sanitation differs for safety. Rendered parity and sanitizer browser negatives NOT_RUN. |
| schedule-picker.tsx + schedule-time.ts | same filenames in studio | Direct calendar/time validation ported; DST/keyboard pure tests partial, native scheduler states NOT_RUN. |
| taxonomy-fields.tsx + taxonomy-input.ts | same filenames in studio | Direct autocomplete/IME/tag mechanics ported; OWNER callback adapted to versioned settings. Source taxonomy objects/edit/delete require dedicated schema/actions. |
| components/blog-admin/moderation.tsx pending/approved/rejected/hidden/reports | Studio.tsx loaded-page moderation approve/reject/spam | Hidden differs from spam; report queue/reason, dismiss report, hide from report, linked post preview and original detail UI absent. Add report read/resolve and hidden moderation contracts. Public submit/list now exist in root-owned BlogComments/functions, superseding old missing-submit note. |
| components/blog-admin/settings.tsx authors/avatar/Google profile | StudioConfiguration inline author list | Missing exact author picker/card, media avatarId, verified Google binding/connection fields. Needs authors read/write/media association backed by verified identity, not editable untrusted claims. |
| settings.tsx taxonomy edit/delete dialogs | StudioConfiguration newline categories | Missing IDs/edit dialogs/delete safeguards and exact source layout. Add taxonomy object contract and versioned edits. |
| settings.tsx members roles/self-protection/remove | no Studio equivalent | Requires staff membership adapter exposing only Go-approved roles; preserve self-removal/role safeguards. Coordinator/domain own authority. |
| settings.tsx authenticated content export | absent | Add owner-authorized bounded export endpoint/schema and exact download UI; must include intended draft/revision/author/taxonomy scope, not loaded page only. |
| components/blog-admin/account.tsx and account route | existing Go account outside Studio | Source explicitly depends on embedded Studio account view/avatar/signout/read-blog link. Coordinator route + Go signout callback; no duplicated auth session. |
| components/blog-admin/login.tsx/login page | existing Go Google login | Auth provider adaptation is intentional, but exact signed-out/unauthorized/loading/redirect Studio state must be mapped and verified. |

## Native evidence and 390 diagnostic

Delegated root reports 768/1440 private autosave, publication and private-edit isolation passed after emulator exact current rules reload. Read failure was stale emulator rules, not a renderer proof failure. Specialist inspected actual 390 error-context and screenshot: full editor replaced by list, untitled revision1 remains. Source setter audit: selected clears only identity/load effect or onBack; no source-input handler clears selection; taxonomy Enter calls preventDefault and does not navigate. Existing runner trace is off and JSON has no console/transition events. Exact cause NOT_DETERMINED. Do not weaken test, extend timeout or make speculative reset changes. Next serialized root390 run should capture trace and non-PII lifecycle/route/back event evidence; no specialist runner started or source edits made.

## Required contract handoff / order

1. Root identify390 transition with trace before patch.
2. Root/domain supply authorized dashboard query+aggregate, explicit cancelSchedule, archive restoration, authors/avatar/Google binding, taxonomy objects, members adapter, report/hidden moderation and full export contracts.
3. Specialist port exact source UI/CSS/primitives/editor/admin states using those adapters within owned Studio files; root mounts shell, preview and account routes.
4. Freeze source/artifact hashes and run native390/768/1440, keyboard/IME/focus/reduced-motion, recovery/account switching, media/diagram negatives and all command state/failure scenarios.
5. Update all eight product principles with actual in-context evidence and fresh final review. Until then parity PARTIAL, review BLOCKED, production NOT_READY. Token/cost unavailable; memory candidates None.

## Current faithful port and root integration receipt

The prior generic view has been removed from the entry module; public `Studio` delegates to SourceStudio, with no LegacyStudio fallback. Props compatible with coordinator: uid, roles (accepted for existing caller only; UI capabilities derived from successful backend authority), name, optional safe Google avatar, optional signOut Promise callback; fallback calls existing Go logout. Root owns Workspace mount and source service exports. SourceStudio routes all dashboard/settings/comments/account/editor/preview views under `/crm/studio/*`; public blog routes `/posts`; small `Trở về CRM` entry `/crm`. The shell hides sidebar/topbar on editor and preview exactly as original. No browser destinations `/admin/blog` remain; strings `/api/admin/blog/*` are adapter keys only and never fetched directly.

Source copies: source-shell.tsx (chrome), source-dashboard.tsx (dashboard), source-editor.tsx (editor), source-settings.tsx (settings), source-moderation.tsx (moderation), source-account.tsx/module.css (account), source-ui.tsx (complete original icon/art/status/cover/avatar primitives), source-dialog.tsx, toast.tsx/toast-countdown.ts, source-design.css (original stylesheet). Original preview body/metadata/TOC/code-copy/heading-copy/image-zoom/Mermaid zoom ported in source-preview.tsx, blog-*.tsx, source-mermaid.tsx and reading-layout.ts. Company author path/brand adapted to Go identity and host. Public share/views/comments branches excluded from staff-only preview because original preview condition excludes them. Root owns public article and reader comments.

Go safety adapters: source-services.ts exact operation receipts/CAS/callable transport, before/after UID checks; backend-derived editorial role (summary pending null author; successful OWNER/admin members read admin; publisher otherwise only after successful summary), no client role grant. Media remains 5MB type bounded, account fenced, rights confirmation and alt required workflow, canonical private media resolution to short-lived revoked blobs. Backend author media binding used. Catalog new-author returns server ID (source generated ID cannot be sent as existing ID to Go CAS endpoint); linked email field uses backend email. Self controls compare UID rather than missing/default email. Source original localStorage recovery restored with strict UID/post/revision/time/schema guard and cleared when account changes. Original nested main elements changed to div inside existing Go main landmark; layout classes unchanged. Portal dialogs keep source blog-surface style scope while avoiding focus-mode inert parent. SVG strict isolation plus sanitizer preserved. Old generic stylesheet no longer imported by Studio, preventing override of original design.

Native selectors now original source: `Viết bài mới`, icon `Trở về bài viết`, `Lịch sử phiên bản`, publisher `Xuất bản`/`Cập nhật`, source details initially open `Nguồn tham khảo & ý chính`, source textarea label `Nguồn tham khảo — mỗi dòng: tên | URL`. Coordinator should update test workflow to original controls, preserve assertions and timeout. Existing 768/1440 native PASS belongs to old generic candidate and does NOT certify new source port. 390 HMR hypothesis delegated by root remains NOT_PROVEN; no speculative auth/reset fix applied. New explicit editor route replaces old local selected-state view; fresh frozen native is mandatory.

Remaining exact-contract gaps: report queue read + resolve endpoint not supplied (UI count unavailable —, reports route refuses rather than fake empty); new member email to verified eligible UID resolution not supplied (existing UID editing/revocation mapped with current receipt/CAS; new email-only addition refuses). Member bootstrap pagination above100 currently refuses full-view certification; source list/summary query/cursor and source export endpoints now use actual advanced service contracts. Source members source `reader` option maps explicit revoke, never a Go CRM grant. Current catalog endpoint authoritative; legacy settings-only authors/categories are not silently migrated into catalog. Root fixture must seed authoritative catalog or create it through settings workflow.

Current static: scoped SourceStudio/Studio dependency compiler previously diagnostics0; lint owned files and source-specific helper tests require fresh rerun after last current changes. Native NOT_RUN for new port, full product eight principles NOT_RUN, final review BLOCKED. No deploy or production data change. This receipt is a source-ready partial integration handoff, not a 100% acceptance claim.

### Current specialist source freeze

Owned Studio source and four pure test files frozen in STUDIO_CANDIDATE_HASHES.json (no build/native claim). Root Workspace standalone mount consumed current Studio(uid/roles/name); optional avatar derives verified current Go Auth photo and is validated before render. Small /crm return entry present. Final19 focused tests PASS, lint PASS, scoped compiler last diagnostics0; newest whole tsc failure remains outside ownership at advanced rules test306. Source guards fixed during fresh review, including viewed-revision schedule cancellation. Remaining report queue/resolve and email-only eligible-member resolution require backend delta. Coordinator should read this receipt, preserve frozen source while running native and refresh hashes only for actual later approved patches.

## Delta2 reports and email adapters — current source frozen

Supersedes prior missing-contract statements. Both adapters are implemented against inspected current backend source, not the earlier delegated shape. Reports read uses `studioAdvancedRead({kind:'reports',reportState:'open',after?})` (strict schema rejects `state:'open'`); fetches all pages up to explicit1000bound. Safe report record omits reporter UID. Source detail joins authorized approved comment text/version; missing/currently hidden comment displays unavailable text and disables hide rather than fabricating a comment revision. Report resolution uses cached report revision separately from comment revision in `studioAdvancedCommand({action:'reportResolve',id,expectedVersion,operationId,payload:{}})`. Existing source hide-then-resolve and dismiss paths now execute real services.

Member source form accepts email-only creation, normalizes email, sends exclusive email identity. Existing pending invite row uses email for update/revoke; bound row uses actual UID; expected revision from loaded member preserved. Source reader option maps revoke. Pending invitation never treats private hashed invitation ID as a UID. Self controls verify UID plus verified current email; grant copy states Studio-only and need for Go content eligibility. Backend owns deferred invite binding and authenticated eligibility/noCRM/self guards. Source sidebar and private capability checks still derive authoritative successful reads.

Verification currentdelta2: 4focusedfiles24tests PASS333ms (48ms tests), scoped ESLint exit0, scoped Studio dependency TypeScript diagnostics0. Strict report schema regression, email-only invite, pending email revoke, report revision independence and unloaded-report refusal added. New hash manifest SPECIALIST_DELTA2_SOURCE_FROZEN_NATIVE_PENDING and string inventory regenerated; native/build/provider/production NOT_RUN by specialist. No additional source writes planned until root reports a diagnosed current-candidate issue. Old69/85 backend runs do not certify delta2, and old viewport runs do not certify direct source UI.

Remaining acceptance gates: fresh root build/rules/native on whole frozen candidate; inspect original layout390/768/1440 and complete current eight-principle evidence; native report/email/media/preview/focus/IME/recovery/failure/concurrency paths. Source matrix rows marked missing before direct port describe history only; current implemented-port status is in this section plus current source receipt. No100% claim. Final review7 BLOCKED; production NOT_READY; memory candidatesNone; token/cost unavailable.

## Review cycle8 — member CAS contract refinement

Inspected current backend: reports accept reportState and backward-compatible state open/resolved; frontend retains reportState. Earlier strict-schema rejection statement is superseded. Members prefer email with invite row.revision even when bound; UID-only legacy rows use uidRevision with revision fallback. New invite submits expectedVersion1. Adapter and regression now separate invite CAS8 from UIDgrantCAS3 and legacy UIDgrantCAS4. No hashed invite ID is sent as targetUid.

Current25tests/4files PASS293ms (37ms tests); affected lint exit0; scoped compiler diagnostics0. Current51file hash manifest refreshed, source frozen awaiting root native. No native/build/emulator/provider/production runs here. Finalreview8 BLOCKED for current native/product evidence; production NOT_READY. MemoryNone; token/cost unavailable.

## Scoped pagination delta and source freeze — review9

Root released only the actual members/assignable pagination defect after native22 finished. Observed source cause: SourceStudio threw whenever first members page returned next; assignable ignored next. Backend cursor advances raw staff100 even when filtered eligible items empty, and members continue through invite: stage. Smallest approved fix: source-services.listPeople collects bounded complete pages, checks UID and requestepoch before/after every response, supports empty filtered pages and invite: cursors, rejects malformed/repeated cursor and >100rawpages/>1000returneditems. Member CAS cache replaces only after complete current load; no partial items are returned on timeout/cap/identity/epoch failure. SourceStudio uses helper for both actual lists; role/authority logic, source layout, browser tests, root files and backend unchanged.

Current validation: focused4files31testsPASS369ms (46ms tests), affected ESLintexit0, scoped TypeScriptdiagnostics0. Added actual staff+invite multiplepages, empty filteredpage withcursor, unavailablelaterpage, repeatedcursor, item/pagecaps and UID/epochdiscards. Existing25 source-contract tests unchanged in meaning;6newcases included in31total. Native NOT_RUN for this changed candidate by specialist; previous initial390error belongs pre-fix. Current51filemanifestSHA25694cb506b618247b098a1521bfd1dbae5c051bb5bb95fe2cab871e9c661400f59, status SPECIALIST_PEOPLE_PAGINATION_SOURCE_FROZEN_NATIVE_PENDING. String inventory updated for changed filelines/errors.

Source freeze active after fixes; root serialcompile/native/fullreview required. Product Language all eight principles current in-context NOT_RUN; review9BLOCKED; productionNOT_READY. Indexfreshness must be refreshed by coordinator after latestsource. No provider/deploy/production changes. MemoryNone; token/cost unavailable.


## Review cycle 10 — recovery and bounded moderation freeze

Manifest SHA-256: 301e56b1fe4ad790168de74ae6049fcc78c678dbfeb3ca98bdea858bdc92066e. All 51 owned files frozen. Reviewed current source against approved coordinator delta: composite save/review/archive retries retain exact snapshot and operation identity, genuine Go CAS blocks stale autosave, and moderation/report pages use explicit continuation and authorized inline hydration. Backend hydration remains DB-owned. No approved-comment corpus scan remains.

Validation: 36 focused unit tests across four files PASS; Studio ESLint PASS; whole repository TypeScript noEmit PASS (exit 0). Native retry/CAS/pagination checks are NOT_RUN by this specialist and pending coordinator. Earlier native evidence does not certify this candidate. Final review cycle 10 BLOCKED on current native and product evidence. Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight: current in-context verification NOT_RUN.

Completion: approved local fixes implemented; native acceptance, full parity, fresh intelligence and production readiness remain incomplete. Shared worktree dirty; no commit/PR/deployment made. Runtime ledger unavailable; this is a private evidence report. Weighted completion unavailable without runtime criteria ledger. Tokens/cost Unavailable. Memory candidates None. Previous cycles retained in existing reports.

## Approved recovery delta — cycle 11 plan

Coordinator READY7 approved two frontend-only corrections within fix-all scope. A: classify explicit callable terminal failures separately from uncertain delivery; release terminal rejected submission identity and reconcile any confirmed first-save revision/state while preserving later local text. Unknown deliveries keep exact payload and operation identity. CAS remains blocked pending reload. B: route hide-and-resolve through a single services cursor that owns separate existing command identities, confirmed first-step progress, viewed comment/report revisions and UID fences. Retry skips confirmed hide and replays unresolved resolve exactly; terminal failures release rejected identities without adopting fresh versions. Add focused validation, partial success, lost-response and permission/CAS tests. No backend or root-owned changes. Current index snapshot predates delta: bounded source verification in DEGRADED mode; coordinator refresh required. Native tests remain root-owned.


## Review cycle 11 — terminal save and report recovery freeze

Manifest SHA-256: a628d008c521bfbcdbdca2b8fe39aa742cf45efa0a4201fdc6f0b6bcaaea02db; 51 files frozen. Approved frontend-only READY7 delta implemented. Terminal callable rejection frees save snapshot/identity; confirmed save revision/state merges into current editor without overwriting local text/generation. Unknown outcomes retain payload/operation identity. Go CAS still blocks stale autosave. Hide-and-resolve now uses a single services cursor with independent command identities, confirmed hide progress, viewed revisions, account fences and cleanup. Unknown resolve replays exact identity; terminal resolve releases rejected identity while retaining confirmed hide and original report CAS.

43 focused tests/4 files PASS (including corrected validation retry, second-step terminal partial success, lost hide/resolve responses, permission rejection, report CAS not adopted, account switch). Owned ESLint PASS and whole repository TypeScript noEmit PASS. No global builds, native runners or backend changes by specialist. Fresh source review found no additional defects in inspected scope; native recovery and full current product evidence NOT_RUN. New strings inventoried; Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight remain NOT_RUN in context. Final review cycle 11 BLOCKED; production readiness unverified. Shared WIP preserved; no commit/PR/deploy. Runtime ledger unavailable; weighted progress, token usage and cost Unavailable. Memory candidates None.
