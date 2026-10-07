# CART-107 runtime approval

User explicitly approved restoring the shared demo runtime in the asynchronous question: `Cho phép khôi phục runtime demo`.

Authorized delta: preserve existing demo data, restore Auth 19207 and Functions 15207 (and shared Storage 19208 if needed), use existing shared Firestore 18207, and restore frontend at 5207 with demo-satsunicgo and matching emulator flags. No alternate frontend port, reseed, production writes or deployment. Existing live .env.local is not edited; demo flags are scoped to the Vite process. Preserve/export the running Firestore before runtime work and recover previous auth/storage exports without printing their content.
