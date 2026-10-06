import { defineConfig } from "vitest/config";
export default defineConfig({root:"/private/tmp/release027-fresh-rules",test:{include:["tests/rules/**/*.test.ts"],setupFiles:["tests/helpers/demo-setup.ts"],fileParallelism:false,testTimeout:15000,hookTimeout:20000}});
