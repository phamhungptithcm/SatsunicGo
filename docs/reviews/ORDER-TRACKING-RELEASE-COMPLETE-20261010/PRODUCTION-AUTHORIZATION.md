# Production prerequisites authorization

After the concrete secret-level IAM and3 TTL guide was presented, the human owner explicitly requested the agent perform all those steps because they did not know how to do them. This supersedes the earlier human-only provisioning handoff for these named prerequisites only. No deployment approval was given.

Authorized/performed: create new GUEST_TRACKING_QUOTA_KEY using48 random bytes, stdin only; preserve existing versions if any; add one secret-level roles/secretmanager.secretAccessor binding to the independently read runtime identity; request TTL only for guestTrackingQuotas.expiresAt, guestTrackingCodes.deleteAfter, guestTrackingOperations.deleteAfter. No secret payload read, no customer documents read, no IAM project role/deploy/main merge/tag or key rotation. Provider metadata readback records current state.
