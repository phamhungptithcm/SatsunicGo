# Structured customer AI output

Authority: human-approved production autofix/review/test scope. Intelligence DEGRADED; verified request builder, strict askAnswerSchema, requestSchema, admission tests and hosted private diagnostic against verified v0.15.5.

Observed: normal ISBN question twice receives provider output rejected by strict answer-schema; latest fixed diagnostic23:25:10Z. Current request sets JSON MIME but no responseSchema. Exact rejected field is unknown; do not infer it or inspect raw output.

Smallest corrective plan: add explicit Vertex responseSchema matching the existing prompt's allowed answer envelope and optional preparation draft. Require existing core fields, use supported provider schema types/enum/array/numeric bounds, omit shoppingDraft and all authority-bearing fields. Optional means omitted, not null. Runtime Zod/source/context/action/draft/completion validation remains unchanged and authoritative. Schema helps generation, does not prove content or authorization. Keep same model,800outputtokens, budgets, expiry, AppCheck and UI.

Verify request schema coverage against domain parser; positive/no-draft/draft, malformed/null/extras and malicious action/source/draft cases still reject. Run admission/pilot units, backend TypeScript, targeted lint, independent review, exact CI and original artifact. Hosted acceptance required after verified native deployment. Product strings/styles unchanged; product-state gate pending actual rendered result. No blind paid retries; only one further1000VND canary within existing owner5000/global50000 ceilings and original expiry.

Sources: https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1beta1/GenerationConfig and https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/control-generated-output . Provider structured output supplements, never replaces server validation.
