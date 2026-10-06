import { assertDemoTestEnvironment } from "./demo-environment";
// Vitest runs setup files before loading each test module or Firebase Admin.
assertDemoTestEnvironment(process.env);
