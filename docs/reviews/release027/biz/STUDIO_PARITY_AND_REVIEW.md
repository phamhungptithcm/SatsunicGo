# Studio parity and review — current evidence

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

# Studio027 bounded frontend handoff

Owner scope NEW src/features/content/studio/**, tests/unit/studio-editor027.test.ts and studio-api027.test.ts only. No manifests/routes/backend/legacy ContentEditor/HunpeoLabs edits, dependency installation, service/native runners or production operations by specialist. Root integration/runner owns remaining validation. READY gate source: /private/tmp/release027-intelligence-permission-refresh.json; CodeGraph then CocoIndex queries verified private draft/public snapshot/version/role contracts; index final candidate may need refresh after shared edits.

## Root interface

Studio({uid?,roles?,media?}) export Studio.tsx; root staff route supplies uid and roles, server role authority rechecked per command. Optional media adapter defaults actual studioMediaUpload/read database contract. All Tiptap deps source3.31.4, Mermaid12.0.0 root installed. RichArticle({body}) exported RichPreview.tsx renders validated public rich tree and canonical /media/id without private reads; RichPreview({body,privateImages:true}) used only saved staff preview. Private objectURLs revoked on unmount/identity, SVG strict+sanitized then inertimg blob. No Next runtime, company-specific offer/content/author/branding. Go path /posts/slug.

## Mechanics parity matrix

| Reference mechanic | Current implementation | Evidence / status |
| --- | --- | --- |
| Rich headings, marks, links, lists, quotes, code | Original rich-editor mechanics adapted imports/media | Source implemented; native NOT_RUN |
| Tables/add/remove rows/columns/table | Tiptap TableKit original controls | Source implemented; native NOT_RUN |
| Bubble selection/image menus | Original BubbleMenu with visible/accessible labels | Source implemented; native NOT_RUN |
| Slash command keyboard/IME/escape | Original slashRange/matching/commandIndex | Pure tests PASSED; native NOT_RUN |
| Block up/down/duplicate/delete | Original mapped ProseMirror transaction | Pure tests PASSED; native NOT_RUN |
| Undo/redo history boundary | Original closeHistory/toolbar | Source implemented; native NOT_RUN |
| Image file/drop/paste/remote download | Original bounded transfer/download plus rights/alt upload dialog | MIME/size pure PASSED; Storage/CORS/drop/paste native NOT_RUN |
| Image resize/presets/alt/bookmark | Original resized image extension and mapped selection | Source implemented; native NOT_RUN; DOM-only private source resolution needs resize proof |
| GIF5MB | Frontend accepts source formats; database handoff new media contract | Size/MIME pure PASSED; actual GIF upload/render NOT_RUN |
| Private inline image and cover preview | studioMediaRead blob resolver; sourceattrs remain canonical /media/id | Source implemented; auth switch/Storage/public binding native NOT_RUN; coverID shown not full cover-card parity |
| Mermaid paste/code/diagram mode | Original extension plus strict lazy serialized renderer and SVG sanitizer | Source implemented; browser DOM/SVG negative cases NOT_RUN |
| Focus mode/inert/escape | Original rich editor; dialog portaled to body to escape sibling inert | Source implemented; native keyboard NOT_RUN |
| Slug auto/manual/locked after publish | titleSlug +manualSlug and publishedSlug | Pure slug PASSED; native lock NOT_RUN |
| Taxonomy autocomplete/create/tag/IME | Reference TaxonomyFields adapted OWNER revisioned settings call | Source implemented; native create/CAS/IME NOT_RUN |
| Author/assignee/language/sources/answer/SEO | Go settings authors, UID assignee, original draft fields | Source implemented; configured author validation server; no reference private identities |
| Autosave1800ms and overlapping edits | Fence/generation, preserve new input while revision advances | Fence pure PASSED; actual race/published snapshot NOT_RUN |
| Recovery | UID/post/time/schema validated private session-tab backup | Pure PASSED; privacy/storage/restore native NOT_RUN; sessionStorage intentionally avoids persistent private draft beyond tab |
| Save conflict/error/retry | CAS and same-payload operation id, conflict stops autosave | API identity pure PASSED; network uncertain/native NOT_RUN |
| Saved preview | Save if dirty, server get, private native dialog | Source implemented; native exact saved generation NOT_RUN |
| History/paged restore to new draft | revision list next + explicit restore; dirty blocks restore | Source implemented; native NOT_RUN |
| Review/publish/schedule/unpublish/archive | Explicit user controls/confirmation, backend version authority | Source implemented; native NOT_RUN |
| Schedule timezone/calendar/keyboard | Original SchedulePicker + strict local roundtrip | Pure invalid-time PASSED; DST/calendar native NOT_RUN |
| Scheduled failure visibility | get.schedule blocked state, explicit retry advice; saves cancel old schedule notice | Source implemented; scheduler native NOT_RUN |
| Moderation pending/approved/rejected/spam | Actual backend-supported paged list and CAS actions | Source implemented; native NOT_RUN |
| Settings categories/authors/comment/review flags | Actual OWNER configuration + revision CAS | Source implemented; native NOT_RUN |
| Reference hidden/comments report resolution/public submit | No backend submit/report/hidden contract in current scope | NOT_IMPLEMENTED; not 100percent parity |
| Author avatar/Google linking/member editor/settings export | No corresponding Studio backend contract; staff roles remain Go existing screen | NOT_IMPLEMENTED; not 100percent parity |
| Reference dashboard metrics/growth/compact header | Basic versioned list/filter and sticky toolbar; no imported offers/company metrics | PARTIAL; not 100percent parity |
| Source public comments/view/share/reader reputation | Not part of new backend callable contract yet | NOT_IMPLEMENTED; root/domain owner decision required |

## Product-content review

Audience: Vietnamese staff/OWNER on React web, desktop and narrow browser. Purpose private editing and explicit publication. Source of truth studioRead/studioCommand, draft.revision, settings.revision, current auth, canonical media record; absent/error never success/zero. Units: local date/time with timezone in scheduler; words/readminutes estimate220wpm; no payment amounts introduced. Root legacy public content reader retains plaintext fallback.

String inventory: STUDIO_STRING_INVENTORY.json generated from actual owned TS/TSX AST, source file/line and JSX labels/messages; literal candidates are conservative and include contextual non-display constants. Review grouped states below covers labels/messages/conditional labels and candidate meaning, not a translation-resource-only pass. No current screenshot exists for Studio from specialist.

Default/action labels name actual save/draft/review/publish/schedule/unpublish/archive/restore and Go tasks. New-state loading lists/preview/editor/image/history shows work. Paged/filter text explicitly says loaded page, no fake total. Success only after server response and UID/epoch check; autosave says public article unchanged. Error retains dirty input, retry identity, conflict stop and explicit copy/reload guidance. Offline errors rely existing callService, no optimistic authority. Publication/grant not automatic; native public consequence dialogs. Schedule blocked/canceled explained rather than promised success. Author/settings removal describes configuration effect for later publication, not deleting old articles. Image rights/alt and private status explicit. Unauthenticated/account switched content not rendered; backend staff authority mandatory. Unknown enums get unknown label, required values never fabricated.

| Principle | Current gate status | Source mapping / missing proof |
| --- | --- | --- |
| Purpose | NOT_RUN | Named editing tasks and next controls; actual Studio task flow pending |
| Agency | NOT_RUN | Explicit publication/modal cancel/native disclosure/dirty preservation; keyboard proof pending |
| Responsibility | NOT_RUN | Public/private content, image rights, role boundaries, version conflicts/schedule cancellation visible; actual UI pending |
| Familiarity | NOT_RUN | Web forms/buttons/dialog/details and Vietnamese, no Apple-only convention; rendered pending |
| Flexibility | NOT_RUN | Responsive owned CSS/focus/reduced motion/IME mechanics;390/768/1440 zoom/AT pending |
| Simplicity | NOT_RUN | Main editor versus settings, secondary IDs/history, lazy editor; real hierarchy pending |
| Craft | NOT_RUN | Static/pure tests pass, source states/data validated; browser focus/races/long content gaps |
| Delight | NOT_RUN | Intended smoother drafts/recovery/short task labels; no observed user evidence |

Platform: web native semantics, canonical Go white/navy/royalblue; Apple platform-specific HIG not applicable, bundled human-centered principles mandatory. No generic premium/Apple-like certification. Human interface patterns writing/feedback/consequence/privacy mapped in source; inclusion/accessibility/localization need actual browser and AT. Product Language Gate BLOCKED (missing current in-context proof and full parity contracts).

## Final review cycles / checks

Cycle1 source found incomplete sources input caused render-time strict draft parse: fixed draftOf to project editable fields without throwing; server/save/recovery still validate. Added pure invalid partial-input regression. Cycle2 source found focus-mode inert siblings could block parent upload modal: native dialogs portal to document.body; browser verification pending. Cycle3 source public renderer integration needed RichArticle: exported pure public canonical media renderer separate from staff private blob read; native/public service verification pending. Cycle4 source schedule blocked/cancellation meaning: get.schedule error mapped, save cancellation notice expanded; backend native pending.

Actual focused vitest 2files/10tests PASSED (state/slug/recovery/schedule/slash/block/image/API retry identity). Focused eslint owned Studio+2tests exit0. Focused TypeScript compiler rootowned new Studio+2tests/import dependencies diagnostics0. Whole typecheck attempted during concurrent root integration had Ask nullability, missing new RichArticle before export, then shipping-rates syntax while backend edits; those were outside owned source and are NOT whole-repo pass. Root serial full static/native still required after freeze. No build/emulator/browser/Storage/provider/production tests run by specialist. SVG DOM sanitizer untested in browser, not a security acceptance claim.

Final decision BLOCKED, implementation PARTIAL against requested full reference parity, production NOT_READY. Missing backend contracts above routed only in documents because message approval review rejected followups. No sourcefinancial/order/auth role weakening. Root can inspect new files, complete missing approved backend mechanics and run serialized validation; do not certify full Studio from10pure tests. Memory candidates None; token/cost unavailable. No PR/deploy/production changes claimed.

## Current candidate review cycle 5

Preserved confirmed uploaded image alt text in both direct/drop insertion and image-dialog initialization. Reset selected schedule metadata on account change and new-draft creation, avoiding a previous post's blocked schedule warning. Updated publication hints to require actual body text, category and at least one source, matching the latest delegated backend contract. Backend remains authoritative for configured authors, image count and publication requirements. Media re-encoding and 20MP/2400px limits belong to the backend owner and are not certified by this frontend review.

Verification on this candidate: focused Vitest 2 files / 11 tests PASS, 415ms (23ms tests); focused ESLint exit 0. Whole repository TypeScript `npx tsc --noEmit` exit 0 after current concurrent source fixes; this supersedes earlier failed attempts, and is only static evidence at that invocation. Owned source hashes recorded in STUDIO_CANDIDATE_HASHES.json; string AST inventory regenerated. No native/browser/provider/production evidence added.

Fresh review: scope preserved; upload account/epoch fencing, receipt retry identity, public/private renderer separation and schedule resets inspected. Product Language Gate remains BLOCKED because current rendered states and eight-principle evidence are NOT_RUN. Full reference parity remains PARTIAL; earlier missing-contract matrix remains applicable until the coordinator supplies and verifies those mechanics. Final decision BLOCKED; production NOT_READY. Safe local work completed, cross-chat handoff blocked by automatic approval review. Memory candidates None. Token and cost status unavailable.

## Fresh review cycle 6 — exact source port

Requirement expanded by coordinator's direct-human exact-copy scope. The generic UI has been replaced at the Studio route entry by SourceStudio and direct original shell/dashboard/editor/settings/moderation/account/primitives/design/preview components. See STUDIO_EXACT_PARITY_DELTA.md for exact paths, adapter differences, backend-dependent gaps and updated original selectors. No LegacyStudio fallback is exported or mounted; old StudioEditor file remains unused reference implementation in owned source.

Findings fixed this cycle: source-link wrapper originally overrode the source dirty-navigation handler; now calls it and respects preventDefault. New-author source random ID conflicted with Go existing-record CAS; adapter uses actual server ID and preserves existing CAS. Member self controls compare actual UID rather than possibly missing email; source reader maps isolated revoke. Advanced replies discard on account switch; regression added. Canonical media/alt preserved, source image and diagram zoom resolves private blobs and revokes resources; source SVG isolation sanitizer retained. Portal dialogs carry original stylesheet scope, preventing focus-mode inert parent conflict. Removed generic stylesheet import to avoid overriding exact source design. Nested main elements adapted to existing Go landmark. Cancel schedule initially fetched a fresh server revision and could adopt another editor's change; fixed to submitted/viewed revision and added negative regression.

Executed on current candidate: focused4files19tests PASS,306ms (33ms tests); owned ESLint exit0; SourceStudio/Studio dependency TypeScript compiler diagnostics0 before last cancellation regression/file entry cleanup, final scoped rerun pending at report write. Whole tsc newest attempt failed only tests/rules/blog-studio-advanced027.test.ts306 queue.items possibly undefined outside specialist ownership; not a whole-repo pass. Native for exact port NOT_RUN, old generic viewport PASS cannot certify new source candidate. No native/build/emulator/provider/production runs by specialist. Index READY refresh2 receipt predates the direct port; coordinator must refresh current source before final broad review. Runtime CLI not on PATH; this private review/report is not a claimed runtime-ledger success.

Requirement match PARTIAL; security/source privacy guards reviewed with executable identity/CAS tests; code quality scoped static PASS within executed checks; failure paths PARTIAL (native media/dialog/races pending); error handling PARTIAL; trade-offs explicit Go auth/private transport/rights/sanitizer; product language all eight principle statuses NOT_RUN for new current UI; final decision BLOCKED. Remaining native freeze/run and report/resolve + email-member identity adapter contracts prevent100% handoff. Production NOT_READY. Memory candidatesNone; token/API cost/billed cost unavailable. Shared WIP preserved; no commit/PR/deploy/production change claimed.

Final current scoped compiler rerun completed diagnostics0 after viewed-revision cancellation and entry cleanup. Frozen hash manifest includes47owned source/style files plus4tests;699conservative string candidates regenerated. Focused19test/lint receipts current. No further source writes after freeze.

## Fresh review cycle7 — delta2

Fixed contract mismatch: delegated reports query used state, inspected backend strict schema requires reportState; updated and added actualschema regression. Implemented report queue/read/resolve with comment and report versions kept independent and unavailable comment text explicit. Implemented exclusive email-only pending invites, pending email update/revoke, bound UID actions and current loaded CAS. Self guard now also checks actual UID/email and copy identifies Go eligibility/Studio-only authority. Backend-dependent source gaps from cycle6 are now implemented, but unverified natively.

Current delta2 source frozen: 51source/test hashes recorded; conservative string inventory regenerated. 24tests/4files PASS333ms (48ms tests); ESLint exit0; scoped compiler diagnostics0. Whole repo, current build/rules/native/provider/storage/production evidence belongs to root and was not executed here. Existing85backend run predatesdelta2; no reuse certification. Finalreview7 BLOCKED for unrun current in-context product/native and production gates. All eight product principles remain NOT_RUN for this candidate. Memory candidatesNone; token/API-estimate/billed cost unavailable. Cross-chat tool handoff remains blocked by earlier automatic approval review; current handoff in private document and final response only.

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


## Review cycle 11 — terminal save and report recovery freeze

Manifest SHA-256: a628d008c521bfbcdbdca2b8fe39aa742cf45efa0a4201fdc6f0b6bcaaea02db; 51 files frozen. Approved frontend-only READY7 delta implemented. Terminal callable rejection frees save snapshot/identity; confirmed save revision/state merges into current editor without overwriting local text/generation. Unknown outcomes retain payload/operation identity. Go CAS still blocks stale autosave. Hide-and-resolve now uses a single services cursor with independent command identities, confirmed hide progress, viewed revisions, account fences and cleanup. Unknown resolve replays exact identity; terminal resolve releases rejected identity while retaining confirmed hide and original report CAS.

43 focused tests/4 files PASS (including corrected validation retry, second-step terminal partial success, lost hide/resolve responses, permission rejection, report CAS not adopted, account switch). Owned ESLint PASS and whole repository TypeScript noEmit PASS. No global builds, native runners or backend changes by specialist. Fresh source review found no additional defects in inspected scope; native recovery and full current product evidence NOT_RUN. New strings inventoried; Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight remain NOT_RUN in context. Final review cycle 11 BLOCKED; production readiness unverified. Shared WIP preserved; no commit/PR/deploy. Runtime ledger unavailable; weighted progress, token usage and cost Unavailable. Memory candidates None.
