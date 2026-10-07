# CRM024 UI session first-pass freeze

Approval and bounded source-impact in PLAN.md. Gate rerunDEGRADED (stale indexes), source-authoritative audit. Changed only Workspace.tsx, Dashboard.tsx and new Workspace.css. Existing CRM pages improved through scoped cascade; no handlers changed in Customers/Customer/Activity, no App/SiteChrome/global.css/Workbench edits. Workspace role/default routing unchanged; navigation visually grouped and finance entries moved to finance. All changes local, no deployment.

First-pass features: compact240px sidebar/outline icons/group hierarchy, contextual header/right-aligned account, smaller coherent page headings, bordered white cards/table/filter/forms, accessible button separation, dashboard horizontal date toolbar/9metrics grid/initial instruction/freshness meaning. CRM document button-list gaps via scoped div.noPrint, seller details/card; @media screen excludes print changes. Source-review cycle1 caught specificity conflict that would keep sidebar on mobile and fixed before freeze.

Checks executed serial: frontend tsc --noEmit exit0; scoped eslint Workspace/Dashboard exit0; Prettier touched3owned files; Vitest4files11tests PASSED (staff-route/workbench-ui/workbench-ui-lifecycle/invoice-document-requests). No new test merely mirroring CSS. Root owns nativebrowser/integration; not yet run in UI session. CSS-only sidebar correction after compiler does not add TS code; rendered check pending. Existing sharedWIP diff againstHEAD includes earlier changes; current hashes are authority.

SHA256 freeze:
- Workspace.tsx093fca98e266bcffb314ce1d48dec167a149c9a47ee652b2d921b6a1ce339b3e
- Dashboard.tsxe98dc253a22383f4b1c76c83fa95e18d2c9909acf35504dcebd1991d6317a738
- Workspace.css60218d3ab4ad6bc5f57b9b32c687e2f71a4c8c8c10eea5ced8c1a513cb74b7b5

Quality profiles universal/typescript-javascript/frontend-html-css/web-app/concurrency/memory/product-content. TypeScript6/React19/Vite8 current manifests. API/data/schema/auth/permission changes NOT_APPLICABLE, print preservation needs root regression. Source/diff review PASSED bounded; mobile/desktop/200keyboard/visual/filter/profile/restricted-role/runtime NOT_RUN. ProductLanguageGate BLOCKED and finalreview cycle1 BLOCKED until rendered evidence. Production NOT_READY; actualAT/fullproductperformance/provider acceptance NOT_RUN. Tokenusage/costUnavailable. MemorycandidatesNone.

Cross-owner hypothesis resolved: DB withdrew Customer A→B retained-stateHIGH after verifying Workspace Customer key={pathname} and App Workspace principal/role key. Keys preserved; no speculative lifecycle fix added. Root owns confirmed Workbench order-action hierarchy delta; UI CSS accommodates it. UI source frozen for root first native3test/visual cycle; reportdocs may append current evidence.

## Cycle2 native review/fix

Root crm-browser-round1.log read directly:3/3 native PASS13.9s at390/768/1440. Actual screenshots crm-overview-1440.png/crm-customers-390.png inspected: coherent cards/filter hierarchy; confirmed76px blank strip from body public-header reservation and clipped irrelevant empty-table headings. Fixed scoped CRMbody padding and conditional table rendering per PLAN.md. tsc/scoped eslint exit0. Current FREEZE hashes supersede oldCSS: Workspace.css87a0a87861b0e28f45ab96ccac9f069a42bffa92b87da2537261c3b5309c8b5e; Customers.tsx126e0bf3ef6ba0c918b9af5e9d6235fbaa0f0a5948ad26bf0145095a96fb5ddc. Workspace/Dashboard hashes unchanged. Await current root native topgeometry/emptytable/publicheader proof. ProductLanguageGate/review remain BLOCKED pending fresh current evidence. Bodyselector only :has(main.crmRoot), @screen, no public padding/print changes.

Approved default-landing delta implemented: authorized overview preferred else existing firstallowed page. No deep-link/allowlist or dashboard automatic fetch changes. tsc/eslint exit0. Final current Workspace hash8f218c05c0954b5aa7cf4e90fc43dc7dfadf7e45e13381b4cefc50d55a14a01f supersedes firstpass. Root owns native owner/restricted fallback tests. Freeze confirmed.

## UI024-3 screenshot fix

Directly inspected crm-membership-unknown.png: accurate unknownstatus plus stray0. Confirmed JSXnumeric&& rendering rootcause, fixed only Customer.tsx expiry display booleanfinitepositive check; no strings/handlers/domain edits. Compiler+scopedlint exit0. Current Customer.tsx SHA25660d3fd9fc892ff8112a04a2d0adef2e625197cb5a0cfd4b984fd69549176d004, others unchanged. Sourcefreeze. Rootnative no-bare0/screenshot pending, do not mark finding FIXED_VERIFIED yet.

## Cycle3/4 review and proposal copy freeze

Directly read round3native7PASS50.7s and inspected three actualcurrent screenshots. Topgap, emptytable, unknown0 findings FIXED_VERIFIED; clean CRM hierarchy at390/1440 supported current pixels, native768 also passed. User authorization and all bounded deltas retained in PLAN. New display-only Changes paragraph UI024-4 sourcefreeze53446e906d75084fcca7004d3ad9303db94ee82ef6926ae207bad0a6716acb7b; compiler/lint exit0. All othercurrent hashes unchanged. Productinventory updated. Current finalreview remains BLOCKED only current post-copy/full/print/native200 evidence pending coordinator; actualAT/provider/performance/production limitations persist. No further sourcechanges planned. Prior UI proposalcopy provisional wording superseded by root agreed `Biến thể:chưa ghi` and originalname for variant-only.

