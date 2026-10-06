import process from "node:process";
import { spawn } from "node:child_process";
import { assertDemoEnvironment } from "./demo-guard.mjs";
assertDemoEnvironment(process.env);
const env = {
  ...process.env,
  VITE_USE_EMULATORS: "true",
  VITE_BETA_RELEASE: "false",
  VITE_FIREBASE_PROJECT_ID: "demo-satsunicgo",
  VITE_FIREBASE_API_KEY: "demo-only",
  VITE_FIREBASE_APP_ID: "demo-only-app",
  VITE_FIREBASE_AUTH_DOMAIN: "demo-satsunicgo.firebaseapp.com",
  VITE_FIREBASE_STORAGE_BUCKET: "demo-satsunicgo.appspot.com",
  VITE_GOOGLE_CLIENT_ID: "",
  VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: "",
};
const seed = spawn(process.execPath, ["scripts/seed-demo.mjs"], {
  env,
  stdio: "inherit",
});
const code = await new Promise((resolve) => {
  seed.on("exit", resolve);
  seed.on("error", () => resolve(1));
});
if (code !== 0) process.exit(code ?? 1);
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "5173",
    "--strictPort",
  ],
  { env, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => vite.kill(signal));
vite.on("exit", (code) => process.exit(code ?? 0));
