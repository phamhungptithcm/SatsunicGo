# Product Content Review — explicit catalog continuation

## Scope and context

Vietnamese/English web Ask Anything; customers search by name or purpose and inspect listed price/variant before an explicit purchase. Root review, 2026-10-06. Changes: Ask.tsx branch and domain catalogBrowseIntent; no string additions. Existing heading, loading/partial/error/stale text becomes reachable before AI for an explicit incomplete search. Web controls and named buttons apply; Apple-platform HIG compliance is not applicable.

Verified source: an initial search checks up to 500 public products. Empty partial results mean incomplete search, never global absence. CatalogSearch performs bounded continuation, discloses loading and remaining results, offers manual continuation and retries. Search previews do not persist private turns or create orders. Custom-buy questions still obtain a model draft and require explicit submission. Prices are rechecked by authoritative checkout.

## Content inventory and states

| State/location | Existing content and meaning | Current evidence |
| --- | --- | --- |
| Answer heading | “Sản phẩm phù hợp” / “Matching products”; identifies the search task, not a claim that rows already matched | Original beyond500 native3/3 reaches heading then actual requested product at390/768/1440 |
| Loading | “Đang tìm tiếp trong danh mục…” / “Searching more of the catalog…” | Wired CatalogSearch state; Native continuation-states round2 actual partial pending heading/loading and no premature Buy; four cases PASS |
| Partial empty | “Chưa thấy sản phẩm trong phần đã kiểm tra. Có thể tìm tiếp.” / matching English qualification | Source verified; custom partial fault test asserts no global-absence claim; explicit partial pending native now observed in continuation-states round2 |
| Success | Product name, listed total and variant; explicit “Chọn mua” | Native3/3 actual matching purpose, price/variant and enabled explicit confirmation; zero AI/implicit writes |
| Error/recovery | Retained question and retry; “Chưa tải thêm được sản phẩm. Thử lại khi có kết nối.” | Public pending read fallback native PASS; continuation-states round2 actual failure → native retry → actual SDK success PASS |
| Offline/stale | Previous content and checkout price recheck qualification | Source verified; offline native not run in this delta |
| Unauthorized | No private data in public lookup; private/custom actions retain existing auth checks | No role changes; backend/privacy acceptance belongs to whole candidate |
| Confirmation/destructive | No new destructive action; purchase confirmation remains explicit | Custom fallback normal native verifies zero orders before submission and exactly one linked order after explicit submission |

## Data semantics

Public published products only, bounded memory TTL; no identity/order cache. Empty partial differs from exhausted empty. No ETA or availability promise is added. Existing synthetic fixtures provide local behavior evidence; AI success in fallback is disclosed synthetic, private command persistence is real emulator. Catalog SDK reads cannot be canceled internally; consumer abort and late-cache guards prevent obsolete UI/model/private writes.

## Mandatory principles

| Principle | Status | Evidence / remaining limit |
| --- | --- | --- |
| Purpose | PASSED | Beyond500 actual requested product remains reachable without AI |
| Agency | PASSED | Explicit purchase; cancellation native prevents model/obsolete writes |
| Responsibility | PASSED | No false absence, implicit order or changed checkout authority |
| Familiarity | PASSED | Actual named textbox/buttons/product links in all three widths |
| Flexibility | PASSED | Native390/768/1440; manual continuation source retained; manual AT not tested |
| Simplicity | PASSED | Explicit search reaches catalog panel directly, custom buying preserves existing draft flow |
| Craft | NOT_RUN | Pending/error/retry and close/UID supersession observed in native4PASS; offline and complete bilingual/manual accessibility matrix remain unverified |
| Delight | NOT_RUN | Actual retry and close/UID obsolete-result protection PASS; all-state smoothness/offline remain unverified |

Platform fit is bounded web-native evidence. Overall Product Language Gate remains BLOCKED pending the required untested states; eleven passing native cases are not whole-product, visual-parity or production certification. Receipts: catalog-continuation-native-round1 (3), catalog-fallback-after-continuation-native (4), catalog-continuation-states-native-round2 (4, final visibility fence), focused units15 and scoped lint PASS. Latest root full run remains interrupted.
