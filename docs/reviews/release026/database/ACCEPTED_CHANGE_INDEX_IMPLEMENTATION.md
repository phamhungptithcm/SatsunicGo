# CQ026 exact index implementation

Root before-complete authorization received after reported native5 before failures and preserved rules11. Tracked PLAN.md CQ026 and HARDENING-026 approval include this exact index. Only firestore.indexes.json changed by database.

Added one COLLECTION orderChanges composite: state ASCENDING, reviewedAt DESCENDING, __name__ ASCENDING. JSON readback assertions passed: all 21 prior entries preserved in order, exactly one new matching entry, fieldOverrides and other top-level fields unchanged.

Index SHA256: 806a5fbbb9627c2492a01d7b744f0e76fcad486c9ea3ba3b1148f7024f677c3b.

Backend query was still being implemented at initial readback. Fresh source crosscheck completed after backend freeze: workspace SHA256 45257ae426d66c4035516ee808192393e11a416ec661fb04b5fe0f6c99e135ff, matching the root handoff. Exact optional accepted-only branch matches index: state equality, reviewedAt DESC, document name ASC, limit31; rows slice30, next uses last displayed row only if size>30. Cursor loads the document, rejects missing/nonaccepted/nonpositive or unsafe integer reviewedAt, then startAfter(snapshot) uses both ordered fields. Filter-kind validation disallows changeState on other kinds. OWNER/OPERATIONS_MANAGER and strict active/roles/locks remain before query. Legacy no-changeState branch retains original limit30/order selection, BUYER assignment paging, ID/stage/hold filters and existing next logic.

Read cost bound from source: accepted first page materializes two authority docs plus up to31 queue docs; cursor page adds one cursor document. This is not billing or measured latency evidence. Pagination is a live view: applied/deleted cursor becomes invalid and requires reload; cross-page concurrent changes are not a snapshot-stable full export. Date-malformed rows may appear yet be rejected as later cursors; source canonical accepts stamp reviewedAt but historical data integrity is UNKNOWN.

Runtime runners NOT RUN by database. No rules, schema, migration, datafix, deployment or provider operations. Missing reviewedAt on historical accepted data remains UNKNOWN production data-quality gate; index declaration does not certify deployed availability. Production NOT_READY. Memory candidates None.
