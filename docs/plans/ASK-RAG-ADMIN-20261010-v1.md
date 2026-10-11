# ASK-RAG-ADMIN-20261010 v1 — CRM AI & Knowledge

Status: PROPOSED, awaiting human approval for application/schema/dependency changes. This document authorizes no implementation or deployment by itself.

## Outcome

Give the OWNER one dedicated CRM workspace to upload and curate documents, control approved context, inspect chunking and retrieval, and verify which evidence Ask actually used. Preserve current customer authorization, payment authority, model admission and the existing 50,000 VND generation trial. Upload is never automatic publication.

## Intelligence and verified baseline

Repository Intelligence Gate: DEGRADED, 2026-10-10. CodeGraph/CocoIndex installed and health checks passed, both indexes stale. Bounded source inspection used; no complete indexed blast-radius claim. Shared root is dirty/concurrent; isolate implementation from unrelated WIP. Production AI release source b5c0a1c285c07faeacf1d3b8ba544f76d885ceb6; root current source may include subsequent WIP and must be compared before implementation.

Verified files: src/features/settings/Settings.tsx mounts AskPilot and KnowledgeApproval; KnowledgeApproval.tsx accepts posts/blogPublished ID, preview, language/effective dates, approve/revoke. packages/domain/ask-knowledge.ts source enum only posts/blogPublished. functions/src/ai/approved-knowledge.ts enforces OWNER/recent MFA and version/content hash. knowledge-retrieval.ts is bounded lexical retrieval, 1,200-character spans, up to8 excerpts; knowledge-context.ts carries revision/span hashes and full-input token packing. server-context.ts projects authorized task/order/conversation facts. Ask production module bounds generation. storage.rules denies all client reads/writes. media.ts/MediaUpload.tsx are image-only content upload, unsuitable for private knowledge files. Node22 Functions, React/TypeScript/Vite, Firestore/Storage and existing Zod contracts.

Current gap: no file ingestion, knowledge library/list, collection-level publication, chunk inspector/editor, retrieval policy administration or retrieval trace workspace. Current approved-knowledge lookup must also adopt new approved file revisions; adding only upload UI would not fulfill this task.

## Information architecture and screen contract

Add OWNER-only /crm/ai under Quản trị, label “AI & Knowledge”. Keep /crm/settings AI controls compatible, link to the dedicated workspace, reuse existing budget component. Desktop: compact sidebar and header; horizontal task tabs; main list/detail layout. Narrow screen: stacked detail, persistent labels, accessible tabs/table region; no duplicate navigation. Satsunic #163cff/#111c35, white/light gray, thin borders, system font. External design reference: enterprise density/clear hierarchy only; no third-party branding.

| Section | Primary contents and actions |
| --- | --- |
| Tài liệu | Search/filter by collection, type, language, processing state, approval state, expiry; filename/title, version, size, chunk count, published revision, updated time; upload and link existing Post/Blog sources. Cursor pagination, selection scoped to current authorized result set. |
| Chi tiết tài liệu | Original file metadata, safe extracted text, page/section provenance, versions and diff, duplicate hash, parse warnings, per-version status and effective dates; reprocess new draft, approve, revoke or archive. Original file private. |
| Context & phạm vi | Versioned profiles for customer Ask: chosen approved collections, language, topic/market tags, explicit priority, fallback when missing evidence, optional current catalog/order/conversation facts. Staff-only documents cannot enter customer profiles. Dynamic facts remain authoritative server projections and cannot be uploaded/overridden as policy. |
| Chia đoạn | Preview original section/page with resulting chunks, character count and estimated tokens clearly labeled, overlap, heading path, stable revision/chunk identity; reprocess creates a new generation and preserves active one until approval. No direct mutation of generated chunks. |
| Retrieval | Versioned lexical retrieval policy: topK, minimum relevance, source priority, duplicate suppression and source/context budgets, with explicit limits/units and effective version. v1 clearly labeled “Tìm theo từ khóa”; no semantic/vector claim. |
| Thử câu hỏi | Choose draft/published profile, enter benign test question, show ranked retrieved chunks, source/page/revision, score definition, excluded-source reasons, no-match/partial coverage and context byte budget. Retrieval-only default, no generation charge. Optional generated answer uses existing admitted budget and explicit action. |
| Hoạt động & ngân sách | Processing jobs/errors/recovery, upload/approve/revoke/config audit, retrieval latency/coverage counters without raw customer text; embed existing AI cap/reservations/expiry/kill switch. Unknown telemetry displays “Chưa đo”, not zero. |

