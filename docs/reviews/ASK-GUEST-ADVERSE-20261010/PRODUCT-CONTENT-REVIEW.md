# Product content review — PASSED within local scope

2026-10-10, self-review using write-product-content. Web React Ask guest lookup; Vietnamese/English; customer wants progress/ETA without sign-in. Existing SatsunicGo blue/white UI remains authoritative. Native web forms/dialog/buttons, keyboard/log semantics; Apple HIG platform compliance not applicable. Bundled human-interface principles applied as quality reference.

## Inventory and meaning

| State/location | VI | EN | Behavior |
|---|---|---|---|
| Cancelled guest turn | Đã dừng tra cứu. Nhập lại mã để thử lại. | Tracking stopped. Enter the code again to retry. | Abort and discard old result; user re-enters capability, never replay masked question |
| Unexpected guest failure | Chưa thể tra cứu lúc này. Nhập lại mã để thử lại. | Tracking is unavailable. Enter the code again to retry. | Generic safe alert; no SDK diagnostic or private CTA |
| Async completion | Existing progress/offline/timeout copy unchanged | Existing copy unchanged | Preserve focus moved elsewhere; log announces result |
| Stop | Existing button names unchanged | Existing names unchanged | Restore focus to composer |
| Conversation/language | Existing localized accessible names unchanged | Existing names unchanged | Log tabindex0; named language group |

Guest cancelled/error turns suppress generic Try again and purchase CTA because the stored question is deliberately masked and cannot retry the capability. Owner/private turn recovery unchanged. No extra code retained in turn state. Default, missing code, success, loading, empty-on-auth-change, offline, timeout, malformed response, cancellation and unexpected diagnostic exercised in real component. Destructive confirmation not applicable.

## Data/authorization

Progress/ETA allowlist unchanged. Staff estimate remains qualified, not guaranteed; null remains unknown. Timestamp source/timezone/read-not-live labels unchanged. Code stays only in request/ephemeral selected ref; no raw code in turns, history, analytics or provider prompt. New guestLookup flag is non-sensitive. Auth-generation and request-ID fences remain authoritative.

## Eight principles

| Principle | Result | Current evidence |
|---|---|---|
| Purpose | PASSED | Cancel/failure explains how to resume tracking |
| Agency | PASSED | Stop/close/Enter work; moved focus preserved; composer receives focus after Stop |
| Responsibility | PASSED | No capability replay/storage or personal data; strict DTO rejection and backend canary checks |
| Familiarity | PASSED | Native dialog/forms, named VI/EN group, log and keyboard scroll; existing terms preserved |
| Flexibility | PASSED | VI/EN component states,320px browser widths, keyboard Enter/Tab/Escape, reduced-motion component branch |
| Simplicity | PASSED | One recovery instruction; irrelevant generic purchase/retry actions removed for guest |
| Craft | PASSED | Unknown/null diagnostic safe; dates/ETA unchanged; axe and contrast/manual review, screenshots |
| Delight | PASSED | Results respect reading focus and cancellation; clear calm recovery |

Browser evidence: OFFLINE.png, TIMEOUT.png, STOP-FOCUS.png, MOBILE-VI.png, MOBILE-EN.png, FOCUS-A11Y.json, AUTH-ABA.json, BROWSER-RACE.json. axe4.13 WCAG2A/AA/2.1AA: zero violations for exercised states. Mobile English mixed-history scan has color-contrast incomplete due clipped/offscreen content; manual computed foreground/background review recorded in CONTRAST.json. Log scroll reaches timeline/read times without horizontal overflow (266/266), dialog292px inside320px.

Assumption: SDK-unavailable rejection is a faithful UI recovery proxy for offline. It does not prove physical network reconnection or browser service-worker behavior. Actual OS reduced-motion setting,200% browser zoom and screen-reader hardware were not changed/run; reduced-motion code branch and320px reflow are executed proxies. No claim of complete WCAG certification or production verification.
