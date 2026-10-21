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

test('HTTP reference and playbook pages identify API Docs as their navigation section', () => {
  const home = fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8');
  for (const route of ['reference/http-client', 'reference/http-server', 'playbook/http-server']) {
    const source = fs.readFileSync(path.join(__dirname, '../site', route, 'index.html'), 'utf8');
    const result = render(home, source, route);
    assert.match(result, /href="..\/..\/api\/" aria-current="page"/);
    assert.equal((result.match(/aria-current="page"/g) || []).length, 1);
  }
});