## First release scope and bounds

Support TXT, Markdown, text-based PDF, DOCX. Proposed max2MiB/file,5 files/batch,100 documents total,100MiB retained original-file quota,50,000 extracted characters/document,200 pages/PDF,100 chunks/revision. Reject encrypted/corrupt documents, binary/type mismatch, archives, macros, executable content, external fetches and extraction over budget. DOCX ZIP internals are parsed with entry/inflation/path bounds; never fetch relationships. PDF scripts/links are not executed. Scanned PDF returns “Chưa đọc được nội dung chữ trong tài liệu này”; OCR is outside v1. Unicode and Vietnamese text preserved. Large unsupported files can be split by the uploader; never silently truncate an approved document.

These are proposed defaults, subject to approval and parser verification. No OCR, crawling external URLs, spreadsheets, embeddings/vector provider, automated knowledge authoring or production data migration in v1. A later semantic/hybrid retrieval phase requires its own reviewed model/index/privacy/cost envelope. Existing 50,000 VND trial is generation-only, not embedding or ingestion authorization.

## Ingestion and version lifecycle

1. OWNER selects file, collection, title/language and intended customer scope, confirms right to use and suitability for customer answers. Client validation is advisory; server validates independently.
2. Private upload through new bounded authenticated callable, following existing server upload pattern (max2MiB binary plus bounded Base64 JSON payload, AppCheck, verified Google, current unlocked OWNER). Storage client deny-all remains intact. No permanent download tokens/public URL. Server computes content hash and idempotent operation identity. Quota is reserved before storage write; unknown upload outcome is reconciled by operationId, not blind repeated uploads.
3. Create bounded Firestore processing job. Worker uses lease/version/fencing, checks object generation/hash/current OWNER authorization, extracts plain text under CPU/memory/page/ZIP/character limits. Data treated as untrusted. No model/provider needed for extraction or lexical indexing. Job timeout/failure state and explicit safe retry preserve same operation semantics.
4. Immutable document revision and generated chunks/index are written in bounded batches. Write a READY generation marker only after exact expected chunk count/hash consistency. Retrieval never consumes partially built generations. Orphan cleanup targets only owned unpublished generations with a separate reviewed retention policy; no autonomous destructive cleanup in this task.
5. OWNER previews extracted text/chunks, verifies customer appropriateness and effective dates, then approves exact document hash + processing config + retrieval profile version with recent MFA and expectedVersion. Publication switches an active pointer atomically. Reprocessing/editing creates a draft; it never changes currently active evidence in place.
6. Revocation immediately fences admission and invalidates context stamps, including requests already generating. Recheck revision/profile/ACL/expiry before answer publication. Previous revisions remain available for audit; activation of a previous revision requires fresh checks and explicit OWNER action.

States are separate: upload pending/uploaded; processing queued/running/failed/ready; approval draft/approved/revoked/expired/archived. The UI never merges READY with APPROVED or merely approved with currently active. Failed extraction of a new revision leaves old valid published revision intact.

## Data and security contract

Add isolated private namespaces: askKnowledgeDocuments/{id}, revisions/{revisionId}, chunks/{chunkId}, askKnowledgeCollections/{id}, askContextProfiles/{id}, askRetrievalPolicies/{id}, askKnowledgeJobs/{id}, and bounded operation/quota/audit metadata. Final paths/index shapes documented with schemas before implementation. Binary objects under knowledge-private/{documentId}/{revisionId}; generation/precondition metadata binds file to revision. Existing askKnowledge approvals retain v1 compatibility; introduce discriminated file-source v2 and dual-read validation, never rewrite existing approvals automatically.

