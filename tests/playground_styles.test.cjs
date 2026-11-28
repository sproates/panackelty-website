const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

test('playground styles retain cascade order without parallel stylesheet requests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'playground-styles-'));
  try {
    fs.mkdirSync(path.join(root, 'playground'));
    fs.writeFileSync(path.join(root, 'playground', 'base.css'), '.brand {color: red}');
    fs.writeFileSync(path.join(root, 'chrome.css'), '.brand {color: blue}');
    const page = path.join(root, 'playground', 'index.html');
    fs.writeFileSync(page, '<head><link rel="stylesheet" href="base.css"><link rel="stylesheet" href="../chrome.css"></head><body><script type="module" src="app.mjs"></script></body>');
    execFileSync(process.execPath, ['scripts/inline_playground_styles.cjs', page]);
    const html = fs.readFileSync(page, 'utf8');
    assert.ok(html.indexOf('color: red') < html.indexOf('color: blue'));
    assert.equal((html.match(/<style>/g) || []).length, 2);
    assert.ok(!html.includes('rel="stylesheet"'));
    assert.ok(html.includes('<script type="module" src="app.mjs"></script>'));
    fs.writeFileSync(page, '<link rel="stylesheet" href="../../outside.css">');
    assert.throws(() => execFileSync(process.execPath, ['scripts/inline_playground_styles.cjs', page], {stdio:'pipe'}), /Stylesheet outside assembled site/);
  } finally {fs.rmSync(root, {recursive:true, force:true});}
});
