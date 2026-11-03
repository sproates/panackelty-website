const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {install} = require('../scripts/cloudflare_analytics.cjs');

const token = '0123456789abcdef0123456789abcdef';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cloudflare-analytics-'));
  fs.mkdirSync(path.join(root, 'articles', 'one'), {recursive:true});
  fs.writeFileSync(path.join(root, 'index.html'), '<html><body>home</body></html>');
  fs.writeFileSync(path.join(root, 'articles', 'one', 'index.html'), '<html><body>article</body></html>');
  fs.writeFileSync(path.join(root, 'robots.txt'), 'User-agent: *\n');
  return root;
}

test('Cloudflare Web Analytics is installed on production HTML only', () => {
  const root = fixture();
  try {
    assert.equal(install(root, {token}), 2);
    const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const article = fs.readFileSync(path.join(root, 'articles', 'one', 'index.html'), 'utf8');
    for (const html of [home, article]) {
      assert.match(html, /src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js"/);
      assert.match(html, /type="module"/);
      assert.match(html, /data-cf-beacon='\{"token":"0123456789abcdef0123456789abcdef"\}'/);
      assert.ok(html.indexOf('Cloudflare Web Analytics') < html.indexOf('</body>'));
    }
    assert.equal(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8'), 'User-agent: *\n');
    assert.throws(() => install(root, {token}), /snippet is already present/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('preview and unconfigured builds never include the analytics beacon', () => {
  const root = fixture();
  try {
    assert.equal(install(root, {token, preview:true}), 0);
    assert.equal(install(root, {token:''}), 0);
    assert.doesNotMatch(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /cloudflareinsights/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('invalid analytics tokens and malformed output fail clearly', () => {
  const root = fixture();
  try {
    assert.throws(() => install(root, {token:'not a valid token'}), /Invalid Cloudflare/);
    fs.writeFileSync(path.join(root, 'bad.html'), '<html><p>no body close');
    assert.throws(() => install(root, {token}), /closing body tag/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
