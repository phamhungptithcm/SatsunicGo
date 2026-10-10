import { loadEnv } from "vite";
import { validatePublicConfig } from "./public-config.mjs";
// Load the build's public VITE namespace; never log configuration values.
let result;
try {
  result = validatePublicConfig(loadEnv("production", process.cwd(), "VITE_"), {
    expectedAppId: "1:278913913091:web:e40355cd8ad5abe00f9936",
  });
} catch {
  result = { ok: false, codes: ["PUBLIC_CONFIG_LOAD_FAILED"] };
}
console.log(JSON.stringify({ scope: "LOCAL_PUBLIC_CONFIG_NOT_PROVIDER_ACCEPTANCE", ...result }));
if (!result.ok) process.exitCode = 1;
