# Ask guest adverse testing — local completion

Implemented and verified the approved no-deploy continuation. Five reproduced bugs fixed in Ask: null diagnostic recovery, async focus theft, keyboard-inaccessible log, misleading cancelled-query retry, and lost focus after Stop. Named language group added. Public/private contracts and approved tracking card layout preserved.

124 passing tests:25 React component adverse cases,65 unit regressions,34 backend security/rules cases. Root TypeScript, scoped ESLint, application Vite build and diff whitespace checks pass. Native browser Enter A→B→A gives3calls/2cancelled/1card; stale responses after auth A→B→A do not render; real15s deadline settles the spinner. Offline unavailable SDK injection recovers on code re-entry. No code/private canary in DOM/storage/private sinks in executed assertions. Existing backend ownership, uniform rejection, quota/revocation/expiry controls pass regression.

Accessibility: Enter/Tab/Escape, keyboard scroll, result focus preservation, Stop focus, VI/EN320px layout checked. axe4.13 scans found no violations after fixes; clipped English history required manual contrast review (minimum sampled4.71:1). No horizontal overflow in log (266px/266px). Actual OS reduced-motion,200% browser zoom, physical network disconnection, hardware screen reader and actual provider sign-in fault injection were not run; controlled DOM/SDK/auth and320px reflow are explicit proxies. No complete-WCAG or production-proof claim.

Review: code/security/code-quality/product-content self-review with evidence. Historical cycles1–2 blocked on five defects, cycle3 passed but ledger receipt/report writes changed the broad worktree signature. Final reseal uses an ignored receipt/report location to avoid invalidating its own signature. No scoped source drift after testing; SOURCE-MANIFEST.json binds the source. Latest authoritative review and report are `.ai-agent-kit/runtime/report-outputs/ASK-GUEST-ADVERSE-20261010.txt` and its sibling review receipt. Earlier RUNTIME-REPORT.txt intentionally preserves the stale diagnostic.

Production NOT_READY. No deployment, push, commit, production mutation, app dependency change, shared-server restart/reset or extra frontend server. Existing provider AppCheck/secret/proxy/TTL/load gates remain NOT_RUN. Shared dirty WIP preserved. Fixture build stays in ignored test-results and is absent from application dist. Test-only tools installed externally with scripts disabled. Optional indexes remain DEGRADED; critical paths directly verified.

Acceptance:3/3 applicable local criteria verified. Token usage/estimated and actual cost: Unavailable. Memory candidates: None.

Reproduction: tests/component/README.md. Detailed scope, review, product strings, test commands, red/green logs and browser evidence are in this directory.
