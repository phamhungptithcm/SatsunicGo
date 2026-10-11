# Approved dependency integration

Human exact prior authorization: “Duyệt bản vá4.7.10 và kiểm chứng (đề xuất)”. Earlier DEPENDENCY-DELTA-PLAN.md scopes precisely package.json and root package-lock.json. Current request additionally authorizes shipping all local source to main/production. This integrates the already approved immutable patch into shared source; it is not a new dependency or framework change.

Both current manifests equal the verified prior baseline before this edit. Candidate manifests carry only the approved Handlebars4.7.10 override/lock delta. Root copies those exact reviewed files without modifying other packages. No shared node_modules reinstall or server restart. Validate with a separate fresh-install release workspace, typecheck/lint/unit/contracts/build/audit; preserve existing production holds and no secret access.

[
  {
    "path": "package.json",
    "oldSha256": "5aa00496aaf9d8f41a726bacaf26745939d840f4d669df8ddea9a37593a0880c",
    "newSha256": "f419ec7c6e50a7a50d8d81f04a398f391f63d35d46e41ba7c7e2daa36ef82610"
  },
  {
    "path": "package-lock.json",
    "oldSha256": "0f8b0c79388c72fb69a97b0166f57524ec8cf6fcede637a8f51a966f3768c8a0",
    "newSha256": "d2ef5388dbee9d04f0a8e269d0e43a7d149dd5bc001e9de701cf0ebaf6cc5800"
  }
]
