# Realistic scenarios — execution evidence

Synthetic demo only: frontend5207/Auth19207/Firestore18207/Functions15207/Storage19208, project demo-satsunicgo. No real provider/payment/email or production writes.

## Settlement/CRM —12/12 PASSED

Actual settlement adapter/imported CRM handler, real demo Firestore, owned fixture cleanup. Evidence GREEN-RESULTS.json; tests/rules/purchase-crm-recipient.test.ts.

| Case / action | Expected and observed |
| --- | --- |
| Mixed catalog/custom cart, four parallel paid replays | Single allocation; every order has identical canonical recipient in both stores. |
| OWNER reads paid operations | Confirmed recipient available. |
| OPERATIONS_MANAGER reads | Confirmed recipient available. |
| WAREHOUSE reads | Confirmed recipient available. |
| Assigned BUYER and unsupported/locked/inactive/customer/unauthenticated callers | Buyer recipient null; denied callers gain no access. |
| Pending payment | No projection/allocation. |
| Unknown outcome | No projection/allocation or invented paid state. |
| Cancelled payment | No projection/allocation. |
| Preexisting conflicting projection | Whole transaction aborts; no overwrite or partial financial writes. |
| Warehouse metadata added then paid replay | Frozen address and later metadata preserved. |
| Later balance payment | Initial recipient and packing preserved. |
|30line maximum cart | All recipients projected in bounded transaction. |

## Running HTTP —7/7 PASSED

scripts/purchase-crm-http-check.mjs creates owned Google emulator identities/product, adds custom then catalog to one cart, previews/commits, creates a signed demo link and pays twice concurrently. Server responses are not mocked. Evidence CONTINUATION-HTTP-RESULTS.json, repeated long-address/lifecycle receipts.

1. Unauthenticated CRM read returns UNAUTHENTICATED.
2. Forged client region labels with valid codes become server canonical names; mixed cart retains both kinds.
3. Committed unpaid orders have no operations projection.
4. Signed demo payment/replay settles once with exactly two financial entries.
5. Warehouse receives exact canonical3fields for both orders; private note absent.
6. Assigned buyer recipient null.
7. Customer staff-read denied.

Every run verifies owned Firestore/Auth absence after cleanup. Retained UI fixture has30minute bound and SIGTERM/SIGINT cleanup. Final lifecycle metadata becomes PASSED. Wrong project/Firestore host/Auth host each rejects before SDK initialization/network. Shared order-code counter may advance; never rewound.

## Actual desktop —12 checks PASSED

Human-authorized integration operator, real app1890×965. Required errors/focus; unaccented province; Arrow/Enter province; commune no-match/live-region DOM; unaccented commune; code01 resets commune; Escape closes retaining focus; canonical overview/acknowledgement; edit-return acknowledgement reset; console; customer CRM denial; staff MFA fence. Evidence CONTINUATION-UI-RESULTS.json and four screenshots.

## Explicit remaining checks

| Scenario | Status | Requirement |
| --- | --- | --- |
| Staff reads long address in CRM | BLOCKED | Legitimate TOTP-capable test backend; current emulator unsupported. |
|320/390px layout/wrapping | NOT_RUN | Actual DOM stayed1890; native Mac locked. |
| Screen reader/enlarged text | NOT_RUN | Accessible native/AT session. |
| Actual IME/disabled/loading/offline UI | NOT_RUN | Source/unit evidence only. |
| Real SePay/PayOS/IPN reconciliation | NOT_RUN | Outside local mock acceptance; separate provider authority/endpoints. |
| Production load/soak/leaks/historical correction | NOT_RUN | Outside approved local scope. |

## Cycle9 executed own mobile scenarios

Fresh human-authorized IAB320/390: required/invalid focus, disabled child, hcm/sai gon/name/code search, province reset, unmatched free text rejection, End popup-only scroll,320pointer/Enter/Tab and bounded popup, long canonical overview/edit preservation all PASSED. Detailed observations and source binding: CONTINUATION-MOBILE-UI-RESULTS.json. Earlier narrow NOT_RUN entries are historical, superseded for checkout only. Authenticated candidate CRM recipient and spoken AT/IME/offline remain NOT_RUN. Production read-only existing MFA/dashboard is not candidate proof.
