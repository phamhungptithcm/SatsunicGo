# UI025 Product Content Review — initial post-fix cycle

Scope/audience: Vietnamese webCRM staff Activity data-kind selector and Customers/Follow-ups navigation; backend cancelled-transfer error reviewed source-only as coordinator requested. Existing role guards/remounts/accessibility labels/focus/money/serverauthorities retained. No Apple-platform compliance or externalbrandcopy. No new UI strings in Activity/Workspace/tests.

Inventory and semantics:
1. Activity `Xem dữ liệu`/`Nhật ký thao tác`/`Thông báo chờ / đã xử lý` and existing loading/error/reconciliation labels unchanged. Current selectedkind must own current rows/errors/busy; mutation already submitted is not cancelled or resent by navigation. Synchronous mutationref guards repeated submit while currentcontext busy. Rowprovider outcome/evidence/CAS/operationId payload unchanged. Pending/currenterror/recovery/unmount/filterchange states reviewed; currentcontext survives obsolete completion.
2. Customers/Lịch chăm sóc route labels and filtercopy unchanged. Distinctroutekeys reset mounted filters/page and initialsource so NAMEPREFIX/exactID customerlist is not shown as overdueappointments. Follow-ups due/asOf pagination semantics unchanged; each current view still uses explicit filter submit. Accountprincipal/role and detailpathname keys retained. No fakezero, staleprivate rows or globalpermission changes.
3. Backend new displayed error source functions/src/index.ts152-156: `Đơn đã hủy. Không thể phân bổ thêm tiền.` Guard verifies actionverifyTransfer+stageCANCELLED before ledger/financial mutation. Audienceauthorizedstaff handling transfer allocation. Message identifies cancelledstatus and rejectedoperation, does not claim bank funds reversed/refunded/lost; refund/exception reconciliation remains distinct. Workbench catches serviceerror to rolealert; Finance transfer catch currently uses existing genericerror, so this exactstring not guaranteed rendered in every consumer. No edit by UIowner. Current backendintegrationerror-path evidence/nativecontext pending root; source-only copy cannot certify fullProductLanguageGate for this backendstring yet.

| Principle | Currentstatus | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Selecteddataset/listtask matches sourcecontext; financialerror names rejectedallocation |
| Agency | PASSED | Selector/native navigation remain usable, server operation continues safely, no forced retry/resend |
| Responsibility | PASSED | No mixeddata meaning, cancellationguard preservesmoney; no false refundpromise |
| Familiarity | PASSED | Existing native labels/forms/routes and Vietnamese terminology retained |
| Flexibility | NOT_RUN | Current post-fix keyboard/mobile/viewport proof pending root |
| Simplicity | PASSED | No new controls/no extra message/UIworkflow; narrow guardedcompletion/routeidentity |
| Craft | NOT_RUN | Fail-before2native reproduced; compiler/lint pass; current post-fix native pending |
| Delight | NOT_RUN | Current seamless datasetnavigation/asyncrecovery proof pending |

Sourceplatformfit/meaning/tone/terminology/privacy reviewed. Eightprinciples finalstatus pending current rendered evidence. Accessibility/AX/keyboard/focus/native200/mobile evidence NOT_RUN thisdelta. ActualAT NOT_TESTED. No new animation, reducedmotion unchanged. No localizationresource/date/number formats changed. Production/provider/performance NOT_RUN. Gate BLOCKED pending executed postfixnative regression and backenderror in-context evidence; exact sourcecopy adequacy is not full acceptance.

## Cycle 2: native evidence readback

CRM025-A01/A02 PASS proves native selector switching ignores obsolete completion and SPA customer/follow-up navigation reloads the correct source and clears stale filters. Finance025 corrected native test PASS proves rejected cancelled-order allocation and unchanged financial data. Screenshot cancelled-transfer-error.png inspected at desktop width.

Purpose, Agency, Responsibility, Familiarity and Simplicity remain PASSED for the CRM delta. Delight PASSED within tested desktop transitions: no forced reload or obsolete dataset takeover. Craft PASSED for CRM regression, but BLOCKED for the financial displayed error because visible [400] adds technical transport content (UI025-C01). Flexibility remains NOT_RUN for current keyboard/mobile/zoom interactions; existing controls/styles unchanged is source evidence, not executed accessibility proof. Actual AT NOT_TESTED.

The financial sentence accurately describes allocation refusal and does not imply refund or bank reversal. The entire rendered alert has not passed the language gate because suffix attribution/remediation remains unresolved. Coordinator notified; application source/test freeze preserved. Full 48-case suite pending; Product Language Gate BLOCKED.

