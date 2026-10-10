# Product Content Review · static preview

Surface: SatsunicGo Ask conversation/action window, VI/EN, web. Audience: customer preparing a buying request. Goal: edit details, review exact values and continue in chat without confusing preparation with submission/payment. Reviewer: root, 2026-10-08. Source: docs/previews/ASK-PANEL-WORKCELL-20261008.html. Applicable skill: `.ai/skills-src/write-product-content/SKILL.md` with product-content profile and its Human Interface principle/surface references. Apple HIG is not a platform contract for this web preview; no Apple-platform compliance claim.

Verified meaning: custom REQUESTED orders await a staff quote; request does not collect payment. Supported markets US/JP/KR; integer quantity1–100; trimmed product2–200; optional http(s) URL≤2048; optional nonnegative integer budget≤1e12VND. Synthetic preview dispatches no API and never claims a request was sent. Business behavior remains NOT_VERIFIED by this preview.

Full literal VI/EN pair inventory: PREVIEW-CONTENT-INVENTORY.json. Dynamic values use textContent; product names/preferences are user-authored examples, not translated official product facts. Unknown link/store/budget display Chưa bổ sung/Chưa chọn/Chưa cung cấp rather than zero. Price explicitly needs staff checking.

| State | Content/meaning | Current evidence |
| --- | --- | --- |
| Default/editing | Bản nháp · chưa gửi / Draft · not sent; persistent field labels | desktop-vi/en and form tests |
| Dirty | Thay đổi chưa lưu / Unsaved changes; approval requires new review | exact visible values + edit-invalidates tests |
| Review | Named buying request and all meaningful fields, consequence, decline/edit | store/KR/value/approval tests |
| Completed preview | Bản nháp sẵn sàng · chưa gửi; explicitly no real request | one-consent/no-backend test |
| Validation/error | Native invalid field focus; trimmed blank name, URL and money bounds | native/whitespace/boundary tests |
| Historical | Earlier-step banner + Return to current task; yes cannot execute | history test and root CUA readback |
| Ambiguous/conditional/question | Clarify rather than infer approval | six ambiguous-input tests |
| Unknown/unauthorized/offline/provider/loading | Not simulated in standalone preview; no real command or auth | NOT_APPLICABLE to preview; required for actual app integration |
| Destructive/cancellation/payment | No such operation exists in preview; decline only keeps draft | decline and disclosure evidence |

| Principle | Status in preview scope | Evidence |
| --- | --- | --- |
| Purpose | PASSED | One buying-request task; conversation explains quote requirement |
| Agency | PASSED | Edit, Later, decline, read-only history and return-current preserve values |
| Responsibility | PASSED | Disclosure, no price/payment promise, explicit reviewed consequence, consumed-once approval |
| Familiarity | PASSED | Native web fields/buttons/validation; one internal region, no nested modal |
| Flexibility | PASSED | VI/EN,320/390/768/1440, keyboard, Shift+Enter, reduced motion; full AT/zoom remain NOT_RUN |
| Simplicity | PASSED | One primary action, fixed composer/footer and independent form scroll |
| Craft | PASSED | Store included in review; supported markets, trim/URL/money boundaries, focus and reset-scroll repairs verified |
| Delight | PASSED | Retained draft on decline/history/Escape and concise calm responses; no decorative interruption |

Platform-fit result: PASSED within tested web preview. Canonical white/blue/navy and native controls retained. Action heading/focus, viewport containment and scroll evidence tested; CUA confirmed the labelled region, focused review heading and visible composer. No assertion of full accessibility conformance: screen-reader testing,200%zoom and alternate browser/device coverage are NOT_RUN.

Automated evidence: output/ask-panel-preview/output/ask-panel-preview/results.json,26passed/0unexpected, current hash binding in PREVIEW-EVIDENCE.json. Screenshots: output/ask-panel-preview/desktop-vi.png, desktop-en.png, mobile-320.png, mobile-390.png, mobile-768.png. Root CUA confirmed history “đồng ý” responds with return-current guidance, with no action execution.

Review cycles: TL-P01–04 requested supported-market/store/bounds/focus corrections; corrected and verified23tests. TL-P05–06 requested trimmed-name and uppercase HTTP(S) corrections; corrected and verified26tests. This document is preview acceptance only. Actual Product Language Gate and application integration remain pending current implemented-candidate evidence; new design approval remains pending human review.

Independent preview cycle3 inventory correction: removed parser artifact span/ *; added the exact VI/EN quantity-response template with validated quantity binding. No application or preview code changed.
