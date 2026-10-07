# Content implementation handoff r2

Owned slice complete; application edits stopped after this handoff. Scope approved by team lead under E2E005. Parent owns shared ContentRow.publishAt and notification index. Team context revision2.

Fixed: schedule inputs restore local time and unchanged timestamps retain seconds; exact-payload failed-response retries retain operation key; changed payload generates new key; CMS kind switch and unmount reject old loads/saves; bounded pagination consumes next cursor and deduplicates append; success clears upload binding; campaign new form resets on success. Notifications query newest30, clean previous account/error, cleanup late callbacks/mutations, loading/retry, typed membership routes and safe unknown fallback without undefined order links. Existing permissions/provider contracts unchanged.

Verification: scoped ESLint PASS; new four meaningful unit tests PASS. Initial full tsc failed due concurrent order-media.ts:249 possibly undefined parsed.data (not owned). Fresh final npx tsc --noEmit PASS after concurrent owner fix; no emulator started, no browser/provider verification. Unit tests prove helper behavior only, not mounted UI or backend delivery.

Shared remainder: notification ownerId ASC + createdAt DESC index requested and assigned CRM owner. Shared publishAt field confirmed added by lead. Event coverage beyond membership/orders/refunds remains lead/CRM scope; jobs recovery is lead-owned. No backend/shared files edited.

Product content review: see content-product-review-r2.md. Rendered principles remain NOT_RUN; do not claim successful language gate.

Source SHA256:
- src/features/content/ContentEditor.tsx: 93f167f537a3173bbf6dc7e77f77c106374bf735163046fa7ac27f1278c311d4
- src/features/content/Campaigns.tsx: 763768bb0154fe18387ecd100a8dcff848a4ee64eb0fb3a9dfb55ebd892a64b7
- src/features/content/editor-state.ts: 0343138af48443c363f00704327e61a53b5035f40a420ec2cc8ea8ce48939c55
- src/features/content/notification-target.ts: 122e9365b0bd19c7fc8cc532756ce555a5b00e9b14d8dcec3203194d0839c8b8
- src/features/notifications/Notifications.tsx: 7af54d1f7c424078c6416d2b0c08129ddc44f01ddd551a4e14270ff2a9da0a8d
- tests/unit/content-editor-state.test.ts: e42fcfbd6a9133ff25520d878ab4a7b04c25d700e79bce899863cd4557782dbb
