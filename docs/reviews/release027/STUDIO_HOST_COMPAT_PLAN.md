# Studio host compatibility delta

Date: 2026-10-06. Owner: studio_host_parity_fix. Existing explicit user approval: copy the original Studio completely and fix the approved UI defects. Source edits remain paused until the root coordinator releases the native-run source freeze.

## Intelligence and bounded impact

The actual repository intelligence check returned DEGRADED, ready=false. Optional index health/currentness is insufficient; targeted native source inspection is used, without indexing or claiming complete graph coverage. Relevant gate, existing-system workflow, product-content profile and write-product-content skill were read. Repository map/build-command context are placeholders; package.json verifies React 19, Vite, TypeScript and ESLint.

Studio is rendered directly by Workspace's dedicated Studio branch, outside workspaceShell/workspaceContent. SourceStudio imports the byte-preserved source-design.css. StudioShell owns the blog-surface wrapper; account is embedded under that wrapper. The new compatibility import will therefore be scoped to blog-surface and cannot change the normal CRM panels.

Verified original dependencies: /private/tmp/release027-original-studio-reference/styles/tokens.css and globals.css. Original source account CSS uses color-accent, color-accent-dark, color-text, color-muted, color-line and font-sans. Those dependencies are absent from the Go host, causing invalid account CTA background declarations. Original tokens use accent #173df5 and Arial/Helvetica Neue/Helvetica/sans-serif. The original source-design palette/font remains independently defined and must not be replaced.

Verified host leak: Go global.css .panel adds padding:28px (responsive variants also apply). Original .blog-surface .panel defines background, border, radius and overflow, but no padding. Original dashboard expects zero outer panel padding, with spacing owned by panel-top/list-controls/cells/panel-footer.

Additional verified host leak: Go global .eyebrow sets display:inline-flex and margin-bottom:20px; the source dashboard uses an ordinary div and original source-design does not set either property. This changes its baseline and displaces the title. Go global .muted adds font-size:13px and line-height:1.6, while original source-design owns only the muted color. Restore only missing dependency defaults. Table font differences still require actual computed-style comparison; do not invent h1 or strong overrides.

## Smallest implementation

1. Add source-host-compat.css with original token dependencies scoped to .blog-surface, preserving source-design's --radius and own palette/font. Bind only referenced original token values, plus original global text-rendering behavior.
2. Restore zero outer padding for .blog-surface .panel; preserve original inner spacing and responsive rules.
3. Preserve source-design's explicit SVG display:inline-block; do not reproduce an earlier globals declaration that the original component stylesheet intentionally supersedes.
4. Restore original block/zero-margin eyebrow and inherited muted typography defaults. The textual import before source-design in SourceStudio does not prove effective CSS load order: source-shell transitively imports source-design first. Preserve existing imports and limit compatibility to missing properties. No original CSS/module/harness/generated-file edits.

No business strings, contracts, persistence, authorization, services, fixtures, animation logic or global selectors change. No dependency installation. Rollback removes the import and new stylesheet. Stylesheet remains loaded after route exit but has no effect outside blog-surface.

## Validation and content gate

No runner or global compiler while root native tests are active. Root performs native paired captures at 390/768/1440 for dashboard/account/editor/preview, actual CTA color/focus, keyboard and overflow checks. Scoped import ESLint may run only with coordinator clearance; full typecheck is root-owned. Hash original CSS before/after; freeze new stylesheet and importer hashes. No pixel masking, fixture substitution, baseline acceptance or 100% claim.

String inventory: no added/edited string. Existing account Mở Studio CTA/default/hover/focus and dashboard headings/table text retain original content and mechanics. Purpose, Agency, Responsibility, Familiarity, Flexibility and Simplicity preserve source semantics; current rendered verification is NOT_RUN for this delta. Craft and Delight are NOT_RUN pending paired native evidence. Target is the existing web Studio; no Apple-specific compliance claim. Full Product Language Gate and successful final handoff remain BLOCKED until root records current in-context evidence for all applicable principles/states.

## Implemented freeze and source validation

