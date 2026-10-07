## Superseded by current expanded candidate

See STUDIO_EXACT_SERVICE_CURRENT_REVIEW.md and current16-file manifest. Earlierpartialscope and passedtest counts below are historical, not latestcandidate certification.

## Current candidate supplement (supersedes older validation rows)

Ten-file manifest SHA256 6238769318f6f17fd0c4e0ab024d7f29b18a1656f8137638e45a2d4da7482f6b. Source/build writes frozen for root native runner. Current focused unit4files59/59PASS892ms, functions TypeScript noEmitPASS, ESLint10filesPASS. Added domain/blog-comments.ts, functions/src/blog-comments.ts, unit11tests and emulator5tests under approved delta BLOG_COMMENTS_DELTA_IMPACT.md.

Root focused integration round1 JSON actual68/68PASS includes Studio13/13, inspected output/playwright/release027/focused-integration-round1.json. That result is STALE for the new core candidate after category/sources/30inline/media20MP/normalization correction; requires root rerun73tests including comments5. No old passing result certifies latest candidate.

Cycle3 reference mechanics review found category/sources/30inline and20MP/WebP2400/metadata stripping missing; root explicitly approved exact corrections before nativefreeze. Fixed plus current unit boundary/real pixel/EXIF tests PASS. New comments11unitPASS,5emulatorNOT_RUN. Latest review remains BLOCKED pending current emulator/native/storage/product-context evidence. Root supplied native ownership; this chat will not start services/runners.

Comments: ALLpending (intentional Go policy deviation from source reputation auto-approve); safe public approved-only list20+sentinel chronological createdAt/id cursor; one-level approved-parent replies, verified Google/AppCheck/account locks/global+post commentsEnabled checked before actor-scoped exact idempotent replay.30-second spacing,max5/hour bounded transaction ledger. Explicit user-supplied public name, no auth/profile/email/UID public copy. Root index/export/reader wiring. Company profiles/avatar, reputation/share/view analytics and reader own-edit/delete/report are outside this essential Studio submission+moderation delta. Public approved projection has no invented total count. New private collections default-denied.

# Studio backend027 evidence and handoff

Decision: BLOCKED for full acceptance and production readiness. New owned implementation is available for root integration; no successful final certification. Approval: SATSUNICGO-ASK-STUDIO-RATES-027 v1, local only. Ten owned files are frozen by SHA256 in STUDIO_BACKEND_CANDIDATE.json. Preserve unrelated shared WIP.

Intelligence: initially DEGRADED per root gate, then READY in /private/tmp/release027-intelligence-permission-refresh.json. CodeGraph structural query inspected current new service, frontend callers and media/public blast radius; CocoIndex semantic query found publication/media/Studio risks. Critical mechanics verified directly against current HunpeoLabs lib/blog/schema.ts and repository.ts and Go workspace.ts, auth/guards.ts, media.ts and firestore.rules. Reference source remained unchanged. TypeScript6/Node22/FirebaseAdmin14.5/Functions7.4/Zod4; database/API/concurrency/TypeScript/product-content profiles applied. Classification: confidential draft/staff identities, public allowlisted snapshot, internal receipts/moderation/media metadata. No production records read or copied.

## Implementation contracts