## UI025-C01 attribution and approved remediation

Coordinator verified primary local Firebase SDK source at node_modules/@firebase/functions/dist/esm/index.esm.js:289: structured callable error messages include a bracketed HTTP status. The visible [400] suffix is not a synthetic fixture artifact. Approved root-owned normalization removes only the final recognized HTTP suffix for structured functions/code errors, retaining generic messages and error code. The inventory now includes shared callable display-error handling and its existing consumers; no new user-facing sentence is proposed.

Responsibility requires preserving refusal and recovery meaning without implying that the rejected server action succeeded. Familiarity/Simplicity/Craft require the meaningful sentence without transport notation. Shared-consumer risk requires helper edge-case tests and current exact native alert evidence. Product Language and final review remain BLOCKED until the approved change is executed, verified and reviewed. Current pipeline is still running; no application source edits by UI.

## Cycle 3: current scoped Product Language Gate PASSED

Read current browser-recovered-final.log: cases 10–11 CRM025 regressions PASS, 12–14 native CRM keyboard/empty recovery at 390/768/1440 PASS, 15 membership projection PASS, 16–17 restricted-role landing PASS, 18 exact cancelled-finance error and no money writes PASS, 19–21 deferred ticket/image guards PASS. Current screenshot cancelled-transfer-error.png inspected: alert is exactly `Đơn đã hủy. Không thể phân bổ thêm tiền.` with no [400]. Source helper review PASSED independently. UI025-C01 RESOLVED. Current nav contrast readback at 390 is 4.98885 on white.

| Principle | Scoped status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Correct activity dataset/customer-follow-up list; alert names rejected allocation |
| Agency | PASSED | Native selector and SPA navigation work; committed operation not silently cancelled/resubmitted |
| Responsibility | PASSED | Unchanged-order/zero-ledger finance assertions; rejection does not claim refund |
| Familiarity | PASSED | Existing Vietnamese staff terminology retained; transport suffix removed in rendered context |
| Flexibility | PASSED | Current native keyboard/empty recovery at 390/768/1440; current case1 checkout 200-percent keyboard PASS; no new control/layout in delta |
| Simplicity | PASSED | Same workflow, fewer technical characters; no additional confirmation/controls |
| Craft | PASSED | Confirmed fail-before then current CRM PASS; helper edge cases reviewed; exact alert and contrast evidence |
| Delight | PASSED | Seamless native SPA list switching and deferred-operation recovery preserve current view |

Applicable web-platform fit PASSED within tested scope. Actual assistive technology NOT_TESTED, no claim of exhaustive accessibility or 200-percent coverage of every CRM flow. Shared-wrapper callers retain generic message/code semantics by bounded source/unit review; exact native finance consumer executed. Full48 receipt pending; production/provider/full product performance NOT_RUN. Scoped content gate PASSED does not certify release readiness.

## Cycle 4: Support recent-window delta

Inventory: sole changed string `Yêu cầu của bạn` → `Yêu cầu gần đây`, customer support list heading visible only when tickets exist. Meaning verified against owner-filtered newest-createdAt DESC/documentId DESC/limit30 query; describes recent requests without promising complete history. Loading/error/no-ticket and sending/reply/resolved labels unchanged. Server creates createdAt; historical missing-createdAt completeness remains unverified, no migration authorized.

Current support-after.log read: SUP025-A01 PASS 2.6s, actual submitted ticket persisted/visible/first, exactly30 rows, future foreign marker absent, recent heading visible. Current support-newest-window.png inspected in context: heading above ticket cards and new ticket first, form remains alongside list; full-page image resized by viewer so screenshot alone does not certify fine typography. Source/test hashes match frozen candidate. Compiler/lint/build PASS reported by coordinator; scoped lint independently executed earlier.

All eight principles PASSED for this narrow delta: Purpose correct recent list; Agency preserves submit/reply/navigation; Responsibility no complete-history claim or foreign data; Familiarity natural Vietnamese and existing web heading; Flexibility same semantic h2/form/details controls with no layout change, prior current keyboard/zoom baseline retained (new Support keyboard/zoom execution pending full49); Simplicity one brief heading, no extra control; Craft deterministic fail-before→PASS and exact existing index; Delight submitted request appears immediately rather than disappearing. Platform fit is bounded web semantic/source plus actual native desktop evidence, not exhaustive accessibility certification. ActualAT NOT_TESTED. Current Support mobile/zoom interaction NOT_RUN after this delta; no geometry changes. Scope content review PASSED; aggregate full49/production acceptance pending.

## Cycle 5: Ask auth-ready state review