Root released this bounded implementation after its serial diagnostic completed. Compatibility's .blog-surface .eyebrow/.muted specificity (0,2,0) outranks Go global .eyebrow/.muted (0,1,0). The earlier claim that textual import order guarantees subsequent original selector precedence was incorrect: source-shell imports source-design first, so module deduplication can place compatibility later. No h1/strong/table override was introduced. Account module selectors and all source-design responsive/focus/reduced-motion rules remain byte unchanged.

Scoped ESLint SourceStudio.tsx: PASS. Scoped Prettier check new CSS/importer: PASS. Native/browser and full typecheck: NOT_RUN by this agent, root-owned. No business string/action changed; in-context principles remain pending as above.

Frozen SHA256:

- source-host-compat.css: 342099b347a8bac4b8448dc1e462e883e5f81fea83fd251c39daff8b24881574
- SourceStudio.tsx: 994b0e9469bf0b863b057be4770afd0fe76c6773209a64224c9d9f128cf2d8f2
- Preserved source-design.css: 79a96f1ccbb232c3cef5275a54cf0c129ea25c4b95eb70090e7bd7647e26d834
- Preserved source-account.module.css: a3173efb6f0fe1be32b8bbbec3bf3ed9e220072735707bf58ae7da1e10f7e488

Candidate-specific final visual and independent review remain NOT_RUN; this scoped validation does not certify whole Studio parity or production readiness.

## Observed preview container delta

Root archived actual geometry in studio-preview-geometry-round1: original at390 has a348px container with21px side margins and390px document scroll width; Go has a390px container plus those margins and432px scroll width. At768 Go's768px container plus25px margins produces793px scroll width; original has no overflow. Compiled Go Tailwind .container sets width:100%, while original source-design sets max-width/margins and relies on ordinary block width:auto. Existing user approval and the root's recorded delta plan authorize a single scoped .blog-surface .container width:auto rule. It restores original geometry rather than hiding overflow. No original files, fixtures, business semantics or global selectors change. Root owns the subsequent three-preview native verification.

Current compatibility stylesheet SHA256 supersedes the earlier freeze: 854e01d2019374b14fb7f1e0e6b25e693f5e2a102441f86f5245cd48eceb600c. Scoped Prettier check PASS. Importer and preserved original files remain unchanged. Three-preview native rerun NOT_RUN by this agent.

## Planned SVG correction after independent review

Root reports actual editor height +101px with checklist icons occupying separate lines. Source verification confirms source-shell.tsx:4 imports source-design before SourceStudio's compatibility import; source-design.css:2862 explicitly sets .blog-surface svg display:inline-block. The added compatibility display:block rule has equal specificity and can override that original rule. This was an implementation mistake. Smallest correction: remove ONLY compatibility's SVG rule; preserve original imports, original stylesheet, fixture and business checklist. No import-order workaround, global reset or overflow masking. Root native runner is active; source editing remains paused until root releases the freeze. Root owns repeated native editor geometry and screenshot verification.

Root released the correction after its six-case native run completed. Approved refinement before editing: lower eyebrow/muted fallback specificity to :where(.blog-surface) .eyebrow/.muted (0,1,0), matching Go global selectors and overridden by original component selectors (0,2,0) independently of effective module order. Current later compatibility order overrides the global defaults; original explicit .eyebrow font11, .small font12 and discussion muted font rules always win. Preserve tokens/panel/container/imports. This addresses the verified source-moderation.tsx222 eyebrow+muted combination without an inline font override. Root owns full native63 validation; this agent does not certify it.

Implemented exactly the approved refinement; scoped Prettier PASS. Current stylesheet freeze a8b0e2ff0f48170dc5b3bc1558506641f86d0c5bc51efe7765c29124de60ea6d supersedes both earlier hashes. Importer994b0e94, original design79a96f1c and original accounta3173efb remain unchanged. Fresh native/editor visual proof NOT_RUN by this agent; no successful final parity claim.

## Author heading fallback delta

Root's current native63 completed57PASS6SKIP; independent rendered review observes the original preview author-card h3 bold versus Go normal. Original source-design owns h3 margins/line-height but leaves weight to the browser's bold heading default. Go Tailwind preflight assigns headings font-weight:inherit. Root recorded and approved a bounded stylesheet-only correction before edits: :where(.blog-surface) h3 {font-weight:bold}, specificity(0,0,1), restoring the original fallback while every explicit component weight remains higher priority. No unproven font-synthesis change, original/module/import edit, fixture adjustment or broader reset. Root owns three paired preview reruns with actual computed heading proof.

