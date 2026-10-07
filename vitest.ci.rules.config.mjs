import process from 'node:process';
import { defineConfig } from 'vitest/config';
const dedicated = {
  cart:'tests/rules/cart107.test.ts',
  pilot:'tests/rules/ask-pilot106.test.ts',
  delivery:'tests/rules/manual-delivery-estimate064.test.ts',
};
const group = process.env.SATSUNICGO_RULES_GROUP;
if(process.env.GITHUB_ACTIONS !== 'true' || !['baseline',...Object.keys(dedicated)].includes(group)) throw Error('ISOLATED_CI_RULES_GROUP_REQUIRED');
export default defineConfig({test:{
  include:group === 'baseline' ? ['tests/rules/**/*.test.ts'] : [dedicated[group]],
  exclude:group === 'baseline' ? Object.values(dedicated) : [],
  setupFiles:[group === 'baseline' ? 'tests/helpers/demo-setup.ts' : 'tests/helpers/ci-emulator-setup.ts'],
  fileParallelism:false,testTimeout:15000,hookTimeout:20000,
}});
