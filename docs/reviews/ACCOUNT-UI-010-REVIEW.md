# ACCOUNT-UI-010 — local preview review, 2026-10-04

Scope: customer account workspace under approved E2E005 UI scope and direct redesign request. Shared worktree; no production release or commit in this task. Repository intelligence: DEGRADED bounded source/compiler/browser evidence.

## Changes and content inventory

| Surface/state | Content and verified meaning |
| --- | --- |
| Navigation | Đơn của tôi / Vận chuyển / Thông báo; distinct existing private views. Hồ sơ và địa chỉ / Bảo mật tài khoản retain existing routes. |
| List | Theo dõi món hàng bạn đang chờ.; Yêu cầu mới; actual name, market, date, quantity, stage. Hiển thị tối đa 50 đơn trong tài khoản. bounded listener, not exhaustive history. |
| Detail | ← Tất cả đơn của tôi; actual order title; Tổng quan / Ảnh & chứng từ / Lịch sử & tiền. Separate panes retain entered drafts. |
| Requested | Đã nhận yêu cầu của bạn; staff clarification/quote next step, no payment required. Suppressed when held. |
| Hold | Tạm giữ plus actual server reason, visible regardless of pane. |
| Loading | Orders/shipments retain loading until snapshot/error; history says Đang tải lịch sử… and disables print until loaded. |
| Empty/error | Existing account errors and private access boundaries preserved. Missing selected order says Chưa tìm thấy đơn trong danh sách rather than claiming nonexistent. History supports Thử tải lại. |
| Financial | Quote heading distinguishes acceptedAt; statement remains internal/non-tax, confirmed entries only. Existing financial controls unchanged. |

## Human Interface principles

| Principle | Evidence |
| --- | --- |
| Purpose | One customer task per view, detail anchored to actual order. |
| Agency | Native links/buttons; back navigation, explicit secondary actions, drafts retained across panes. |
| Responsibility | Actual hold reason remains visible; no fabricated tracking, success, payment or acceptance. |
| Familiarity | Web navigation, visible headings, conventional native controls; Vietnamese labels. |
| Flexibility | Browser evidence desktop and 320/390px; keyboard Space switches pane; drafts survive switches. |
| Simplicity | Compact list opens detail; files/history no longer dominate every list row. Ask starts collapsed. |
| Craft | Current desktop/mobile screenshots, thin separators, readable navy/blue hierarchy; no horizontal overflow at 390px. |
| Delight | Short opacity/4px translate reveal; reduced-motion stylesheet disables it; retained panes avoid destructive remount. Actual low-device frame timing NOT_TESTED. |

Platform: Apple-inspired human-centered quality on web, Satsunic brand preserved; system fonts and ordinary web controls, no Apple assets copied. Current Apple online HIG page was JS-only, so current formal HIG compliance is not certified.

## Review cycles

1. Found full-workspace suspense flashes, draft remount loss, initial false empties, hidden hold warning, premature accepted-quote wording, print-before-history-load, weak metadata contrast and global heading override. Fixed within presentation scope; reviewed conditional behavior and browser retention/loading/hold visibility.
2. Current scoped ESLint, TypeScript and git diff --check passed. Browser local demo confirms held warning survives history view, history loading disables print, requested hint absent on held order; separate views, desktop screenshot and mobile390 screenshot observed. Earlier shared public.ts compiler failure is resolved in latest compiler run.

## Limits and completion

Local redesign implemented and rendered; overall Product Language/final production handoff remains BLOCKED pending text-scaling/full assistive-technology and broader first-go-live acceptance. No transaction/auth/provider outcome certified by this preview. No FPS, real One Tap, AppCheck, payment, email or AI production acceptance. No deploy/push. Shared unrelated WIP preserved. Production readiness NOT_READY. Runtime reporting adapter not available in this root task: manual evidence only; provider token usage and actual/API-equivalent cost Unavailable. Memory candidates: None.

Evidence: /tmp/satsunicgo-account-010-desktop.jpg; /tmp/satsunicgo-account-010-mobile.jpg; compiler session65795 exit0; git diff --check exit0. Synthetic local emulator data, not production customer data.

Current scoped source fingerprints:
```json
{
  "src/app/App.tsx": "788bb0bf787f6022468eef616b1fa9838eda4093f5cd2a6c00ab2ee404b9e06e",
  "src/styles/account.css": "d5658f87b4a3174af0e5dacb340991b60b1353f754c648d9eca21160bb21756c",
  "src/features/orders/OrderTools.tsx": "14e81191064ee436c7a90683ab1996cde3bea9eebab0ce98fa9ed6bfc785d6b0",
  "src/features/orders/OrderImages.tsx": "2a28cb95b15d2d3810f9c6059e064fa76b237929a601bcc23cb9ff8ab3dce89b",
  "src/features/notifications/Notifications.tsx": "1fcce3964b79c0b17a352380bda1495d889def249c5612638b7832027b20cc1e"
}
```
