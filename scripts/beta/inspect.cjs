const {
  requireAuth,
} = require("../../node_modules/firebase-tools/lib/requireAuth");
const { Client } = require("../../node_modules/firebase-tools/lib/apiv2");
(async () => {
  await requireAuth({ project: "satsunicgo", nonInteractive: true });
  const checks = [
    [
      "billing",
      "https://cloudbilling.googleapis.com",
      "/v1/projects/satsunicgo/billingInfo",
      (b) => ({ enabled: b.billingEnabled === true }),
    ],
    [
      "auth",
      "https://identitytoolkit.googleapis.com",
      "/admin/v2/projects/satsunicgo/config",
      (b) => ({
        authorizedDomains: b.authorizedDomains ?? [],
        providerConfigPresent: !!b.signIn,
        googleClientPresent: !!b.client?.apiKey,
      }),
    ],
    [
      "google",
      "https://identitytoolkit.googleapis.com",
      "/admin/v2/projects/satsunicgo/defaultSupportedIdpConfigs/google.com",
      (b) => ({ enabled: b.enabled === true, clientConfigured: !!b.clientId }),
    ],
    [
      "firestore",
      "https://firestore.googleapis.com",
      "/v1/projects/satsunicgo/databases",
      (b) => ({
        databases: (b.databases ?? []).map((d) => ({
          name: d.name,
          location: d.locationId,
          type: d.type,
        })),
      }),
    ],
    [
      "storage",
      "https://storage.googleapis.com",
      "/storage/v1/b?project=satsunicgo",
      (b) => ({
        buckets: (b.items ?? []).map((d) => ({
          name: d.name,
          location: d.location,
        })),
      }),
    ],
    [
      "functions",
      "https://cloudfunctions.googleapis.com",
      "/v2/projects/satsunicgo/locations/-/functions",
      (b) => ({
        functions: (b.functions ?? []).map((d) => ({
          name: d.name,
          state: d.state,
        })),
      }),
    ],
  ];
  const results = await Promise.all(
    checks.map(async ([key, origin, path, filter]) => {
      try {
        const r = await new Client({ urlPrefix: origin, apiVersion: "" }).get(
          path,
        );
        return { check: key, result: filter(r.body) };
      } catch (e) {
        return {
          check: key,
          errorCode: e.status ?? e.statusCode ?? "unavailable",
        };
      }
    }),
  );
  console.log(JSON.stringify(results, null, 2));
})().catch(() => {
  console.error(
    "Read-only Firebase inspection failed; no credentials printed.",
  );
  process.exitCode = 1;
});
