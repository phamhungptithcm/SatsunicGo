import {defineConfig} from "@playwright/test";
export default defineConfig({testDir:"../../../tests/browser",testMatch:["analytics-dashboard.spec.ts","dashboard094.spec.ts"],workers:1,retries:0,timeout:30000,use:{baseURL:"http://127.0.0.1:5207",headless:true},outputDir:"/private/tmp/satsunicgo-analytics-browser/results",reporter:"list"});
