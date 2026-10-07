# SATSUNICGO-REQUEST-COMPACT-015 — Pending approval

Outcome: compact balanced form that enables quick completion without hiding necessary product fields.

Current source evidence: form014 uses 1120px cap, 2:1 columns, separate section and product headings, 22px cards, and an optional panel whose height pushes submit below its entire row. On mobile all secondary fields precede submit. Repository intelligence remains DEGRADED; bounded source inspection of RequestForm.tsx/public-ux.css.

Smallest solution:
- RequestForm.tsx: put submit plus existing error/status/recovery blocks inside product column after Add item, so optional sidebar height cannot push down primary action. Keep logical DOM ordering and visual/keyboard ordering aligned; group primary inputs/actions before optional section and explain optionality. All fields remain visible; CSV remains collapsed. Avoid duplicate Món hàng/Món1 headings: use one product-group heading with item number only for multiple products. Add short helper `Chỉ cần tên, link hoặc ảnh. Bạn có thể bổ sung thông tin sau.` only after verifying content/quantity defaults against schema. No steps/wizard, no forced new input.
- public-ux.css: retain1120 cap; balance desktop columns closer to 3:2; reduce gap24→20, card padding22→18, label spacing and inner gaps to12. Quantity, variant and condition in one desktop row (100px/minmax(0,1fr)/150px), wrap gracefully on smaller widths. Reduce optional note field height90→64. Align card tops, use white surfaces, thin borders and existing royal blue/navy brand. Keep44px targets and focus visibility. Mobile one column with primary action directly after product fields; optional fields remain editable below and clarify optional nature.
- No ProductComposer shared behavior changes. Preserve all current submit states, constraints, draft/prefill safety, pending retries, image upload limits and optional payload fields.

Principles: Purpose via product-first hierarchy; Agency through visible optional fields and no extra steps; Responsibility via explicit optionality and real constraints; Familiarity via native web controls; Flexibility via responsive wrapping/input alternatives; Simplicity by removing duplicate headings; Craft via balanced compact spacing; Delight via calm direct completion without decorative motion. Apply human-centered Apple principles to this web product; no Apple-only styling or controls.

Risk: low/medium UI structure. CTA before optional fields is intentional; no option mandatory or omitted from payload. Handle form-wide status near primary action. No backend/API/auth/schema/dependency/deployment changes. Preserve concurrent work.

Validation: direct navbar entry, keyboard ordering, empty/valid/error/disabled/retry states, add/remove item, optional-input payload unchanged, desktop1440 and mobile390 no overflow, screenshot review, TypeScript and input tests; product-content and final review. Compilation failures in unrelated concurrent files reported separately. No claimed speed metric without user study.

Approval scope: src/features/requests/RequestForm.tsx and src/styles/public-ux.css only. Rollback scoped JSX/CSS delta. Explicit human approval needed before protected edits.
