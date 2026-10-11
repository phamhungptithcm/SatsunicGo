# Product content review — guest adverse candidate

Scope: web React Ask, VI/EN, guest progress lookup. Audience: guest recovering from a cancelled or failed lookup; keyboard visitor navigating chat. Actual behavior: public capabilities are redacted from turn questions, so replaying the masked question cannot retry the lookup. The code is deliberately not persisted to conversation, model, analytics or URL; re-entry is truthful recovery. Non-guest retry/request flow remains. No new financial/identity/data projection semantics. Reviewer root; self-review, no independent acceptance.

## Current changed content inventory

| State | VI | EN | Implemented meaning |
|---|---|---|---|
| Guest cancelled | Đã dừng tra cứu. Nhập lại mã để thử lại. | Tracking stopped. Enter the code again to retry. | Stop aborts local lookup; re-entry starts new lookup; late response discarded |
| Guest unexpected failure | Chưa thể tra cứu lúc này. Nhập lại mã để thử lại. | Tracking is unavailable. Enter the code again to retry. | Safe recovery; no diagnostic/private code echoed |
| Guest retry/request CTAs | Hidden for guest stopped/error turn | Hidden for guest stopped/error turn | Redacted question cannot be replayed; ordinary answers retain existing retry/request links |
| Language group | Ngôn ngữ (existing) | Language (existing) | Existing buttons now belong to a named group |
| Conversation log | Hội thoại với SatsunicGo (existing) | Conversation with SatsunicGo (existing) | Existing log gains keyboard focus for scrolling |

Internal guestLookup marker is not displayed. Loading/default/success/empty/quota/expired/private rejection messages and public DTO/qualified ETA semantics remain. Error wording does not imply code invalidity or reveal whether a private order exists. Four complete localized messages; no concatenation, promise of persisted codes or automatic retry. Stop restores composer focus only for guest lookup within dialog, and close does not pull focus back.

## State and in-context evidence

Current candidate25 actual React component tests mount Ask/public renderer with controlled SDK/auth and HappyDOM; cancelled/unexpected failures in VI/EN, stale/late responses, account/requestABA, listener cleanup, Stop focus, moved-focus preservation, keyboard log/group and real15000ms deadline pass. Local117unit, strict build and lint pass. Current owner shared Ask hash matches candidate; owner's native shared5207 desktop/320px VIEN/Enter/Tab/Escape/Stop evidence is a disclosed matching-component proxy. No new candidate browser run. Controlled offline rejection and synthetic auth do not prove physical offline/realMFA/AppCheck. Actual screen-reader speech and genuine browser200%zoom remainNOT_RUN.

## Mandatory principles

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Recovery explains next action; no masked retry |
| Agency | PASSED | Stop/re-entry, scrollback, language and ordinary contextual controls remain |
| Responsibility | PASSED | Code privacy, generic rejection and truthful recovery retained |
| Familiarity | PASSED | Existing web dialog/buttons/log and plain VIEN wording |
| Flexibility | NOT_RUN | Keyboard/log and VIEN proxy pass; genuinezoom/spokenVoiceOver missing |
| Simplicity | PASSED | Guest irrelevant CTAs removed; one recovery instruction |
| Craft | NOT_RUN | Current component/source/proxy verified; scaling/spoken acceptance incomplete |
| Delight | PASSED | Recovery and focus save effort; no invented research or marketing claim |

Platform fit/meaning/audience/tone/brevity/terminology/state/data/privacy: PASSED within disclosed scope. Target is web, existing brand controls preserved; no Apple-platform compliance claim. Accessibility/localization/text scaling: NOT_RUN for genuinezoom/spokenVoiceOver. Owner local ProductPASS is not adopted because these mandatory checks remain missing. Product Language decision BLOCKED. PRE001/MFA/manual/immutable release/provider/live gates and no-deploy hold remain.
