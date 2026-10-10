# Product content review · email self-test

Scope: `self-test-content.ts`; Vietnamese operator email, subject, plain text and HTML. Audience: the account owner checking receipt. Platform: email clients; actual tested surface is an explicitly disclosed browser proxy, not Gmail/Outlook rendering certification. Reviewer: Codex, 2026-10-09.

Verified behavior: one fixed test message only. Provider acceptance is distinct from delivery; no transaction, payment or customer event is implied. SMTP/Resend customer notification activation remains held. No recipient, amount or customer fields appear in this template.

## Inventory

| Location/state | Content | Meaning |
| --- | --- | --- |
| Subject and HTML title | Email thử từ SatsunicGo | Identifies a test |
| Body paragraph 1, text and HTML | Đây là email thử từ SatsunicGo. | States the purpose without claiming production readiness |
| Body paragraph 2, text and HTML | Cảm ơn bạn đã giúp kiểm tra. | Thanks the owner for the requested test |

States: default/received uses these paragraphs. Loading, empty, disabled, unauthorized, offline, confirmation, error and unknown are operator API states, not customer email templates; those paths do not manufacture a success email. The endpoint has no product UI or controls. No retry, delivery, money, ETA or account action is promised in the email.

Data semantics: literal test content with a version and content fingerprint; no metrics/currencies/dates. Key and recipient are backend-only. Browser preview contains no actual recipient. Provider IDs are operational evidence, never presented as delivery proof.

## Human Interface principles

| Principle | Result | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Subject and first paragraph clearly identify the requested test |
| Agency | PASSED | Owner requested and approved one email; no CTA, consent or unsolicited follow-up |
| Responsibility | PASSED | No production-readiness/delivery guarantee or private data in the content |
| Familiarity | PASSED | Standard email subject and two paragraphs, natural Vietnamese |
| Flexibility | PASSED | Equivalent plain text and semantic UTF-8 HTML, lang=vi, fluid width |
| Simplicity | PASSED | Two short sentences, no technical jargon, cards, badges or duplicated instructions |
| Craft | PASSED | Current source-generated preview checked at 1280px and 390px; no horizontal overflow |
| Delight | PASSED | A restrained thank-you, without celebration or pressure |

Platform fit: cross-client email with plain-text fallback; Arial/system sans-serif and inline styling. Apple platform HIG component compliance is not claimed; no Apple-only pattern or protected expression is copied. The browser proxy has Vite development scripts injected; the exported email HTML contains no scripts, links, images, forms or tracking pixels. Provider account/domain tracking defaults were not inspected.

Patterns: writing/labels and notification interruption pass for the owner-requested test. Alerts, onboarding, destructive choices and permission UI are not applicable. Privacy boundary passes: no personalized or financial content. Accessibility: two paragraph nodes in reading order, UTF-8 language metadata, no color-only meaning or interactive elements, plain-text alternative. Screen-reader gestures/keyboard interactions are not applicable to this static message; native email-client assistive technology was not tested.

## Evidence and limits

- `email-preview.html` generated from the compiled exact template, served through the existing shared port 5207.
- `email-desktop.png` and `email-mobile.png`: actual browser screenshots, desktop 1280×720 and narrow 390×844.
- Browser AX text matches both paragraphs. Narrow DOM readback: viewport 390, scrollWidth 390, lang vi. Viewport override reset afterwards.
- Unit tests verify exact transport content, provider-state semantics and no persisted body/recipient/key.
- Locale is Vietnamese only for this explicitly selected operator test; customer English/localization is outside this slice.
- Gmail/Outlook delivery/rendering, inbox placement and provider tracking defaults: NOT_VERIFIED. This evidence is a proxy and does not certify customer templates drafted by the other chat.

Gate: PASSED for this static operator-test content. Meaning, tone, brevity, state mapping, data semantics/privacy, accessible text, locale, terminology, eight principles and disclosed in-context proxy all reviewed. No unresolved content finding in this scope.