## Current native200 evidence and frozen hash audit

Current H200PASS19.9s read in browser-final.log. Support screenshot viewed directly: header/toolbar/card/input good, checkboxlabel inheritedcolumn visual flaw UI024-5 recorded inPLAN (no edit during45run). Imagegeometry file current720x500 scrollY752.5 rect43/275.1875/634/61 insideviewport; AXlabels and keyboard actual, screenshotvisual remains limited. Current sixowned sourceSHA256 match all frozenvalues inREPORT. Full45ongoing, not fullPASSclaimed. Open UI024-5 blocks scoped successful review until bounded CSS correction/currentverification or root explicit scope decision. No sourcechanges made in runtimewindow.

## UI024-5 approved oneproperty correction

RootGO after previousfull45finished44PASS1FAILsole staleversiontext assertion; that failure root-ownedtest, not currentproduct defect. Added only flex-direction:row to CRM .form label:has(checkbox), nootheredits. New CSSSHA256662d170c681e622841f9067370bebd3f7e9e88ec552e19b43934bb5d0f6c299a supersedes87a0a8; allotherownedhashes unchanged. SOURCEFREEZE again. RootH200new checkbox/text geometry+whole45rerun pending. Prior print3pages pass root evidence reported; directread final proof still pending. Current review BLOCKED until freshpass. No new compiler needed for singleCSSproperty; root finalbuild authoritative.

UI024-6 pending finding: source verified10px sidebar groupcaption#738099:white contrast3.9798:1 (sRGBformula), candidateexisting --crm-muted#647087:white4.9888:1. No colour edits in activefull45window. Rootnative computedcolour/opacity proof + nextwindow correctiveoneproperty pending; current scopedfinalreview remains BLOCKED until confirmed accessibility fix/retest. Latest CSS662d170 remains frozen.

## UI024-6 actual contrast correction/sourcefreeze

Directly read nav-contrast-before.json: nativeIAB mobilemenu computedrgb115128153 onwhite,10px,opacity1,5groups, contrast3.979822FAILED. RootGO after whole45PASS. Changed only groupcaption color tovar(--crm-muted) existing#647087. CurrentCSSSHA25682dfd1eb76cbf121a023d7ad8dec5cf5be3ddcb8db0bdf6f1c58f77a85861104 supersedes662d170; otherownedhashes unchanged. Sourcefreeze.

Directly read browser-round6-final.log:45PASSED5.0m before onecolourdelta. Root preserved browser-full-results.json. New3widthnav/mobilecontrast+H2004affectedtests and finalbuild pending. Final review evidence must combine precolour broad45 and postcolour targeted4, not claimwhole45afterfinalcolour unless actually rerun. Latestproposalcopy checked in broadnative45; print and workflowsemanticstage root tests passed. Finalreview stillBLOCKED until contrastdelta proof/finalchecks.

## Final cycle7 scoped handoff and docsfreeze

Directly verified final evidence: broad45nativeprecolour PASS5.0m (browser-full-results.json/log), postcolour4affected PASS33.8s including current3width15captioncontrast>=4.5 andH200checkbox/textgeometry. ContrastJSONs all4.9888497:1, sourcehashes match CANDIDATE_HASHES.json. Current support200pixels inspected checkboxrow fixed; prior current overview/customerempty/membershipunknownpixels inspected. Latest proposalcopy acceptance nativePASS. Root finalfrontendtsc/lint/build successful logs read; build retains existing chunk-size/ineffective Firebase dynamicimport warning, not performance acceptance. Unit178/integration100 codeunchanged coordinator evidence; not rerun by UI after colourdelta. Scopecombinedverification explicitly not full45postcolour.

Finalreviewcycle7 PASSED for scoped UI, ProductLanguageGate PASSED exactinventory/all8principles with currentnative evidence and disclosedproxy. Cycles1-6 BLOCKED history preserved in PLAN/REPORT and reconstructedJSONs; cycle7 no known actionable findings in executed scopedchecks. UI024-1..6 FIXED_VERIFIED. Root owns additionalWorkbenchtechnicalcopy/actionplacement and backendmembership businessprojection; scoped UIreview does not approve unrelated broader changes. Root must bind runtime receipt/aggregatecandidate before whole-task success.

Current known limits: indexesDEGRADED; actualAT/fullproductperformance/provider/backup/deploymentNOT_RUN, productionNOT_READY; headlessnativezoom image-panel screenshot pixels not accepted, geometry/AX/keyboard source/currentproxy verified. No provider/customerproductiondata used. MemorycandidatesNone, tokenusage/costUnavailable. ShareddirtyWIP preserved; no commit/push/deploy/install/reset/reseed.

UI SOURCE AND PRIVATE DOCS NOW FROZEN. No further mutations planned; root may bind final aggregate signature. Final immutableownedsourcehashes CANDIDATE_HASHES.json, latestCSS82dfd1eb76cbf121a023d7ad8dec5cf5be3ddcb8db0bdf6f1c58f77a85861104.
