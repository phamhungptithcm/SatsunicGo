import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';

const root = '/private/tmp/satsunicgo-ask-release5-deps-npm1118-20261009';
const require = createRequire(`${root}/package.json`);
const aiPath = require.resolve('@genkit-ai/ai');
const dotpromptPath = require.resolve('dotprompt');
const aiRequire = createRequire(aiPath);
const dotpromptRequire = createRequire(dotpromptPath);
const Handlebars = require('handlebars').create();
const { Dotprompt } = require('dotprompt');
const pkg = name => JSON.parse(readFileSync(require.resolve(`${name}/package.json`), 'utf8'));

test('actual Genkit and Dotprompt resolve the patched Handlebars graph', () => {
  assert.equal(pkg('handlebars').version, '4.7.10');
  const expected = require.resolve('handlebars/dist/cjs/handlebars.js');
  assert.equal(aiRequire.resolve('handlebars/dist/cjs/handlebars.js'), expected);
  assert.equal(dotpromptRequire.resolve('handlebars/dist/cjs/handlebars.js'), expected);
});

test('Genkit UUID resolution preserves11.1.1 and has no nested downgrade', () => {
  const path = aiRequire.resolve('uuid');
  assert.match(path, /\/node_modules\/uuid\//);
  assert.doesNotMatch(path, /\/node_modules\/@genkit-ai\/ai\/node_modules\/uuid\//);
  assert.equal(pkg('uuid').version, '11.1.1');
});

test('ordinary variables retain HTML escaping', () => {
  assert.equal(Handlebars.compile('Hello {{name}}')({ name: '<b>QA</b>' }), 'Hello &lt;b&gt;QA&lt;/b&gt;');
});

test('conditionals and array iteration preserve ordinary output', () => {
  assert.equal(Handlebars.compile('{{#if ready}}{{#each items}}{{name}}:{{quantity}};{{/each}}{{else}}pending{{/if}}')({ready: true, items: [{name:'QA',quantity:2}]}), 'QA:2;');
});

test('registered helpers and partials retain output', () => {
  Handlebars.registerHelper('qaUpper', value => String(value).toUpperCase());
  Handlebars.registerPartial('qaItem', '{{name}}');
  assert.equal(Handlebars.compile('{{qaUpper label}} {{> qaItem}}')({label:'ask',name:'QA'}), 'ASK QA');
});

test('Set and generator iterations are supported', () => {
  const render = Handlebars.compile('{{#each items}}{{this}};{{/each}}');
  assert.equal(render({items:new Set(['a','b'])}), 'a;b;');
  function* items() { yield 'a'; yield 'b'; }
  assert.equal(render({items:items()}), 'a;b;');
});

test('patched lazy iteration visits additions while the iterator remains open', () => {
  // each looks ahead once for @last. Keep an unconsumed second item so
  // the iterator has not returned done before the first helper grows it.
  const items = new Set(['a','b']);
  Handlebars.registerHelper('qaGrow', value => { if (value === 'a') items.add('c'); return value; });
  assert.equal(Handlebars.compile('{{#each items}}{{qaGrow this}};{{/each}}')({items}), 'a;b;c;');
});

test('completed singleton iterator does not resume after last-item helper mutation', () => {
  const items = new Set(['a']);
  Handlebars.registerHelper('qaGrowLast', value => { items.add('b'); return value; });
  assert.equal(Handlebars.compile('{{#each items}}{{qaGrowLast this}};{{/each}}')({items}), 'a;');
});

test('compiler rejects unknown AST dispatch types', () => {
  const ast = Handlebars.parse('QA');
  ast.body[0].type = 'constructor';
  assert.throws(() => Handlebars.compile(ast)({}), /Unknown type|Invalid AST/);
});

test('compiler rejects non-string literal AST values', () => {
  const ast = Handlebars.parse('{{qaUpper "QA"}}');
  ast.body[0].params[0].value = { synthetic: true };
  assert.throws(() => Handlebars.compile(ast)({}), /Invalid AST/);
});

test('Dotprompt actual renderer supports input, helper, conditional and array', async () => {
  const prompt = new Dotprompt({ helpers: { qaUpper: value => String(value).toUpperCase() } });
  const result = await prompt.render('{{qaUpper name}} {{#if ready}}{{#each items}}{{this}};{{/each}}{{/if}}', {input:{name:'ask',ready:true,items:['a','b']}});
  assert.equal(result.messages[0].content[0].text, 'ASK a;b;');
});
