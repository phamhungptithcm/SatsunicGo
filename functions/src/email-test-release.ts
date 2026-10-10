// Standalone operator-test artifact. Do not deploy the dirty application entry.
import { initializeApp } from "firebase-admin/app";
initializeApp();
export { emailSelfTest } from "./email/self-test";
