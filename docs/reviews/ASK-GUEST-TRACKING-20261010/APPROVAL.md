# Implementation approval

Plan: PLAN.md v1 and TEST-SCENARIOS.md. Human approval: “approved triển khai theo plan, cho khách tra tiến độ và ETA trong Ask không cần đăng nhập, test đủ happy negative case và fix bug, chưa deploy” (current user turn2026-10-10). Scope: separate minimal public projection, secure code eligibility/alias issuance where provenance unproven, guest Ask routing, privacy boundaries, scoped tests/fixes. Constraint:no deploy; preserve existing owner auth, financial logic, shared runtime and unrelated WIP.

Implementation choice within approved conditional scope: issue random-strength aliases for all orders; existing command accepts arbitrary IDs so UUID syntax cannot prove entropy. Alias is labelled Mã tra cứu, shared by owner from Account; never make arbitrary order IDs public. No secret provisioning or provider/TTL activation in this task.
