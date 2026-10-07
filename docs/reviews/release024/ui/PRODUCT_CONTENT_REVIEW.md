# Product Content Review CRM024 — cycle1

Scope: Workspace shell/navigation and Dashboard; shared CRM-only screen presentation for list/filter/profile/activity/operations/documents. Audience staff within current role-filtered routes. Web, Vietnamese, existing white/navy/royalblue identity. No Apple-platform compliance claim. Reference inspiration HashiCorp neutral hierarchy only, no copied assets/fonts/brand expression. All server calls, route guard arrays, default destination, query limits, CAS/version/idempotency and print media rules retained. App/SiteChrome/Workbench root-owned; no source edits there.

Changed copy inventory:
- Workspace topbar group replaces literal CRM/slash, existing current page retained; finance/refunds regrouped under existing Tài chính. Every authorized link remains, mobile native dialog retains labels/roles. Decorative SVG icons aria-hidden, text labels remain.
- Dashboard caveat: `Đếm trạng thái... ETA...` -> `Trạng thái hiện tại của bản ghi tạo trong khoảng đã chọn (UTC), tối đa100... Không phải tổng toàn hệ thống. Chưa có thời gian giao dự kiến được xác nhận để tính đơn giao trễ.` Meaning preserved; source operationalDashboard returns counts for creation window/current state with bounds. Date-filter UTC labels unchanged.
- Initial state added: `Chọn khoảng ngày để xem công việc` / `Chọn tối đa31ngày, rồi bấm Xem số liệu.` Existing explicit submit and error31day contract supports this. No initial zeros or implied auto-load.
- ObservedAt ISO snapshot -> localevi-VN observedAt + `giờ thiết bị · chưa cập nhật trực tiếp`. Time source unchanged, now explicitly local device time, filter stillUTC. No live-data claim.
- Eyebrow `Vận hành` adds page grouping. All action names, dates, metric labels and numeric values retained from current source, not invented.

Applicable states: native menu selected/focus/default; dashboard default/initial/pending/error/snapshot/truncated data; CRM buttons disabled, empty/error/loading, filters/cards/tables. No new destructive or consent action. Current controls persist visible labels and role=status/alert. Scope text remains visible rather than hidden in help. Screen styles are inside @media screen so printed immutable statements retain their separate contract.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Grouped complete role-filtered destinations, one main heading and compact filters |
| Agency | PASSED | No automatic mutation/load, explicit date submit, all destinations retained |
| Responsibility | PASSED | Current state/created-window/100limit/non-total/non-live/device time truthful |
| Familiarity | PASSED | Existing native controls/labels/dialog, web conventions |
| Flexibility | NOT_RUN | Root024desktop/tablet/mobile/nativekeyboard/current layout pending |
| Simplicity | PASSED | Shorter functional copy and visual hierarchy, no new business step |
| Craft | NOT_RUN | Source compiler/lint/unit pass; current rendered cascade/print checks pending |
| Delight | NOT_RUN | Current polish/recovery visual proof pending |

Platformfit source reviewed PASSED, no Apple-only UI. Meaning/tone/terminology/shortness source review PASSED. In-context verification/accessibility/text expansion/layout NOT_RUN until current root browser evidence. ActualAT NOT_TESTED. No new animation; reducedmotion retained, no decorative transitions. Data semantics/privacy preserved; no customer production evidence or screenshots requested. ProductLanguageGate BLOCKED cycle1 until actual rendered evidence. No successful complete redesign claim.

Membership displayed-data delta coordinated with backend: server readprojection derives past/equal active expiry as expired, future active staysactive, cancelled unchanged; malformedactiveexpiry unknown/endsAt0. Current UI labels expired=`Đã hết hạn`, unknown fallback=`Chưa xác định hiệu lực`. No access/payment/persistence rule change; display is not proof of paid entitlement. Root screenshot unknown inspected and uncovered stray0 JSX; bounded booleanfinitepositive date gate now suppresses unknown sentinel. Current browser/screenshot revalidation pending. Positive valid date still localevi-VN device date. No new words introduced. Backend29projection regressions rootowned; don't certify from earlier16case report.

## Cycle3 current native visual review

Read crm-browser-round3.log directly:7/7PASS50.7s, 3widths390/768/1440; membershipexpiry/unknown; restrictedfinance/support fallback/overview denial; actual proposalaccept/apply/reject preserving boughtlines/verifiedmoney. Screens crm-overview-1440.png, crm-customers-390.png, crm-membership-unknown.png viewed directly after root current rerun: topblank strip gone; meaningful date/metric hierarchy; emptyfilter shows correct recovery without emptytableheader; unknownmembership renders no0/nofake expiry. Source hashes frozen.