- Private blogDrafts/id with revisions/number snapshots. Draft revision starts1 and increases for each accepted transition. Full draft payload is strictly schema validated; rich body bounded200000 characters, depth12, nodes10000, allowed nodes/marks only. Links are HTTP(S) without credentials; images only /media/id; unknown attrs stripped.
- blogPublished/id snapshots change only publish/unpublish; autosave/review/restore/schedule/archive do not change published content. Public allowlist omits owner/authorId/assignee/private state/schedules. content plain text remains available beside rich body for reader compatibility. Root owns public reader/media/index/rules integration; legacy posts are not implicitly copied or overwritten. Public status is published.
- studioRead list/get/revisions/settings/moderation; lists30 plus one sentinel, cursor31st protection. Revisions ordered numeric descending; other queues documentID ascending. Get includes {draft,schedule}. Settings initial revision1.
- studioCommand create/save/review/publish/schedule/unpublish/archive/restore/settings/moderate. Verified Google, strict active===true string-array OWNER/CONTENT_EDITOR and unlocked staff/account checked in the same transaction as CAS and idempotency. OWNER required settings. Exact request hash + actor operationID receipts; authority checked before replay. Published slug remains reserved and immutable. Author must be configured; optional requireReview enforced. Slug conflicts include legacy posts.
- Transactions read authority/receipt/draft/public/settings/legacy/revision/slug/media before writes. Old revision is immutable snapshot. Publish snapshot/media binding/slug/draft/receipt atomic; archive requires unpublish. Media maximum30 unique inline images plus1cover per publish bounds transaction reads/writes. No external provider calls inside transaction. Category and at least one source are required for publication, matching reference schema.ts222-237.
- publishDueStudioPosts processes20 due schedules. Rechecks active actor/account, schedule operationID/revision/time, current draft/settings/media/slug. Permanent failures are CAS marked blocked, requested time preserved, dueAt removed to avoid starving later jobs. Transient errors remain retryable. New explicit schedule replaces blocked job. Root owns periodic invocation; not deployed.
- studioMediaUpload PNG/JPEG/WebP/GIF5MB, explicit rights+alt; Sharp exact format,8192 frame width/height,100frames,20M decoded pixels and actual raw decode; auto-rotate, inside2400px animatedWebP85 re-encoding strips EXIF/location metadata. Actual output WebP MIME/size/dimensions/hash persisted and returned. Metadata persistence transaction reauthorizes after storage I/O; storage cleaned up if authority/persistence fails. studioMediaRead authenticated base64 preview reauthorizes before/after download, metadata path/mime/size/rights/status checked. Unpublished files stay private. Root must use published snapshot mediaIds authority and validateStudioImage helper for public GIF serving.
- Settings authors/categories uniqueness validated; commentsEnabled and requireReview settings; moderation approved/rejected/spam with CAS/audit receipt. Reader comment creation/thread/reputation, share/view analytics and profile/avatar taxonomy mechanics are not ported by this slice: full HunpeoLabs parity cannot be claimed from these changes.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| Focused unit3files | PASSED | vitest run tests/unit/blog-studio027.test.ts tests/unit/blog-studio-service027.test.ts tests/unit/blog-studio-media027.test.ts:41 passed,884ms,2026-10-05 |
| Functions compilation | PASSED | tsc -p functions/tsconfig.json --noEmit exit0 |
| Owned source/tests ESLint | PASSED | eslint six owned files exit0 |
| Broad frontend compilation | FAILED at shared snapshot | tsc --noEmit: Ask.tsx642:174 selectedTracking.current possibly null; root notified; no edit to root file |
| Emulator13 scenarios | NOT_RUN | tests/rules/blog-studio027.test.ts prepared, root serial runner required |
| Real Storage private preview/upload cleanup | NOT_RUN | unit decoder covers real pixels, not Firebase Storage/network lifecycle |
| Native Studio/reader/media and eight principles | NOT_RUN | frontend/root own integration and serial browser runner |
| Production migration/deploy/content mutation | NOT_RUN | not authorized; none executed |

Unit service uses transaction fake, not real concurrent database evidence. Emulator scenarios include concurrent save and slug race, exact replay/revocation, strict malformed roles and customer locks, settings OWNER/CAS, foreign media atomic denial, private snapshot isolation, blocked schedules and unpublish/archive.

## Review cycles

Cycle1 source review found: M1 permanent failed schedules could consume all20 slots; M2 media preview trusted malformed metadata; M3 new create could collide with orphan public snapshot; M4 public GIF decoder integration absent. Fixed M1-M3 in owned source, added bounded exact image validator and real GIF test for M4; root owns public integration. Static/unit verification passed after corrections. Settings duplicate catalog identifiers additionally rejected.

Cycle2 fresh source review: no remaining known actionable defect within executed unit/static checks. Required real transaction/storage, public integration and product-content evidence missing => BLOCKED. Applicable final review dimensions: requirement match BLOCKED (full parity/integration not evidenced), security BLOCKED (real revocation/storage/rules pending), code quality PASSED scoped static checks, failure paths BLOCKED (network/emulator pending), error handling BLOCKED (in-context pending), production readiness BLOCKED, tradeoffs PASSED documented. Product content review in STUDIO_BACKEND_PRODUCT_CONTENT_REVIEW.md.

## Operational and rollback posture

Additive collections only; no migrations/datafixes/index/config writes by this slice. Publication/slug/revision queries use single fields; dueAt queue single inequality/order, no new composite index proposed. Revert owned source + root wiring before release; persisted published snapshots require separately authorized operational rollback after any real deployment. Production backup/restore/IAM/providers are NOT_TESTED. Receipts are audit evidence; no new dashboard/alert deployed. Root must consume scheduled blocked result and surface failure to operators. Historical revisions/receipts have no retention policy in this slice; production owner must specify one before release.

## Completion report

Local domain/callable/test source delivered. Full integration,13 emulator tests, native private preview/public image/schedule and eight-principle checks remain. Git checkout dirty/shared; no commit/PR/deploy created. Runtime CLI ai-agent-kit unavailable in PATH and common host locations; review JSON prepared but not recorded, rendered runtime report unavailable. Token usage Unavailable; actual and API-equivalent cost Unavailable. Memory candidates: None.
