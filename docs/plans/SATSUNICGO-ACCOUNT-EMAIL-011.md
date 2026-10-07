# ACCOUNT-EMAIL-011 — account email display

Requested: show email address under the customer name in the account dropdown.

Current source: AccountProfile in src/app/SiteChrome.tsx reads Firebase User and verified Google provider data; identity currently shows name and Google label. Existing accountIdentity span styles in src/styles/global.css set muted small text.

Plan: derive email from google.email trimmed, falling back to user.email trimmed. Show the email below the name while retaining the verified Google label. Omit email when unavailable; never invent an address. Add overflow-wrap:anywhere to the identity text so long addresses fit mobile. No auth, storage, network, logout, routing or navbar trigger changes.

Files: src/app/SiteChrome.tsx (AccountProfile only), src/styles/global.css (accountIdentity text wrapping only). Low-risk presentation change; authenticated profile remains source of truth, displayed only in its account disclosure. Preserve concurrent work.

Verification: TypeScript, scoped lint/format, current-context dropdown checks for present/missing/long fixture addresses, product-content review and final implementation review. Rollback: revert only these small additions. No production deployment in scope.

Intelligence: bounded source inspection; optional index gate result will be recorded. Prior account menu plan used the same Firebase identity boundary. Human approval pending; application files unchanged.
