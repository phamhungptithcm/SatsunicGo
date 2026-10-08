# ASK109 composer clearing and send animation

Status: APPROVED via user message approved. User requests Enter submission clears composer and animates submitted text into Ask panel. Existing ASK107 approvals do not cover this new behavior.

Intelligence: gate executed DEGRADED: both indexes stale, health passed; bounded source fallback. Relevant source Ask.tsx ask/sendMessage/composer/TurnView; Ask.module.css question/reveal/reduced-motion. Shared dirty CI, catalog and media work excluded. Current implementation clears input when a turn is accepted, but restores text on transport failure if composer remains empty. Submitted turn and retry button already preserve recovery.

Approved proposal requested:
1. Ask.tsx: clear composer once a valid question is accepted into conversation, for Enter and send button; stop restoring submitted text after error. Keep unsent/invalid/blocked input and any newly typed draft. Preserve turn error and explicit Retry, same auth/operation guards and API payloads.
2. Add a bounded send transition from composer text position to the new question bubble, about 250-320ms, one per accepted send. Open panel first and resolve actual source/destination layout; no continuous motion, no duplicate accessible text. Clean animation/overlay on finish, cancel, close, navigation and unmount. With prefers-reduced-motion show question immediately. No motion implies request/payment success.
3. Scope: Ask.tsx, Ask.module.css, focused browser tests and review evidence only. No provider/budget/auth/checkout changes, no unrelated dirty files.
4. Validate Enter/button, success/error, invalid/empty/blocked submission, rapid duplicate sends, typing next draft while pending, retry, desktop/mobile, reduced motion and animation cleanup. Shared frontend5207 only. Product language/motion gates and fresh final implementation review required.
5. Deployment/commit not newly performed before implementation approval and checks; preserve existing release pipeline authority and unrelated concurrent work.
