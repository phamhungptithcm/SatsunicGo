# Product content review — recipient autocomplete

Decision: **BLOCKED for full UI acceptance**. Source, unit and server-rendered markup are explicit proxies; authenticated desktop/mobile interaction, Vietnamese IME and screen-reader behavior have not been observed. The earlier explicit refusal of local browser access remains binding; no workaround was attempted.

Scope: only two region fields in the existing customer checkout, Vietnamese web/React. The shopper chooses an actual current administrative unit before seeing the payment overview. Existing cart, recipient/phone/street fields, payment/fee meaning, error slots and notification choices are retained. Reviewer: current implementation agent, 2026-10-09. Applied write-product-content, product-content, web-app and visual-design profiles. Human Interface principles are a quality reference for this web surface; no Apple-only component or current Apple compliance claim.

Verified context: the authenticated setup endpoint reads the Firestore reference directory once. The official NSO responses requested for 09/10/2026 contain 34 province/city codes and 3,321 commune/ward codes. Both codes remain required; backend validates the pair and supplies canonical names. Text search is local and cannot by itself submit a valid code. Saved addresses hydrate names from the directory; changing province resets its commune and invalidates the overview/consent. Old order snapshots are not rewritten.

Assumption: retain the existing compact blue-white checkout, 44px controls and two-column recipient layout, with the existing single-column narrow breakpoint. Design read: searchable choices in the same recipient form with an overlay list, clear focus and stable errors. Layout variance 1/10 (same positions); motion 1/10 (no added animation); density 7/10 (existing compact transactional form). Actual viewport fit remains unverified.

## Changed content inventory

| Location/state | Current content | User job and behavior evidence |
| --- | --- | --- |
| Province, ready | Tìm tỉnh / thành phố | Input opens suggestions from the server directory; persistent original label remains. |
| Province, missing directory | Chưa có danh mục tỉnh / thành phố | Disabled control distinguishes unavailable data from a valid empty choice. Existing overview availability guard remains. |
| Commune, parent selected | Tìm phường / xã | Search only the selected province's children. |
| Commune, no parent | Chọn tỉnh / thành phố trước | Existing instruction retained; child control disabled. |
| Search has no matches | Không tìm thấy. Thử tên khác hoặc gõ không dấu. | A different local query can recover; arbitrary free text is not accepted. |
| Assistive count | {count} kết quả. Dùng phím mũi tên và Enter để chọn. | Count is the actual filtered list length; keyboard handling is source-reviewed, real assistive behavior NOT_RUN. |
| Assistive no match | Không tìm thấy địa danh phù hợp. | Live status for the zero-match query, separate from missing directory. |
| Canonical locality labels | 31 name corrections, individually enumerated in DATA-DIFF.json | Official source responses and generated hashes; no code or parent change. |

State coverage: default/selected/disabled/error associations verified by SSR and unit tests; filter/no-match/parent reset verified in pure functions and backend HTTP negative cases. Loading/service error/offline continue through the existing setup flow and feedback; no new network request per keystroke. Unauthenticated setup rejects the request. Enter/Arrow/Home/End/Escape/Tab/pointer/IME behaviors have code inspection only, not browser acceptance. Existing financial confirmation is unchanged. No destructive action, notification delivery or payment success text was added.

Data semantics: source https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx; dated request/provenance in SOURCE.md, raw XML and generated asset hashes. Five-digit codes retain leading zeroes. Commune membership is scoped by the two-digit province code; repeated names are not identifiers. Zero search matches means no match for that query, not absent nationwide data. Lookup strings and selection codes stay distinct. All names are public reference data; user queries are not logged, sent to a third party or stored by this component. Country remains VN.

## Mandatory Human Interface principles

| Principle | Status | Evidence and limit |
| --- | --- | --- |
| Purpose | PASSED | Existing recipient task and labels retained; queries filter valid choices. Unit/SSR/HTTP. |
| Agency | PASSED | No automatic region assignment; explicit choice supplies the code, typing invalidates old selection, query/no-match can be corrected. Parent reset unit/backend pair rejection. Keyboard usability still limited below. |
| Responsibility | PASSED | Official dated names; strict server membership and unaltered prices/payment; no query telemetry or external runtime API. |
| Familiarity | PASSED | Persistent field labels and standard web combobox/listbox semantics; compact existing controls and search abbreviations such as HCM/TPHCM. Static/SSR evidence only. |
| Flexibility | NOT_RUN | Accent-insensitive/combining-mark/code/abbreviation tests pass; real mobile, zoom, IME and AT interactions missing. |
| Simplicity | PASSED | Two existing fields, no extra step or instructions panel; unavailable and no-match states have short distinct wording. |
| Craft | NOT_RUN | Explicit label/error IDs, required marks, escaping, focus outline, overlay and 44px targets in source; real open-list geometry/keyboard/focus not verified. |
| Delight | NOT_RUN | Considerate short local search and preserved inputs are implemented; perceived responsiveness/pointer behavior not observed in the actual checkout. |

Platform/pattern checks: web terminology and blue-white branding preserved; visible labels match accessible names; red errors retain text and aria-invalid/describedby. No Apple trade dress or imported dependency. Native browser input editing remains available; popup selection uses a web ARIA combobox pattern. Responsive composition, keyboard/assistive technology, text enlargement and touch scrolling are required **NOT_RUN** checks, not a passed platform gate. No marketing/SEO, onboarding, permissions or destructive copy change.

Gate results: meaning, context, tone, brevity, data semantics/privacy and terminology PASSED within source/SSR/HTTP evidence. Accessibility, localization/text expansion, full state interaction, eight-principle completion, platform fit and current rendered in-context verification **NOT_RUN/BLOCKED**. No claim of complete UI accessibility or full end-to-end browser acceptance.

Remaining verification: authenticated recipient checkout at 1440/390/320px and enlarged text; pointer/touch selection and scroll; Tab/Arrow/Enter/Escape/IME; invalid submission focus without page movement; saved-address changes; screen-reader announcements and exact label/error association on the open list. Browser access refusal is the current evidence limitation, not a request to weaken validation or bypass access controls.
