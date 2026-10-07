Plan ID/version: SATSUNICGO-CRM-REDESIGN-095 v1 — runtime recovery delta
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: 2026-10-06; response to runtime recovery question: "Cho phép khôi phục và kiểm tra tiếp"
Approved scope: Preserve existing demo data, restore exact shared frontend/backend runtime and complete validation of the frozen CRM095 candidate.
Constraints: Frontend only at 127.0.0.1:5207; project demo-satsunicgo; Auth19207/Firestore18207/Functions15207/Storage19208. Reuse existing listeners where possible. Preserve current Firestore before stopping it; retain old Auth/Storage snapshots. No reset/seed, production access, additional frontend server, deployment or unrelated application edits.
Evidence: Current frontend listener has reappeared; existing Firestore remains; Auth/Functions/Storage need restoration. Existing shared config remains /private/tmp/satsunicgo-shared5207/firebase.json.
