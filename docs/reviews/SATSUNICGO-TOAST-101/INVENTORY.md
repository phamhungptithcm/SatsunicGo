# Feedback inventory

Source search covers src/**/*.tsx plus native alert/notification calls under src/**/*.ts. No window.alert calls found. Initial reviewed plan had 69 candidate files; expanded role/class scan records 191 retained inline nodes across 72 files, including new/concurrently changed source. Each node has a concrete source excerpt and keep decision in INLINE_INVENTORY.json. Parent nodes include nested confirmations/actions; they are counted once. This is source coverage, not end-to-end proof of every business workflow.

## Converted transient receipts

- `src/features/auth/Security.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/ask/InlineSupport.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/profile/Profile.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/crm/Activity.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/crm/Customer.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/support/Thread.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/support/OrderConversation.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/orders/Changes.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/content/ProductReviews.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/content/ProductReviewModeration.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/content/WebsiteBanners.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/content/Campaigns.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/content/studio/StudioEditor.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/shipping/Shipping.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/shipping/ShippingRates.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/shipping/Consolidation.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/invoices/Documents.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/settings/StaffAccess.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/settings/Settings.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/membership/Membership.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/membership/PlanEditor.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/membership/ReminderSettings.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.
- `src/features/payments/Finance.tsx` — guarded saved/sent/copy feedback; persistent local recovery retained.

## Special decisions

- Public auth: one safe error toast for One Tap, redirect/popup and sign-out failures; remove duplicated root banner. CRM retains contextual login/access recovery. No MFA/enforcement change.
- Dashboard: only a complete current all-zero sample produces info; unknown/null/truncated and obsolete requests do not.
- Studio autosave: keep quiet toolbar saving/saved status; toast only explicit save and publication actions, not every automatic save.
- Campaign/invoice clipboard: success/failure toast; epoch/revision guards suppress notifications after unmount/context change. Clipboard contents remain outside notification text.
- Thread/order changes/outbox: acknowledge server acceptance only; keep uncertainty, retry identity, permission and stale-read notices.
- TransferNotice, Finance done views, financial review and shipping support sent view: preserve durable replacement state/next-step links; these prevent repeat submission or explain reconciliation, rather than repeating a disposable alert.
- Request recovery, imports, catalog/notification empty or failed-read screens, review moderation policy, publication/privacy qualifiers and hold states remain near relevant data/actions.
- Existing BlogToast hooks already provide portal feedback; preserve them, fix pending lifetime reset and add focus restoration/touch targets. No mass replacement of ARIA statuses.

## Ownership

App/header, CRM headings/filter panels, Home market images and other shared modifications belong to concurrent approved tasks. Pre-edit snapshots under /private/tmp/toast101-before were used to preserve these hunks; no release, reseed or runtime restart was performed. Whole-file candidate hashes include shared WIP and are not a standalone release commit.
