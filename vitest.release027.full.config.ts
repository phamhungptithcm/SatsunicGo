import {defineConfig} from 'vitest/config';
// Disposable source-equivalent fixtures retain strict local demo guards, adapted8187 only.
export default defineConfig({root:'/private/tmp/release027-full-rules',test:{include:['tests/rules/**/*.test.ts'],setupFiles:['tests/helpers/demo-setup.ts'],fileParallelism:false,testTimeout:15000,hookTimeout:20000}});
