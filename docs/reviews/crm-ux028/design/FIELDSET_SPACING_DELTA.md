# CRM028 wrapper spacing delta — implemented; native verification pending

Observed source: global .form provides layout gap; .form fieldset only resets border/margin/padding. Workspace .form remains grid gap16. Newly added bare disabled control-lock wrappers therefore bypass gap between sibling controls when enabled and disabled. This is source evidence; actual native layout not yet observed.

Proposed narrow fix: className="form" on newly introduced control-lock wrappers in Returns, Refunds, Shipping, Consolidation, Customer, Settings, StaffAccess, Campaigns, PlanEditor. Preserve structural fieldsets crmRateFields/crmRoleOptions/per-order quantity groups. No CSS/contract/authority changes. Root explicitly approved this class-only lease; correction implemented on14wrappers across9files, structural fieldsets preserved. Root shared native freeze remains held.

After correction:29focused tests and scoped lint rerun PASS; affected manifests and current review cycles/reports refreshed. Root compiler/native widths/focus/disabled/unknownretry acceptance pending. No successful handoff based only on source style inference.
