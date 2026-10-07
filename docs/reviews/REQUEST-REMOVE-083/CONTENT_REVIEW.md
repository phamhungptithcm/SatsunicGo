# REQUEST-REMOVE-083 product content review

Vietnamese web request form; user approval removes CSV disclosure/file picker and visible Món hàng section title. CSV domain parser/tests retained for other consumers. Step navigation label Món hàng retained. Heading remains visually clipped at step0only, preserving ref/focus/accessibility; headings at later steps unchanged. Existing product fields, composer image uploader and add-item control retained. No auth/API/data contract change.

Inventory removed: Nhập nhiều món bằng CSV; Nhập CSV; file chooser accepting CSV; CSV import error message and its import-only handler. Món hàng heading removed visually, retained semantically; no new user strings. Input/upload/error/pending/frozen/unauthenticated field behavior unchanged. Actual anonymous form rendered with Firebase unconfigured in isolated preview; no backend submission. CSV selector count0, heading computed clip inset50%, add-item click increased count1to2. Current desktop1280/mobile320 screenshots. Existing320px form composition remains cramped; this task does not redesign mobile form. Actual AT, full wizard submission and authenticated backend NOT_TESTED.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Removes explicitly unwanted bulk upload and duplicate visible heading |
| Agency | PASSED | Manual add/edit controls preserved and add-item observed |
| Responsibility | PASSED | No upload promise, error/success or transaction guarantee added |
| Familiarity | PASSED | Existing step labels and field labels retained |
| Flexibility | PASSED | Semantic focus heading retained; current mobile/desktop content inspected |
| Simplicity | PASSED | CSV and redundant title gone visually |
| Craft | PASSED | In-context rendering, computed clip and CSV absence inspected |
| Delight | PASSED | Less clutter without new distraction |

Web platform conventions/native controls preserved; bundled human-interface principles reference used, no Apple compliance claim. Meaning/actions, natural Vietnamese, state coverage, privacy/data semantics, localization/terminology and in-context gate PASSED within scoped checks. New locales/motion/data displays NOT_APPLICABLE. Header removal does not remove field labels. Product Language Gate PASSED.