No strings changed. Inventory: authinitialloading defers Ask mount; authenticatedready and guestready retain existing composer/launcher/dialog; CRM exclusion, route/principal key and logout privacy remount remain. Existing `Đang khôi phục tài khoản…` communicates startup state on protected routes. No new promise of money recovery, successful provider payment or completed command.

Read auth-ask-after-repeat.log: AUTH025-A01 and original ASK-B01 each repeated3, actual6/6PASS22.2s, no skipped cases. Auth test holds real lookup response verified customerUID, observes mainrestore state and no Ask controls/dialog, releases then authenticated header and native opened dialog remain visible. Original recovery test validates single createdorder/conversation association and existing payment rejection. Current ask-auth-restored.png inspected: authenticated account header plus open Ask dialog; no transient anonymous prompt asserted as accepted. Candidate hashes unchanged.

Eight principles scoped PASSED: Purpose waits for stable identity; Agency retains recovery and opening once ready; Responsibility avoids transient principal/remount state and preserves private reset keys; Familiarity existing controls/loading copy; Flexibility semantic/native interaction preserved, previous responsive/keyboard baseline not claimed rerun after new condition; Simplicity one condition, no new flow/control; Craft deterministic initialgate fail-before→PASS plus repeated originalrecovery; Delight uninterrupted tested restored dialog/recovery. Platform web fit scoped PASS, actualAT/mobile/zoom after thisdelta NOT_RUN.

Bounded cause: pre-auth Ask rendering confirmed; full previous detached-button failure cause not exhaustively proven. Repeated pass validates readiness fix without claiming all potential races eliminated. Full194unit/133integration/50native final receipt pending. Scoped content/source review PASSED; production/provider/fullperformance NOT_RUN.

## Cycle 6 preparation: preserve launcher composition

Current Ask source contract retained: collapsed launcher expands idle composer when no restored content; restored content can open dialog; visible resume opens dialog; submitting a question opens dialog. No source Ask change/new string. AUTH test now verifies postauth usable composer instead of requiring immediate modal. App auth-ready guard unchanged; startup loading/no-premature-Ask inventory remains.

Directly read ask-contract-repeat.log: original recovery3/3PASS41.1s through corrected actual two-stage native interaction; no forcedclick/timeouts/skips/product changes. Current App/test hashes match frozen candidate, test59b700d0f43af93c7f4b50d304dc2db6c9699211eb68cd30d26869a024660127. Full50 currently running; corrected AUTH final receipt pending.

Purpose/Agency/Responsibility/Familiarity/Simplicity source review remains sound: identity readiness, existing recovery, private resetkeys, familiar composer and no added control. Craft/Delight/Flexibility final current acceptance pending corrected AUTH/full50 and screenshot readback. Prior cycle5 repeat acceptance is historical and superseded by observed invalid modal assumption. ActualAT/provider/performance remain NOT_RUN; current exact coverage will be recorded after final receipt. Overall review BLOCKED pending evidence.

## Cycle 6 current affected acceptance

Current browser-contract-final50.log confirms corrected AUTH025-A01 PASS1.9s and CRM025-A01 PASS2s. Original ASK recovery3/3PASS in ask-contract-repeat.log already read. Thus startupgate and postauth native usable composer verified under actual lookup hold/release; recovery follows preserved two-stage source contract.

All eight principles scoped PASSED with bounded evidence: Purpose stable identity and selected data; Agency actual postauth composer/recovery usable; Responsibility no premature Ask/private-key reset preserved; Familiarity existing Vietnamese composer/resume; Flexibility native semantic controls/postauth interaction, previously current responsive/keyboard evidence retained with no control/layout delta, exhaustive postgate zoom/mobile/AT not claimed; Simplicity no new strings/steps beyond existing contract; Craft confirmed startup fail-before then current PASS plus originalrecovery3PASS; Delight stable tested postauth interaction and successful pending recovery. Earlier invalid immediate-modal assertions are superseded, not source acceptance evidence.

Scope Product Language Gate PASSED; full50 ongoing, overall production readiness BLOCKED. ActualAT/provider/fullproductperformance NOT_RUN. No source changes after approved gate; root manifest reports only authorized test mechanics drift. Private docs frozen after update.

Cycle7 image diagnostic: no changed user-facing strings, controls, layout or source states. Existing image privacy/control meaning retained. Actual6/6PASS current diagnostic/originalread navigation each3; no new product principle claim beyond scoped previous verified deltas. Historicaltransient rootcause UNKNOWN; full51/production pending, actualAT/provider/performance NOT_RUN.
