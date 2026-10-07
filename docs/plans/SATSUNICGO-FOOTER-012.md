# SATSUNICGO-FOOTER-012 — Pending approval

Request: align footer with widened homepage, reduce height, remove pending-policy label, replace market tagline with copyright under brand.

Intelligence: DEGRADED as in task 011; bounded source evidence. Verified SiteFooter in src/app/SiteChrome.tsx renders market tagline plus a separate footerBottom policy notice. public-ux.css uses a 1200px footer width through viewport padding and reserves 112px/76px bottom space for fixed Ask composer/launcher.

Approved proposal pending human review:
- src/app/SiteChrome.tsx, SiteFooter: replace `Mua hộ Mỹ · Nhật · Hàn` with `© {current year} HunpeoLabs.`, directly below brand/by attribution; remove footerBottom including `Phí và chính sách thương mại đang chờ xác nhận.`. Keep support/legal links.
- src/styles/public-ux.css: footer horizontal padding aligns with homepage's 1280px container minus its 32px inner padding. Above 1280px, calculate padding from the approved fluid cap `50vw + 640px`; reduce normal vertical padding 24px to 16px and inner gap to 16px; remove obsolete footerBottom overrides. Keep safe clearance for fixed Ask dock, since removing it would obscure footer links. Preserve mobile 18px horizontal padding, with compact 16px vertical padding.

Risk: low, shared footer visual/content only. Removing notice does not certify commerce readiness; no fee rules, policy pages, auth, data or runtime change. Copyright uses existing HunpeoLabs attribution, without adding legal promises.

Validation: local rendered footer desktop 1920/1440 and mobile 390/tablet 768; measured alignment, no horizontal overflow, visible links above Ask; current year rendered and removed strings absent; scoped formatting and TypeScript check; product-content review and final review. No deployment. Preserve unrelated WIP.

Rollback: revert only footer JSX and scoped footer CSS delta.
