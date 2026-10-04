# Firebase Web app registration approval and receipt

Date: 2026-10-04. Human response to the scoped registration question: “Cho phép đăng ký Web app satsunicgo”.

Authorized action: register one Firebase WEB app in the existing `satsunicgo` project and obtain its public browser SDK configuration for local use. No deployment, IAM change, secret configuration, billing enablement, payment/provider transaction or first-owner provisioning is included.

Readback before creation: `firebase apps:list WEB --project satsunicgo --json` returned success with an empty result.
Creation receipt: WEB app `SatsunicGo`, app ID `1:278913913091:web:e40355cd8ad5abe00f9936`, state ACTIVE, project `satsunicgo`. CLI returned success.
SDK configuration identity matched both project ID and app ID before being copied to ignored `.env.local` with mode 0600. Public API key is intentionally omitted from this record and console output.

Real Google sign-in, OAuth origins/providers, Identity Platform MFA, App Check and deployed Functions remain NOT_TESTED. Registration alone does not establish those capabilities.
