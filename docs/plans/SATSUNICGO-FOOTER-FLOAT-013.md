# SATSUNICGO-FOOTER-FLOAT-013 — Pending approval

Requirement: Ask is a floating box and may overlay the page; do not reserve footer space for it.

Source evidence: src/styles/public-ux.css reserves footer padding-bottom 112px for body[data-ask-dock="composer"] and 76px for body[data-ask-dock="launcher"]. Normal footer padding is 16px. Existing repository intelligence remains DEGRADED; bounded exact source lookup used.

Smallest change: remove both Ask-specific footer padding rules from src/styles/public-ux.css. Preserve normal 16px footer padding, existing fluid width, copyright, links and Ask positioning. No other CSS, runtime, data or auth changes.

Trade-off explicitly requested: floating Ask can overlap footer content while expanded; user can collapse it. No dedicated page space for the overlay.

Validation: desktop/mobile rendered footer with expanded and collapsed Ask; computed padding-bottom stays 16px and no horizontal overflow; scoped formatting, product-content review and final review. No deployment. Preserve unrelated WIP.
