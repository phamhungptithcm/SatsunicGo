# Root merge integration

Normal merge: reviewed local74ddddb plus upstream73dc7d5, no history rewrite. Upstream validated demo endpoint replaces the older fixed18207-only test checks in tests/rules/analytics.test.ts. The helper verifies demo project, FUNCTIONS_EMULATOR=true and loopback8181/18207 before Firebase imports, and rules clients use the same validated endpoint as Admin fixtures. Existing local test cases retained. Upstream HTTP analytics lifecycle, shared endpoint helper and its unit tests remain unchanged.

Generated public-assets conflict will be regenerated using the merged frontend source and the configured public production build namespace in an isolated file workspace; no manual generated edit or shared runtime restart.

Ten differing untracked upstream document/image variants relocated only after matching two SHA256-verified backups. Recovery paths and hashes: RELOCATED-UPSTREAM-VARIANTS.json. Raw local artifacts remain on disk outside the public source commit.

Current merge test receipts pending; source syntax or historical checks do not promote the merged release. All eight production holds remain. Existing production API/index metadata was read without mutations; no TTL/secret/customer-money activation.