OWNER-only management initially; reuse existing staffAccess/current lock checks, AppCheck, recent MFA on approval/revoke/policy activation and explicit auditing. No role grants or new IAM permissions. Documents customer-facing only if explicitly approved for customer scope. Internal-only documents can be stored/reviewed by OWNER but are never loaded into customer retrieval or generation. Scope is enforced before candidate retrieval and again before publication; prompt text is not an ACL. Do not upload customer contacts, receipts, private order exports or credentials as general knowledge. Order/conversation facts remain owner-bound, redacted, allowlisted server context.

No raw file content, questions, answers, object URLs, UIDs or secrets in operational logs; use opaque identifiers and numeric counts. Admin preview uses escaped plain text, never renders document HTML/JS. Downloads, if needed, through authenticated authorized bounded server response, no reusable public sharing URL. Recheck roles and document visibility before I/O. Quota reservations retained for uncertain outcomes until authoritative reconciliation; no budget reset.

## Chunking, retrieval and context

v1 defaults preserve current1,200 characters/chunk, overlap0, at most8 selected chunks. Admin ranges: chunk400–2,000 characters, overlap0–200 and less than chunk size; topK1–8. Preserve heading/paragraph/page boundaries when extraction provides them; DOCX locations are section/paragraph, not invented page numbers. UTF-8/Unicode boundary-safe, original text retained. Estimated tokens are a labeled preview; production uses existing exact provider count of the complete serialized request.

Revision+config-hash stable chunk identities; re-chunk is a new immutable generation. Term-posting index with Vietnamese normalization, bounded candidate retrieval and explicit coverage state replaces scanning unlimited full document bodies. No arbitrary regex/SQL/tool definition in admin input. Policy ranking scores are comparable only within the same algorithm/version and are not confidence percentages. Do not introduce semantic embeddings under a lexical label.

Existing 10,000 input-token /800 output-token /32KiB serialized request, <=8 evidence and <=6 recent turns remain hard code maxima. Editable policy can only tighten limits. Pack latest authoritative facts/task without truncating them; drop older turns and lower-ranked evidence first; fail closed if protected context alone exceeds budget. Source/citation IDs map to exact included chunks/revisions. Missing sources produce uncertainty, never invented policy. New approved-file source must participate in both deterministic approvedKnowledgeAnswer and generation server-context paths, with before/after current-version checks.

## File-by-file implementation plan

| File/module | Intended changes/functions |
| --- | --- |
| packages/domain/ask-knowledge.ts; new ask-rag.ts | Backward-compatible source v2, document/revision/job/profile/policy schemas, validated actions, expectedVersion/operationId, quotas/ranges and safe admin projections. |
| functions/src/ai/knowledge-admin.ts (new) | listKnowledgeDocuments/readKnowledgeDocument, uploadKnowledgeDocument, requestKnowledgeProcessing, approve/revoke/archive actions, private bounded download if needed; shared authorization and idempotency. |
| functions/src/ai/knowledge-processing.ts (new) | leased processKnowledgeJob, parse text/PDF/DOCX adapters, bounds, build revision/chunks/postings, ready-generation reconciliation and safe retry. |
| functions/src/ai/knowledge-retrieval.ts; knowledge-context.ts | approved-file candidate adapter, versioned lexical retrieval/chunk policy, deterministic provenance, coverage evidence and context hard bounds. Preserve existing Post/Blog paths. |
| functions/src/ai/approved-knowledge.ts; server-context.ts; ask-pilot-answer.ts | resolve approved file-source revision, collection/profile scope/expiry validation, citation allowlist and context stamp after generation. |
| functions/src/index.ts; src/shared/firebase.ts; actual callable mapping/preflight registry | Register only new required callables/worker and verify contract parity. No unrelated export/release changes. |
| firestore.rules; firestore.indexes.json | Deny direct private document/chunk/job access; only minimal approved admin access if source-verifiably necessary. Add only query indexes used by bounded callables. Storage rules remain deny-all through server upload. |
| functions/package.json; lockfile | Only PDF/DOCX parser dependencies needed after official-source/license/security/runtime review and pinned version selection; stop for delta approval if parser requires remote execution, paid service, new IAM or materially different runtime. |
| src/features/crm/Workspace.tsx | OWNER route/navigation for /crm/ai, lazy loading and existing access state handling. |
| src/features/ai-knowledge/ (new) | Library, document detail/upload, context/scopes, chunk preview, retrieval config/playground, activity; small modules and existing CRM patterns. |
| src/features/settings/Settings.tsx; KnowledgeApproval.tsx; AskPilot.tsx | Reuse existing knowledge/budget controls, introduce navigation to dedicated workspace, retain old route compatibility; avoid unrelated settings refactor. |
| tests/unit/ask-rag-*.test.ts; existing knowledge/context tests | File validation, lease/version/concurrency, revocation, scope, truncation bounds, context/citation/schema compatibility. |
| tests/http/ and tests/browser/ applicable suites | Actual upload→process→preview→approve→Ask evidence→revoke; real route and failures, OWNER/customer isolation and browser acceptance. |
| docs/plans/reviews/runbooks | Data lifecycle, operator recovery, limits, evidence/provenance, product-content review and release/rollback notes. |

