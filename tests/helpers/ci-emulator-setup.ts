import process from "node:process";
const expected: Record<string, [string, string]> = {
  cart: ["demo-satsunicgo-cart107", "127.0.0.1:18207"],
  pilot: ["demo-satsunicgo-ask106-ci", "127.0.0.1:18207"],
  delivery: ["demo-satsunicgo", "127.0.0.1:8187"],
};
const selected = expected[process.env.SATSUNICGO_RULES_GROUP ?? ""];
if (!selected || process.env.GITHUB_ACTIONS !== "true" ||
    process.env.GCLOUD_PROJECT !== selected[0] ||
    process.env.GOOGLE_CLOUD_PROJECT !== selected[0] ||
    process.env.FIRESTORE_EMULATOR_HOST !== selected[1] ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9199" ||
    process.env.FUNCTIONS_EMULATOR !== "true") {
  throw Error("Dedicated CI suite requires its exact demo project and loopback emulators before imports");
}
