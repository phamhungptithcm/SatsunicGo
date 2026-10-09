import { getFirestore } from "firebase-admin/firestore";
export function purchaseDemoEnvironment(db = getFirestore()) {
  let config: { projectId?: string } = {};
  try {
    config = JSON.parse(process.env.FIREBASE_CONFIG ?? "{}");
  } catch {
    return false;
  }
  return (
    process.env.FUNCTIONS_EMULATOR === "true" &&
    process.env.GCLOUD_PROJECT === "demo-satsunicgo" &&
    config.projectId === "demo-satsunicgo" &&
    (db as unknown as { projectId: string }).projectId === "demo-satsunicgo" &&
    /^(?:127\.0\.0\.1|localhost):18207$/.test(
      process.env.FIRESTORE_EMULATOR_HOST ?? "",
    )
  );
}
