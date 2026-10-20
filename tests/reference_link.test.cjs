const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const render = require('../scripts/site_chrome.cjs');

test('pinned playground artifacts link to the relocated language reference', () => {
  const home = fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8');
  const old = 'https://github.com/sproates/panackelty/blob/main/SPEC.md';
  const current = 'https://github.com/sproates/panackelty/blob/main/docs/reference/SPEC.md';
  const artifact = `<html><head></head><body><header class="site-header"></header><a href="${old}">Language reference</a></body></html>`;
  const result = render(home, artifact, 'playground');
  assert.ok(result.includes(`href="${current}"`));
  assert.ok(!result.includes(old));
  assert.ok(render(home, artifact.replace(old, current), 'playground').includes(`href="${current}"`));
});
