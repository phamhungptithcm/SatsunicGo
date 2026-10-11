/** QA artifact only: fixed-pixel 200% text scaling, not browser zoom. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root = process.cwd();
const folder = path.join(root, 'docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R2');
const baselinePath = path.join(folder, 'TEXT-SCALE-BASELINE.json');
const basePath = path.join(folder, 'preview.html');
const outputPath = path.join(folder, 'text-scale-preview.html');
const receiptPath = path.join(folder, 'TEXT-SCALE-SOURCE.json');
const manifestPath = path.join(folder, 'SOURCE-MANIFEST.json');
const digest = async file => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
const manifestDigest = await digest(manifestPath);
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
assert.equal(baseline.sourceManifestSHA, manifestDigest, 'Baseline must bind the frozen source manifest');
assert.equal(baseline.width, 390, 'Declared baseline is the root-captured 390px Profile notification region');
assert.equal(baseline.elements.length, 29, 'Expected all 29 captured elements');
const before = [];
for (const group of ['inputs', 'outputs', 'preservedPreviousFixtures']) {
  for (const input of manifest[group]) {
    const actual = await digest(path.join(root, input.path));
    assert.equal(actual, input.sha256, `Frozen input/output drift: ${input.path}`);
    before.push({ group, ...input });
  }
}
const seen = new Set();
const doubled = value => {
  assert.match(value, /^(?:\d+|\d+\.\d+)px$/, 'Only explicit computed pixel baselines are supported');
  const target = Number(value.slice(0, -2)) * 2;
  assert.ok(Number.isFinite(target) && target > 0);
  return `${Number(target.toFixed(6))}px`;
};
const rules = baseline.elements.map(element => {
  // A unique #main and only direct-child nth-of-type steps structurally allow at most one match.
  assert.match(element.selector, /^#main(?: > [a-z][a-z0-9]*:nth-of-type\([1-9]\d*\))+$/);
  assert.equal(seen.has(element.selector), false, 'Baseline selectors must be unique');
  seen.add(element.selector);
  assert.equal(element.selector.match(/ > ([a-z][a-z0-9]*):nth-of-type\(\d+\)$/)[1].toUpperCase(), element.tag);
  return { selector: element.selector, tag: element.tag, baselineFontSize: element.fontSize,
    baselineLineHeight: element.lineHeight, targetFontSize: doubled(element.fontSize), targetLineHeight: doubled(element.lineHeight) };
});
const css = rules.map(rule => `${rule.selector} { font-size: ${rule.targetFontSize} !important; line-height: ${rule.targetLineHeight} !important; }`).join('\n');
assert.equal((css.match(/font-size:/g) || []).length, 29);
assert.equal((css.match(/line-height:/g) || []).length, 29);
assert.equal(/font-size:\s*(?:200%|2em|2rem)|[;{]\s*(?:transform|zoom|width|height|padding|margin)\s*:/i.test(css), false);
const original = await fs.readFile(basePath, 'utf8');
assert.equal(original.split('</head>').length, 2);
assert.equal(original.split('<body>').length, 2);
const style = `<style id="qa-text-scale-200" data-qa-mechanism="fixed-computed-pixels-times-two">\n/* QA only: 29 captured notification elements; fixed doubled px avoids nested scaling. */\n${css}\n</style>`;
const disclosure = '<aside class="fixtureBar" role="note" data-qa-text-scale="200">QA · Chữ và khoảng cách dòng được tăng 200% theo số đo gốc. Đây là text-scaling proxy, không phải browser zoom. Bố cục sản phẩm giữ nguyên để kiểm tra lỗi tràn hoặc cắt chữ.</aside>';
const generated = original.replace('</head>', `${style}</head>`).replace('<body>', `<body>${disclosure}`);
await fs.writeFile(outputPath, generated);
const afterDrift = [];
for (const input of before) if (await digest(path.join(root, input.path)) !== input.sha256) afterDrift.push(input.path);
assert.deepEqual(afterDrift, [], 'Frozen base fixture must remain untouched');
const source = {
  generatedAtUTC: new Date().toISOString(), status: 'READY_FOR_ROOT_CUA_TEXT_SCALE_VALIDATION',
  method: 'Insert a QA disclosure and 29 selector-specific font-size/line-height rules into a separate copy of frozen preview.html; every target is fixed baseline computed px multiplied by exactly two.',
  scaleFactor: 2, browserZoom: 'NOT_RUN; this artifact is a text-scaling proxy only',
  layoutOverrides: false, inheritedExponentialScaling: false, providerIO: false, browserAutomation: false,
  fixtureURL: 'http://127.0.0.1:5207/docs/reviews/PRODUCTION-INTEGRATION-20261009/EMAIL-CONTENT-R2/text-scale-preview.html?screen=profile&availability=ready&state=pending',
  requiredMountAction: 'Click the Thông báo button in the actual Profile component before checking these selectors.',
  inputs: await Promise.all(['text-scale-build.mjs', 'TEXT-SCALE-BASELINE.json', 'preview.html', 'components.js', 'components.css', 'SOURCE-MANIFEST.json'].map(async name => ({ path: path.relative(root, path.join(folder, name)), sha256: await digest(path.join(folder, name)) }))),
  baseline: { capturedAtUTC: baseline.atUTC, width: baseline.width, sourceManifestSHA: baseline.sourceManifestSHA, method: baseline.method },
  output: { path: path.relative(root, outputPath), sha256: await digest(outputPath) },
  selectorContract: { count: rules.length, distinctSelectors: seen.size, structure: 'Unique #main anchor followed only by direct-child tag:nth-of-type(n) selectors; at most one node per selector if anchor is unique.', uniqueStringAndTagValidation: 'PASSED', actualMountedExistenceAndUniqueness: 'NOT_RUN; root CUA must verify all 29 querySelectorAll counts equal one after mounting notifications.', actualComputedDoubledSizes: 'NOT_RUN; root CUA must compare all 29 computed font-size and line-height values with targets below.' },
  rules, frozenBaseInputsAndOutputsVerified: before.length, frozenFixtureDrift: afterDrift,
  limitations: ['This scopes scaling to the 29 captured Profile notification-region elements, not the entire browser or fixture chrome.', 'Root CUA owns actual 390px/320px overflow, clipping and keyboard observations.', 'No layout property was altered to make scaling pass; any clipping must be reported, not hidden.', 'Real browser zoom, spoken assistive technology and production behavior remain unverified.']
};
await fs.writeFile(receiptPath, JSON.stringify(source, null, 2) + '\n');
console.log(JSON.stringify({ status: source.status, output: source.output, sourceReceipt: path.relative(root, receiptPath), receiptSHA256: await digest(receiptPath), rules: rules.length, frozenFixtureDrift: afterDrift }));
