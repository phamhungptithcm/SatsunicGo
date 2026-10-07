# Verified Google rules integration — security handoff v2

Approved continuation owns only firestore.rules and tests/rules/firestore.test.ts, with shared helper/unit previously delivered. No other module/test edits. Parent coordinates callable integration.

Change: signed() requires request.auth plus email_verified boolean true and firebase.sign_in_provider google.com. Map.get defaults missing claims fail-closed. Owner/private reads retain existing lock/ownership; anonymous published catalog unaffected; all client writes denied; Storage deny-all unchanged. Rules do not accept linked Google identity with current password/custom session. Existing users/{uid} path intentionally retains signed() without unlocked() so verified locked user may inspect own profile as before; other data remains locked.

Fixtures now explicitly verified Google. Added denials for missing verification, false/string verification, absent provider, password, custom session with linked Google identity; each denied private account can still read published product. Added Google + totp owner-read acceptance. These are synthetic rule tokens and do not prove interactive Google/MFA.

Validation: npx eslint tests/rules/firestore.test.ts PASS. Emulator suite NOT_RUN by this agent because demo is active and isolated emulator lease belongs to root/QA. Rules compilation/runtime acceptance pending coordinated run; do not claim release-ready.

Hashes:
firestore.rules 436251de75945044b06c0d4e7ea602e18e6e7d03c6d4dafb88fc707633839348
 tests/rules/firestore.test.ts 492e38d83332c3f45ff7a3f12f6a08d2d118128299010b014af79f90a8bb4917
functions/src/auth/guards.ts 3d335ae98828d5f47ce2b06981b750324bff9836503d2966e4cbfb327a7c0d9c
 tests/unit/verified-google.test.ts 33f2e0814a5fb421be224f4f9eb94782fe84dd0068b8782ebf3e0d6c3a00e54a

Primary token contract cited in v1 handoff. No durable memory update, dependency/provider/secrets mutation or live data access.