## Acceptance, quality and rollout

A. OWNER uploads each supported valid format; sees immutable version, extracted text and correct provenance; unsupported/encrypted/scanned/oversized/corrupt/ZIP bomb/external relationship cases fail honestly without executing content.
B. No approved marker on partial processing; duplicate upload/idempotency, worker lease expiry/retry, same-version concurrency and quota races produce one durable logical result; no overwriting active revision.
C. Anonymous/customer/locked/revoked OWNER cannot manage/read originals or internal chunks; internal-only collection never leaks to customer retrieval. Adversarial document instructions cannot broaden tools/roles/money authority.
D. Same query shows actual selected chunks/scores/exclusions/coverage and model context version; approved-file citations point to included exact revision; expired/revoked/replaced data not published even when change occurs during generation.
E. Profile/config save is versioned/audited; invalid bounds cannot bypass generation budget/context or authorization. Existing Post/Blog approvals and deterministic/customer Ask flows pass regression.
F. Accessible upload picker (keyboard alternative to drop), progress, errors and retry, empty/no-result/unavailable distinction, long Vietnamese names, narrow390/wide1440 views and200% zoom; full eight-principle product-content review with current rendered evidence.
G. Node22 typecheck/lint/relevant full unit/helpers/rules/HTTP/restore/audit/build gates and fresh final review; no ready claim from prototype or mocks.

Quality profiles: TypeScript/JavaScript, web, API, database, concurrency, security, performance, observability, agent-runtime/evaluation and product-content. Risk HIGH: private document handling + untrusted parsing + approval/retrieval integrity; MEDIUM: admin UI. Main regressions: legacy source schema, bounded retrieval latency/cost, stale grants, duplicate jobs, chunk coverage/provenance and context changes during model I/O.

Implementation starts locally in isolated checkout after this plan approval. Do not restart/reseed shared5207 or start duplicate servers. No production uploads, secrets, IAM changes, backfills or deletion. Preserve existing50,000VND trial and canary/customer gates as a separate task. Native production release of RAG requires a concrete tested candidate and explicit release approval; this plan does not broaden the earlier release approval.

Rollback: turn off only new file-source admission/profile; keep Post/Blog behavior and existing evidence; revert active policy/revision pointer with version checks through authorized action. Retain files/revisions/jobs for review. Code rollback through native immutable release, no direct production datafix.

## Open decisions and proposed defaults

- First release lexical retrieval plus real ingestion/provenance; semantic/hybrid embedding later with separate provider/budget approval.
- Formats TXT/MD/PDF text/DOCX;2MiB/file. No OCR or spreadsheet ingestion initially.
- Management OWNER-only; no new staff roles.
- Parser packages pinned only after source/license/runtime/security verification; no silent installation before reviewed implementation approval.
- Retention/purge and wider file limits require owner policy; no permanent delete in v1.
- Product-content/in-context/accessibility verification NOT_RUN until rendered implementation/prototype exists. Planning complete does not equal product accepted.

Approval requested: “Approve ASK-RAG-ADMIN-20261010 v1” for the local implementation and validation scope above. Token usage/cost Unavailable. Memory candidates: None.