Principles source+current native evidence: Purpose PASSED (grouped route destinations, explicit metrics); Agency PASSED (explicit filters/native menuEscape returns focus, role destinations retained); Responsibility PASSED (scope/truncation/nonlive/unknown meaning visible); Familiarity PASSED (native labels/actions); Flexibility PASSED for tested3widths/keyboard/menu/nooverflow; Simplicity PASSED (no publicheadergap/emptytable clutter); Craft PASSED for shell/customer/dashboard/membership fixes, native7cases and inspected pixels; Delight PASSED (clear empty recovery/layout without intrusive animation). ActualAT/fullproductperformance remain NOT_RUN. Printedstatement preservation source @screen; root print regression pending. This mapping does not yet approve newest proposal copy; requires current post-copy native acceptance evidence.

New UI024-4 copy inventory: substitution line formerly `DòngN: hủy0 · đổi thànhNAME, VARIANT`; now `DòngN: Đổi thànhNEWNAME` (original name if variant-only) + defined variant `· Biến thể:VALUE` or `chưa ghi` when empty; untouchedline `Giữ nguyên sản phẩm/biến thể`. Cancellation/return quantities unchanged. Verified changes.ts substitution cancelQuantity0 and backend application replacementVariant defined including empty. No alteration of quantity/payment/fees/deposit/acceptedterms/approve/reject action. No promise that product has no variants. Name/variant dynamic values remain escaped Reacttext. All states pending/accepted/rejected/applied use same explanation and original financial disclaimers. New exactcopy gate still BLOCKED pending current native proposal rerun.

## Final cycle7 Product Language Gate — scoped PASSED

Latest inventory and cycle7 supersede all provisional BLOCKED statuses above. Current sixowned frozen source hashes in CANDIDATE_HASHES.json match directread. Full45 browser-full-results.json:45expected/0skip/0unexpected/0flaky before finalcaptioncolour-only delta. Current postdelta browser-post-contrast-results.json/log:4expected/0skip/0unexpected/0flaky,33.8s; nativeH20017s andCRM390/768/1440. Live computednavcontrast every5caption at3widths4.9888497:1, opacity1 onwhite. Actual current support-native-200.png viewed: checkbox/text same row and clean focusedinput/toolbar/cards. Earlier current1440overview/390customerempty/unknownmembership images inspected. Proposal postcopy native test source asserts replacementname/variant visible and no hủy0, full45passes accept/apply/reject and money invariants. No new wording promises nonexistentvariants; definedemptyvariant uses `chưa ghi`, originalitemname retained variant-only.

| Principle | Final status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Complete role-filtered grouped routes; authorized overview landing; practical page/filter/metric hierarchy |
| Agency | PASSED | Explicit date/search submits, current menuEscape/focus, unchanged approve/reject and permission boundaries |
| Responsibility | PASSED | Current-state/creation-window/100limit/nonlive/device-time caveat retained; unknownexpiry distinct; cancellationquantity not fabricated for substitution |
| Familiarity | PASSED | Native labels, forms, menu/dialog, Vietnamese action wording and project light/blue design |
| Flexibility | PASSED | 390/768/1440/nooverflow, native200keyboard/checkboxrow, actualcaptioncontrast4.99; AT not claimed |
| Simplicity | PASSED | Removed emptytableheader/publicheader reserve and technical snapshot jargon; no new business steps |
| Craft | PASSED | Six findings fixed/reverified; current focusedpixels/contrast/geometry plus compiler/lint/build; truthful mixedrevision evidence |
| Delight | PASSED | Calm readable hierarchy and recovery without added motion/interruption |

Platformfit/meaning/tone/brevity/terminology/privacy/localizeddate/statecoverage PASSED for exact scoped changes. No Apple-only expression, assets or font copied. Default/empty/loading/pending/error/truncated/snapshot/unknown/pendingproposal/accepted/rejected/applied states inventoried. No new destructiveconfirmation/onboarding path; existing consequences preserved. Print3pages/nativePRINT check passed in full45; @screen preserves printstyles. Code quality preserves boundedlists/lazyload/noextra network behavior. Publicroute padding regression passed rootnative.

Explicit evidence limits: actualAT NOT_TESTED; no general localization/RTL certification; nativezoom image capture pixels misaligned so image-panel visual acceptance NOT_RUN, in-context proxy actualimagegeometry/AX/keyboard passes; fullproductperformance/liveprovider/production NOT_RUN/NOT_READY. No pixel-perfect/allroutes/allroles/exhaustive UX claim. ProductLanguageGate scoped PASSED and engineeringreviewcycle7 PASSED, production readiness remains separate.
