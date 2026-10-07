# FREE entitlement gap closure — revision3

2026-10-04, scoped root THAW approval under full MASTER_PROMPT/E2E-005. Source pre-change verified: purchase always created pending membership invoice including0; configured plan schema names FREE/PLUS/BUSINESS, price allows0, period1–366. Existing root-added verified Google guard preserved; no shared files or rules membership tests edited. DEGRADED bounded evidence. No live provider/configuration/data, commercial defaults, billing, deployment, memory writes.

## Behavior

Published nameFREE price0 activates a subscription atomically using owner-configured period/snapshot and existing term validation. No invoice, bank transaction or financial ledger entry. History action activateFree; deterministic activation outbox; existing transactional operation replay+audit. Purchase response `{id:uid,state:"active"}`; paid `{id:invoiceId,state:"pending"}`. Fields are additive to previous id result contract.

Same active FREE selection preserves existing end date and benefit snapshot; repeated fresh clicks do not stack unlimited prepaid terms. Expired FREE can activate a new configured term. Existing live paid rights cannot change toFREE, including when staff repurposes the same planID. Active cross-plan prohibition remains. Zero-price nonFREE purchase fails closed until commercial policy is explicitly supplied; owner gift path remains separately authorized. Legacy pending0 invoices cannot be confirmed as fictitious bank receipts; operator support must address old requests.

UI labels true0/FREE action “Kích hoạt gói miễn phí”, distinct success “Gói miễn phí của bạn đang có hiệu lực. Không cần chuyển khoản.” Paid pending confirmation unchanged. Current notice/date remains authoritative, no future/lifetime rights promised. History maps activateFree toVietnamese.

## Current checks

- `npx vitest run tests/unit/membership-*.test.ts`: PASS3files/21tests (includes6newFREE cases: activation+replay/no money artifacts, no term stacking/snapshot replacement, unpublished/invalid/nonFREE0 denial, paid-rights protection sameID, locked customer denial, legacy0 confirmation denial).
- Scoped ESLint PASS; full `npm run typecheck` PASS, including Functions build.
- Real Firestore concurrency, browser/render/keyboard/local/production login, configured commercial policy and deployment: NOT_RUN for this slice. Existing unit mock does not prove live transactions; coordinated CRM owns emulator tests.

## Product-content review supplement

Web vi-VN; changed Membership.tsx JSX and user-safe backend errors are current source proxy. Changed inventory: intro distinguishes free activation vs confirmed paid/gift; free action label; active-success no transfer; activateFree history label; nonFREE0 invalid commercial policy message; existing paid-term transition denial; legacy0 invoice needs support. No loading/empty/date/ownership/error state contract removed. Paid amount/invoice paths retained. Active free repeat preserves previous snapshot; success wording avoids promising newly published plan terms over existing ones.

Purpose PASSED source proxy: choose free vs paid correctly. Agency PASSED source proxy: explicit activation, no auto charge. Responsibility PASSED source proxy: no0-money receipt, active paid rights remain protected. Familiarity PASSED source proxy: Vietnamese native action/history labels. Simplicity PASSED source proxy: one action, result driven by server state. Flexibility/Craft/Delight NOT_RUN: rendered layouts, keyboard and timing require shared browser cycle. Product-content/final full gate BLOCKED until that current evidence; this is hash-bound integration handoff, not release certification.

Remaining inputs: owner-published actual FREE period/benefits; zero-price PLUS/BUSINESS purchase policy if desired; support cleanup for legacy0 invoices; real provider/readiness gates. Memory candidates None; tokens/cost unavailable.

## Source hashes
ed7224fb8607b13ece3d9389f6726eb95754373f33904c865f2d115651baa789  functions/src/membership.ts
d346275c2604a80145f8b82f4dc2968fd4aca87410e8dee8c5b6e66fb7093575  src/features/membership/Membership.tsx
a3dee192fb353c7e40cc768e5ead5924c6d7324fa7c92943484e8b9ea56a0272  tests/unit/membership-command.test.ts
