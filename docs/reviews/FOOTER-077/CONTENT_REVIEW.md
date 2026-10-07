# FOOTER-077 Product Content Review

Scope: shared SiteFooter, Vietnamese web, customer information/support navigation. Approved 2026-10-06. Existing labels, destinations and copyright/year expression unchanged. Logo/attribution retained. Footer legal copy moves to a secondary row. No metrics, private data or unsupported business claims.

Inventory: SatsunicGo → /; by HunpeoLabs; Hỗ trợ → /support; Quyền riêng tư → /privacy; Điều khoản & hoàn tiền → /terms; Hàng hạn chế → /restricted; © current browser year HunpeoLabs. Semantic nav label remains Thông tin và hỗ trợ. DOM inspection confirms routes unchanged. No new locales/strings.

Applicable states: default, wrapping at320/768/1280, hover, keyboard focus. Error/loading/pending/empty/forbidden/destructive states NOT_APPLICABLE to these static links. Focus solid outline observed on Hỗ trợ. Mobile links44px tall; no horizontal overflow. Native anchor/React Router semantics retained. Motion: no added animation; existing color transition only. Privacy/data/API/auth/observability semantics unchanged.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Existing support/legal links easy to find |
| Agency | PASSED | Native explicit links, no automatic action |
| Responsibility | PASSED | No business claims added; existing legal labels retained |
| Familiarity | PASSED | Standard branded footer and nav |
| Flexibility | PASSED | 320/768/1280 no overflow, wrapping and44px mobile links |
| Simplicity | PASSED | Compact brand/navigation row and secondary copyright |
| Craft | PASSED | Current screenshots, DOM routes and keyboard focus |
| Delight | PASSED | Calm spacing and subtle separators match enterprise brand |

Web platform fit, meaning matches behavior, natural Vietnamese, action/state coverage, terminology, data/privacy and in-context verification PASSED. Apple HIG principles used as bundled web quality reference; no Apple-platform/current HIG claim. Actual AT and zoom NOT_TESTED, no new text or complex interaction. Isolated preview uses verbatim current SiteFooter function extracted from source with actual global/public-ux styles and BrowserRouter; adjacent page is fixture, not authenticated app. Production runtime NOT_TESTED.

Decision: Product Language Gate PASSED within scoped web navigation checks.
