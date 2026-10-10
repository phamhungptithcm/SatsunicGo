# Dependency patch for the Ask candidate

Status: PROPOSED, awaiting exact delta approval. No dependency was changed or installed.

The candidate's production lock audit exits1 with a critical Handlebars finding. The root/workspace lock resolves4.7.9 through `@genkit-ai/ai@1.42.0` and `dotprompt@1.1.2`; both declare `^4.7.8`. The separate Functions lock already resolves4.7.10. Both locks are byte-identical to released73dc7d5, so this is a newly checked baseline dependency finding rather than an Ask-introduced dependency change.

The release builder deliberately seeds the standalone Functions deployment lock from the tested ROOT workspace lock and copies root overrides. Updating only `functions/package-lock.json` would leave the release on4.7.9. The primary advisory identifies4.7.10 as the patched release: https://github.com/advisories/GHSA-8r5x-fm3f-whwj . The release notes describe compiler validation and context-property fixes, plus a behavior change for iterable `each`: https://github.com/handlebars-lang/handlebars.js/releases/tag/v4.7.10 . The known critical AST case requires untrusted objects supplied to compile/precompile. Bounded application reads found `ai.generate` with system/prompt messages rather than an application call passing an untrusted AST to those methods. This is NOT proof of exploitability or proof of absence across all transitive paths. The mandatory audit gate still fails.

The existing reviewed assembly plan explicitly preserves dependencies. AGENTS.md requires a concrete plan and human approval for a material dependency delta. The user's release instruction authorizes release preparation, but it does not silently replace that reviewed constraint.

Proposed changes, after approval:

1. In the isolated candidate `package.json`, add the root override `"handlebars": "4.7.10"`. Input SHA2565aa00496aaf9d8f41a726bacaf26745939d840f4d669df8ddea9a37593a0880c.
2. Regenerate only the candidate ROOT `package-lock.json` using npm lock-only resolution with lifecycle scripts disabled. Input SHA2560f8b0c79388c72fb69a97b0166f57524ec8cf6fcede637a8f51a966f3768c8a0. Inspect every package delta; allow only Handlebars4.7.9→4.7.10 and required compatible lock metadata. Existing minimist1.2.8 already satisfies the new minimum. Stop for a new delta plan if npm changes another package version, dependency family, Node runtime, or application contract.
3. Preserve both Functions manifest and separate lock, all direct dependencies, CI thresholds, production holds, policy, budget, authentication and AppCheck. The root override is propagated by the existing artifact builder; no release-script change is proposed.
4. Verify using a separate candidate dependency installation instead of the shared node_modules symlink. Do not replace shared dependencies or restart5207. A networked install requires command-policy clearance; it is not a provider request or paid Gemini call. Preserve exact version/integrity receipts and disable package lifecycle scripts unless a specifically reviewed required build step exists.
5. Run root lock audit and standalone deployment-lock audit with `--omit=dev --audit-level=high`; verify4.7.10/version/integrity and zero unapproved dependency drift. Run template compatibility checks for ordinary escaped variables, conditionals, arrays/iterables and registered helpers used by Genkit/Dotprompt. Run affected Ask provider-context units, complete compiler/lint/unit/build and release artifact lock/hold contract checks against that exact installation. No real Gemini call is proposed.
6. Freeze a new candidate source/build/patch receipt and obtain fresh independent final review. Integrate these exact two files into shared source only after concurrency ownership and unchanged input hashes are rechecked. No production promotion until all other mandatory gates pass.

Risk: security-sensitive patch; compatibility changes can alter template behavior. Root lock is shared by frontend and backend. Local compiler/test success is not provider acceptance. Other moderate/low findings and dev-only high findings remain recorded; this proposal neither suppresses them nor authorizes broad `npm audit fix --force`, downgrades or dependency refactoring.

Rollback: retain the original two file hashes and verified v0.6.1 artifact; reverting the patch restores the known audit finding and is not an acceptable production-readiness claim. A deployment rollback has not been executed.

Decision requested: approve this exact Handlebars4.7.10 patch and its isolated validation. No business-policy, retention, provider-budget, hold-removal or deployment bypass is included.
