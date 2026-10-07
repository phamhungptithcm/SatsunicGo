# Refunds UI/UX contextual decision — bounded v1

Owner explicitly requests all CRM UI/UX and action design loop; persistent028 fixes approved. Status IMPLEMENTING: root assigned exclusive Refunds page lease, actual path verified src/features/payments/Refunds.tsx (message initially named operations path). Only existing actual page +newtests/docs leased. Lead handles shared styles/App/backend and serial native runner. Frozen Returns slice unchanged.

Observed current UI: every pending refund displays full editable form; confirm and cancel share ambiguous “Lưu quyết định”; bank reference visible on cancellation; after unknown outcome controls remain editable while old pending payload remains authoritative; “Tạo thao tác mới” can discard uncertain financial identity without resolving prior outcome. Root financial command authority/actual transfer proof unchanged.

Proposed owned paths: src/features/payments/Refunds.tsx and tests/unit/refunds-contextual.test.ts only; existing CrmPresentation/native details/fieldset styles reused. No payment backend, database, Finance.tsx, manifests or shared CSS.

Design:
- Browse compact amount/state/reason/linked-order card; expand one selected decision only with native grouped disclosure.
- Controlled confirm/cancel action. Confirm reveals REQUIRED bank reference and “Bằng chứng đối soát”; cancel hides bank and shows “Lý do hủy”. Submit says exact decision: “Xác nhận tiền đã hoàn” / “Hủy yêu cầu hoàn tiền”. Existing disclaimer preserves external actual-money meaning.
- Freeze inputs during submit/uncertain outcome. Visible recovery retries original action/payload/version/opID; no hidden mismatch or ambiguous generic save. No discard-unknown shortcut. Do not auto-confirm or assume transfer.
- Keep empty/loading/error separate from stale records, clear private old data on failed refresh; protect late context changes. Small UI guard corrections only to support truthful affordances, not domain refactoring.
- Confirmed/cancelled records read-only; amount remains actual row.amount and no synthetic outstanding total. Unknown states receive “Cần kiểm tra trạng thái”, never mislabeled cancelled.

Validation after lease: unit/SSR conditional controls and action labels/payload preservation; native confirm/cancel on synthetic actual-bank proof fixture, permission/MFA rejection, lost response exact retry, draft retention, close disclosure and selected-focus behavior,390/768/1440/200% zoom/keyboard/AT/reduced-motion via root serial runner. Distinct frozen source hashes and current content/final review; no success until required states pass. No real provider/bank actions.
