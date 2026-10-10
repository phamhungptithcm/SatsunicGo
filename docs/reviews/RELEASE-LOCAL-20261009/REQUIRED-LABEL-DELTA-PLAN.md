# Required native-field label delta

Concrete plan saved before edits. Task intelligence **DEGRADED**; bounded current source, Git, existing required-label AST test and shared form-label CSS verified. The release brief HEAD is historical; the two current files match the Git index (scoped diff empty). Parent grants this narrow fix under human release hardening/review-fix authority and PAYMENT-UPFRONT-20261008 `APPROVAL-V3.md` approved cart/order purchase paths. No new payment/provider behavior or Ask design integration.

## Implementation and impact

Add only `<span className="requiredMark" aria-hidden="true">*</span>` beside five checkout labels (recipient, phone, province, commune, street) and two staff adjustment labels (expected total goods price, reason). Keep the existing wrapping native labels, required attributes, optional-country/note labels, values, disabled/pending states, handlers, error strings, validation, immutable financial acknowledgement fences and all actions. Existing global `src/styles/form-labels.css` renders these spans inline using inherited font; no CSS edit. No localization text changes: seven decorative asterisks added; native `required` remains the semantic accessibility source.

Owned source paths only:
- `src/features/cart/purchase-checkout.tsx`
- `src/features/orders/purchase-adjustment.tsx`

Validate the unchanged `tests/unit/required-labels092.test.ts` before and after, scoped ESLint and exact diff/marker readback. No new tests, runtime/browser/provider call, Git stage/commit or other source edit. Parent owns isolated candidate copying and broad checks.

## Baseline receipt

- Checkout SHA256: `9f419a72aa7e12ef83472741507483ab225369cfffa0cddf67b2a50090893733`
- Adjustment SHA256: `1075d076052c9a4320e020471443e6d710d215735ec9cb323184feacec9ceb69`
- Unchanged required-label test SHA256: `91f93a94a1e0edcfb8f1d1affd46e3b96c87d8bdd12a51e05dce2aca955b14e8`

## Product-content inventory and review boundary

Web/native forms, Vietnamese, current checkout recipient and staff adjustment tasks. Closest disclosed in-context evidence is the actual wrapping JSX labels/controls and shared CSS, not an isolated strings file. No live recipient/customer data or revised financial meaning.

| Label | Delta | State/meaning |
| --- | --- | --- |
| Người nhận | decorative `*` | required recipient name |
| Số điện thoại | decorative `*` | required telephone |
| Tỉnh / thành phố | decorative `*` | required province selection |
| Phường / xã | decorative `*` | required commune selection, still disabled until province |
| Số nhà, đường, tòa nhà / căn hộ | decorative `*` | required street/address |
| Tổng giá hàng dự kiến cho toàn bộ món (source currency) | decorative `*` | required staff proposed price, currency preserved |
| Lý do và tham chiếu giá mới | decorative `*` | required staff reason/reference |

Default/edit and existing disabled/pending states retain the marker while native controls determine availability. No new loading/success/error/offline/unauthorized/confirmation strings or changed state branches. Optional country/note semantics remain unchanged; no required mark on optional controls.

| Principle | Scoped source assessment |
| --- | --- |
| Purpose | Required information identified beside the actual field before submission. |
| Agency | Native controls, values, editability and validation retained; no new consent or action. |
| Responsibility | No cost/data-use promise or new required data; actual native requirements already existed. |
| Familiarity | Reuses repository-standard requiredMark, wrapping labels and native web required semantics. |
| Flexibility | aria-hidden avoids duplicate star announcement; native required remains available to AT; font inherits. |
| Simplicity | One decorative symbol per required field; no added instruction or interruption. |
| Craft | Existing system-wide AST test verifies required association, decorative attributes and absence on optional fields; existing source style inherited. |
| Delight | Avoids discovering missing required information only on submit; calm existing pattern, no extra decoration. |

These are bounded source assessments of the marker delta, not whole-product accessibility/AT/HIG acceptance. Actual browser wrapping/zoom/keyboard/AT audio **NOT_RUN** in this lease, therefore a complete rendered Product Language/AT gate is not claimed. Target platform is web; no Apple-only controls or current Apple-platform compliance claim. Root owns current rendered/full release review. Memory candidates: None.

## Verification/final review

Fresh review cycle 1 confirmed seven missing markers in actual required controls; unchanged gate reproduced **1 failed / 2 passed**, listing exactly the five checkout and two adjustment fields. Cycle 2 after the approved fix: **3/3 PASS**, scoped ESLint exit 0, diff whitespace check PASS. Exact independent reversal check removed five + two span blocks and recovered each indexed baseline byte-for-byte: no other label, required/disabled attribute, handler, money/private/auth/pending acknowledgement or action code changed. No test file changed.

Commands (Node22 v22.23.3; repository root):

```sh
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/vitest/vitest.mjs run tests/unit/required-labels092.test.ts --maxWorkers=1
/Users/hunpeo97/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node node_modules/eslint/bin/eslint.js src/features/cart/purchase-checkout.tsx src/features/orders/purchase-adjustment.tsx
git diff --check -- src/features/cart/purchase-checkout.tsx src/features/orders/purchase-adjustment.tsx
```

Actual log evidence:
- `/private/tmp/satsunicgo-required-label-before-20261009.log`: all seven missing-marker assertions, 1 failed / 2 passed.
- `/private/tmp/satsunicgo-required-label-after-20261009.log`: 3 passed, test process exit 0.
- `/private/tmp/satsunicgo-required-label-lint-20261009.log`: empty output, process exit 0.

Frozen final SHA256:
- Checkout: `1ddd9f33586aba40229a85262449113444de450fef183f89ab589ecd0c4ef851`
- Adjustment: `3b3ef11af24a86819a76a6d470fca42d8e9b87e8b1af63e691e8a61df7e53164`
- Unchanged gate test: `91f93a94a1e0edcfb8f1d1affd46e3b96c87d8bdd12a51e05dce2aca955b14e8`

Requirement/security/privacy/correctness/non-success review: bounded source delta satisfies the seven-marker request; preserves all existing non-success branches, account/private-data semantics and exact pending envelopes; adds no dependency, API, storage, provider or production write. Source-marker Product Language review maps all eight principles above, with rendered wrapping/zoom/keyboard/native AT explicitly NOT_RUN and whole-product gate not asserted. No new broad acceptance claim; root owns current isolated candidate copying, full test environment and final rendered/release review. No Git or runtime mutation. Source/report lease **RELEASED**; no further writes. Token/cost total unavailable to this worker; no paid calls. Memory candidates: None.
