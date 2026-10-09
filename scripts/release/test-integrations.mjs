import process from 'node:process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
if (process.env.GITHUB_ACTIONS !== 'true' || process.argv[2] !== 'rules') throw Error('ISOLATED_GITHUB_RULES_RUNNER_REQUIRED');
const root = process.cwd();
const groups = [
  ['baseline', 8181, 'demo-satsunicgo'],
  ['purchase', 18207, 'demo-satsunicgo'],
  ['cart', 18207, 'demo-satsunicgo-cart107'],
  ['pilot', 18207, 'demo-satsunicgo-ask106-ci'],
  ['delivery', 8187, 'demo-satsunicgo'],
  ['recipient', 18207, 'demo-satsunicgo'],
  ['sepay', 18207, 'demo-satsunicgo'],
];
for (const [group, port, project] of groups) {
  const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
  for (const section of ['firestore', 'storage']) for (const key of ['rules', 'indexes']) if (config[section]?.[key]) config[section][key] = resolve(root, config[section][key]);
  config.emulators = { auth: {port:9199,host:'127.0.0.1'}, firestore:{port,host:'127.0.0.1'}, storage:{port:9298,host:'127.0.0.1'}, ui:{enabled:false}, singleProjectMode:false };
  const directory = mkdtempSync(join(tmpdir(), 'satsunicgo-ci-rules-'));
  const path = join(directory, 'firebase.json');
  writeFileSync(path, JSON.stringify(config));
  const env = {...process.env, GCLOUD_PROJECT:project, GOOGLE_CLOUD_PROJECT:project, FUNCTIONS_EMULATOR:'true', FIRESTORE_EMULATOR_HOST:`127.0.0.1:${port}`, FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9199', SATSUNICGO_RULES_GROUP:group};
  const child = spawnSync(process.execPath, ['node_modules/firebase-tools/lib/bin/firebase.js','emulators:exec','--project',project,'--config',path,'--only','auth,firestore,storage','node node_modules/vitest/vitest.mjs run --config vitest.ci.rules.config.mjs'], {env,stdio:'inherit',timeout:600000});
  if(child.status !== 0) process.exit(child.status ?? 1);
}