Implemented the single approved h3 fallback. Scoped Prettier PASS. Current compatibility freeze23ddeae97327d4d5c6321cc213d2f628c750a87e10574b52728536a9f2771cce supersedes prior hashes. Importer and original files remain unchanged. This delta's paired computed/native proof remains NOT_RUN by this agent.

## Read-only assessment: blanket browser-default restoration

Request: assess :where(.blog-surface *) { all:revert } before any implementation. Current stylesheet remains frozen23ddeae9. No source edits or browser checks authorized for this assessment.

Verified cascade: specificity-zero unlayered fallback outranks normal layered Tailwind preflight/utilities, while original unlayered class/tag selectors and inline styles remain higher priority. Custom properties, direction and unicode-bidi are not reset by all. Existing unlayered Go .panel/.container/.eyebrow/table rules still win where applicable and need the already verified compatibility remedies. Source-design explicitly owns sr-only clipping, component layout, dialog widths/borders/padding, SVG display, rich-editor formatting and image resize controls. Source-dialog portals supply their own blog-surface ancestor, so the proposed selector reaches dialogs; menus whose DOM sits outside this ancestor are not automatically reached. Source toast styles can be unprefixed and would win by class specificity when inside scope.

Observed source dependencies: schedule-picker uses sr-only plus actual hidden attributes; diagram editor uses hidden for inactive code mode; source-editor uses hidden file input. Tailwind hidden rule is important and is not overridden by a normal all:revert declaration. Native dialog showModal/top-layer state and focus lifecycle are imperative and unchanged, but all unowned UA dialog/layout/form properties would change and need native coverage. Tiptap resizer writes geometry/position via inline styles, which win; ProseMirror dynamically injected class rules win, but descendant properties left to the preflight or presentation attributes do not. Bounded JSX scan found semantic class names rather than obvious Tailwind spacing/grid/typography utility dependencies in the current Studio entry path; this is not a full computed dependency proof.

Material reason to reject the blanket proposal as currently stated: source-ui.tsx BlogIcon sets SVG width/height, fill=none, stroke=currentColor, stroke-width and line caps/joins as SVG presentation attributes. These participate in author cascade at specificity zero before stylesheets. A later specificity-zero all:revert can override those presentation declarations, restore UA fill/stroke/dimensions, and break icons/art; original source-design's SVG display/max-width does not restore the lost attributes. Original art/path presentation fills/strokes are also at risk. Thus preserving explicit class rules alone is insufficient to preserve the original rendering. A selector excluding SVG subtrees could reduce this risk but introduces a wider contract and still requires checking other HTML presentation attributes, injected components and dialogs.

Recommendation: do not implement all:revert as proposed. Inventory the actual preflight-reset properties needed by this original Studio (ordered/unordered list markers and indentation are now observed), then use a scoped specificity-zero PROPERTY fallback that leaves SVG painting/geometry, author inline styles and explicit component declarations intact. If broader isolation is still preferred, first capture original/Go computed properties for icons/art, lists, form controls, hidden states, native dialogs, Tiptap tables/images/resizers and focused/selected states; define an explicit allowed property set or isolated stylesheet boundary. No font-synthesis change without actual computed evidence. Root decides and records any source delta; this assessment makes no native success or complete parity claim.

## Approved property dependency implementation plan

Root stopped and archived studio-style-dependency-round2 and released this exclusive stylesheet/doc lease. Before editing, this agent decoded all three base64 matched-original-style-dependencies attachments from that archive's browser-results.json. At390 original h3 is21.06px versus Go18px (18×1.17); at768/1440 original22.23px versus Go19px. Original h4 is700 weight with1.33em block margins; Go400/zero. Original ul/ol have disc/decimal,1em block margins and40px inline-start padding; Go none/zero. Original hr has .5em block margins and1px inset border versus Go solid. All sampled original elements compute font-synthesis weight style small-caps versus Go none. Non-hr border style is none originally versus Go preflight solid with0px width.

