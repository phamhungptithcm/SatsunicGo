# Product content review — Ask commerce009

Scope: contents inside existing web Ask panel; Vietnamese/English customer purchase experience. Original dialog/composer geometry and original CSS prefix retained byte-for-byte. Human approved009 plus requested simpler Apple-inspired content hierarchy; no Apple assets/typeface/brand copied. Existing web native disclosure/input/button semantics retained.

References: Apple official Layout and Disclosure controls accessed2026-10-04; repository write-product-content principles and surface patterns. Platform: web, no claim of Apple native HIG compliance. Reviewer: root; independent source verification recorded separately.

Verified context: quote and catalog are distinct; custom/manual quote/deposit50%, catalog immutable fixed total/full payment via018 helpers. No model can authorize purchase, credit payment, approve refund, or bypass command/version/owner checks. Quote costs are estimates; final total may differ; payment recognized only by verified allocation. Prices do not establish stock or authenticity. AI settings remain disabled in demo; actual model inference NOT TESTED.

## Content inventory and meaning

All current literals/JSX texts in changed content/Ask components are inventoried in STRINGS.json. This includes default, disabled/pending, error/retry, confirmation, completion, privacy, labels, image alternative text and VI/EN pairs.

|Component|States/content|Task and behavior source|
|---|---|---|
|InvoiceSummary|Total payment/quote, verified paid net refunds, deposit, all fee rows including zero, expiry/terms|One primary total, secondary detail disclosure; domain quoteTotal and018 snapshot|
|Commerce|Order status/name/variant/quantity, delivery details, address form/privacy, versioned accept/final/receipt, amount due, payment/expiry/recovery|Current snapshot plus nextCustomerAction/paymentPurpose/paymentDue; server staff commands remain authoritative|
|ImageIntake|Add/drop/paste, maximum3/2MB, selected image/remove, optional description, send, AI/privacy/storage disclosure, auth/invalid/attach pending/retry|Native input plus local JPEG reencode, model owner gate and uploadOrderImage request path|
|InlineSupport|Support toggle, staff-policy notice, message form/thread, pending/error/retry|Existing workspace openTicket/replyTicket and owner query, no invented refund automation|
|Ask|Explicit chat confirmation/failedaction, preserved privacy notice/errors|Only deterministic unambiguous owner commands execute; ambiguous consent or claimed payment does not|

## State evidence

Default/completed: desktop and390x844 screenshots current009; total1400, verified1400, historical quote1300 not conflated. Expanded disclosure verified real fee rows1000/100/200/zeros/total1300/expiry/terms. Recipient details collapsed, opt-in review retained. Support synthetic message persisted through existing command and displayed waiting status. Pending disabled while actual request in flight observed. Newconversation empty and native chooser selected syntheticJPEG80x80, preview/remove/send/privacy visible; newconversation cleared photo. No image accepted from another conversation. Invalid images/QR/ownership/error cases exercised in tests and inspected safe retry UI. Offline/stale/permanentmodel/provider success absent: NOT TESTED, not represented as completed. Confirmation consequences/versionguards source/test verified; staff support retains manual decisions.

## Data semantics and privacy

VND integer minor units, vi-VN/en-US currency formatting; zero shown as0 not missing. Unknown quote omitted rather than invented. Accepted historical quote distinct from final total; paid=collected-refunded, refund reservation retains existing financial contract. Server snapshot is authority. QR amount/account/bin/reference/CRC validated and hidden upon expiry/version change. No financial data from model prose. Address stays separate from model context. Pre-order photos ephemeral: lost onreload; selected photos automatically attach when order exists. JPEG metadata stripped beforemodel by bounded Sharp decode/reencode. Existing order-media retention unchanged; no new automatic deletion/training jobs.

## Eight principles

|Principle|Status|Current evidence|
|---|---|---|
|Purpose|PASSED|Product and single total visually lead desktop/mobile; current next action follows manual state|
|Agency|PASSED|Disclosure toggles, image remove, address review, explicit consequential confirmations, no ambiguous consent automation|
|Responsibility|PASSED|All cost rows available; final versus quote distinct; verified payments only; AI/privacy/staff-policy limitations stated|
|Familiarity|PASSED|Native web details, labeled forms, familiar Vietnamese money/recipient/shipping words|
|Flexibility|PASSED|390x844 layout and desktop, upload/drop/paste paths, VI/EN source pairs; no mandatory image input|
|Simplicity|PASSED|Single total hero; secondary details/address/support collapsed; completed order has no photo uploader|
|Craft|PASSED|Tabular amounts, focus-visible, labels/alt text, current screenshot hierarchy; original shell retained|
|Delight|PASSED|Less reading/repeated data, immediate preview and resumable support; no decoration or fabricated success|

Platform fit/meaning/business context/respectful tone/concision/action semantics/data privacy/terminology: PASSED within inspected local scope. Accessibility: native AX names and expanded/collapsed controls verified, keyboard focus styles inspected; full screenreader NOT TESTED. Localization: all newcontent VI/EN source inventory reviewed; live EN operational state and200%zoom/RTL NOT TESTED. Web numeric currency/local-time formats used. No Apple-only control or copied expression introduced.

Decision: PASSED for local content revision and honest states; liveAI/QRprovider and full operational pipeline remain NOT_READY. Image successful staff storage attachment browser evidence, livemodel extraction, catalog discovery/full inchat checkout are not certified. Residual: pre-order photos not retained afterreload; photos should not contain documents/receipts; redaction heuristic cannot guarantee PII removal; existing browser filename chooser content is hidden behind labeled content action.