Approved smallest delta: add only these measured property fallbacks with :where scope and tag specificity; preserve every higher-specificity original component declaration. Restore border-style:none using a specificity-zero descendant fallback; the hr tag fallback restores inset/1px, while original explicit component border shorthands retain higher priority. Restore scoped .primary shadow:none at class specificity matching the observed Go global .primary shadow leak, with original component explicit shadows higher priority. Restore font-synthesis with the actual measured value weight style small-caps on .blog-surface. `auto` is not used for the shorthand; actual measured supported keywords avoid an invalid declaration. Keep SVG fill/stroke/dimensions, hidden-important behavior, inline resizer geometry, native dialog lifecycle, original module files and imports untouched. Root owns3preview+6isolatedcomponent computed proof and full regression. No all:revert, new font claims or release certification.

Implemented this bounded property plan. Scoped Prettier PASS. Current compatibility freeze9cf6da877eab77a2b8e770b9c9e4a7b4b9743cdd663e9b7fa00cd98373a45646 supersedes prior hashes. Importer994b0e94/design79a96f1c/accounta3173efb remain unchanged. Current candidate computed/browser rerun NOT_RUN by this agent; root owns the next serial receipt.

## Read-only border fallback scope review

Current source remains frozen9cf6da87; no implementation lease for this review. The universal specificity-zero border-style:none restores an observed reset property, but observations cover only h3/h4/ul/ol/hr/#sources ol. Its effect on every other native descendant is broader than that evidence.

Source verified: account contains links/buttons and its CSS module explicitly owns border-block/link borders/logout border0. Source settings member/taxonomy modal inputs/selects are under .field, whose source-design border:1px solid owns all border properties at higher specificity. Source editor fieldset.editor-frame explicitly has border:0/margin0/padding0; title/summary textareas also have border0; editor/settings ordinary .field inputs/selects/textareas retain explicit solid borders. Native dialog has explicit source border1px solid. Therefore no observed current fieldset/input/select border erasure is established; the root's six isolated control comparisons also matched. Untested plain native controls or future added form states remain an assumption/risk, not a confirmed bug. Important hidden behavior and inline styles are unaffected.

Recommended smallest delta, if root approves: replace ONLY :where(.blog-surface *) border-style:none with :where(.blog-surface) :where(h3,h4,ul,ol) border-style:none. Specificity stays zero, retaining original explicit component declarations and the separate hr inset/1px rule. These are exactly the observed non-hr element types; avoid an unproven global native-control reset. All tokens, typography/list geometry/font synthesis/shadow fixes, imports and originals remain unchanged. Root should repeat current three style-dependency comparisons and representative preview/editor/settings native cases; unchanged higher-priority borders can be checked directly. No source changes were made by this read-only review.

Root subsequently released exactly this selector-only narrowing. Implemented with no other source changes; this is minimum evidence scope, not a claim of a discovered native-control regression. Scoped Prettier PASS. Current stylesheet freeze02a24d7c965643c8846059f3c22059e248958db80e3ac97e4eb55b306eb019b3 supersedes prior hashes. Root owns current-candidate native verification, NOT_RUN by this agent.

## Measured divider paint correction plan

Root archived studio-paint-round1, three actual paired failures, with color/background/border-color assertions retained. This agent decoded the three matched-original-style-dependencies attachments before editing: the ONLY measured property differences across all six sampled nodes and all three widths are .article-prose hr color and borderTopColor, original rgb(128,128,128) versus Go rgb(25,35,38). All other sampled properties agree. Installed Tailwind preflight explicitly sets hr color:inherit; the original Studio has no hr color rule and relies on the native divider color. The existing scoped hr border is inset/1px and its paint follows currentColor.

Approved smallest stylesheet-only delta under root exclusive lease: add color:revert to the existing low-specificity scoped hr fallback, restoring native hr color and therefore currentColor border paint. Use property revert only, not all:revert; no explicit component border/color can be erased because such source selectors have greater specificity. Preserve existing geometry, original files, SVG attrs, defaults and other fallbacks. No invented background difference or extra border-color reset. Root owns three paired paint reruns and impacted component checks. Plan recorded before source editing; no native tests or global runners by this agent.

Implemented only hr color:revert. Scoped Prettier PASS. Current freeze891084ae6f2eeb1cb2b56fe90bc785edd2dad7283ef7d5d84df3d4d3858cbde6 supersedes earlier stylesheet hashes. Originals/importer unchanged. Current-paint rerun NOT_RUN by this agent.
