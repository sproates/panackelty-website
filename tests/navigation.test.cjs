const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const checkPages = require('../scripts/check_pages.cjs');
test('assembled website navigation and deployed bytes resolve; failures remain visible', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-links-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.cpSync('site', root, {recursive: true});
  fs.mkdirSync(path.join(root, 'releases'));
  fs.writeFileSync(path.join(root, 'releases/index.html'), execFileSync('sh', ['scripts/release_history.sh', '.']));
  fs.mkdirSync(path.join(root, 'playground'));
  fs.writeFileSync(path.join(root, 'playground/index.html'), '<a href="../">home</a>');
  const version = 'a'.repeat(64);
  const assets = `playground/assets/${version}`;
  fs.mkdirSync(path.join(root, assets), {recursive:true});
  fs.writeFileSync(path.join(root, 'playground/asset-version.txt'), version + '\n');
  for (const name of ['vm.wasm', 'compiler.bc', 'stdlib.json', 'worker.mjs', 'provenance.json']) {
    fs.writeFileSync(path.join(root, assets, name), 'fixture');
  }
  fs.mkdirSync(path.join(root, 'help/topics'), {recursive:true});
  fs.writeFileSync(path.join(root, 'help/index.html'), '<a href="topics/example.html">topic</a>');
  fs.writeFileSync(path.join(root, 'help/topics/example.html'), '<a href="../index.html">back</a>');
  const targets = await checkPages(root);
  assert(targets.has('help/topics/example.html'));
  assert(targets.has('playground/index.html'));
  fs.writeFileSync(path.join(root, 'publication.json'), JSON.stringify({schema:1,site_sha:'5'.padStart(40, '0'),check_run:5}));
  const visited = [];
  let stale = false;
  let broken = false;
  let wrongMime = false;
  let staleWasm = false;
  t.mock.method(global, 'fetch', async url => {
    assert.equal(url.origin, 'https://example.test', 'must not depend on external coverage host');
    const file = url.pathname.endsWith('/') ? url.pathname.slice(1) + 'index.html' : url.pathname.slice(1);
    visited.push(file);
    if (broken) return {ok: false, status: 404};
    return {ok: true,
      headers: new Map([['content-type', wrongMime ? 'text/html' : 'application/wasm']]),
      arrayBuffer: async () => staleWasm && file === `${assets}/vm.wasm`
        ? Buffer.from('stale') : fs.readFileSync(path.join(root, file)),
      text: async () => stale && file === 'publication.json'
      ? 'old provenance' : fs.readFileSync(path.join(root, file), 'utf8')};
  });
  await checkPages(root, 'https://example.test/');
  assert(visited.includes('help/topics/example.html'));
  assert(visited.includes(`${assets}/vm.wasm`));
  assert(visited.includes(`${assets}/worker.mjs`));
  wrongMime = true;
  await assert.rejects(checkPages(root, 'https://example.test/'), /MIME/);
  wrongMime = false; staleWasm = true;
  await assert.rejects(checkPages(root, 'https://example.test/'), /playground content/);
  staleWasm = false;
  stale = true;
  await assert.rejects(checkPages(root, 'https://example.test/'), /provenance/);
  stale = false; broken = true;
  await assert.rejects(checkPages(root, 'https://example.test/'), /404/);
  broken = false;
  fs.writeFileSync(path.join(root, 'coverage/summary.txt'), 'stale bundled report');
  await assert.rejects(checkPages(root), /Unexpected bundled coverage/);
  fs.unlinkSync(path.join(root, 'coverage/summary.txt'));
  fs.unlinkSync(path.join(root, 'help/topics/example.html'));
  await assert.rejects(checkPages(root), /ENOENT/);
  fs.writeFileSync(path.join(root, 'help/index.html'), '<a href="../../outside.html">escape</a>');
  await assert.rejects(checkPages(root), /Escaping link/);
});

test('homepage section navigation and example references have unique targets', () => {
  const html = ['index.html','examples/index.html','get-started/index.html'].map(file => fs.readFileSync(`site/${file}`, 'utf8')).join('');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  for (const file of ['index.html','examples/index.html','get-started/index.html']) {
    const pageIds = [...fs.readFileSync(`site/${file}`, 'utf8').matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(pageIds).size, pageIds.length, `${file}: duplicate page anchor`);
  }
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
    assert(ids.includes(target), `missing anchor: ${target}`);
  }
  for (const [, labels] of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
    for (const label of labels.split(/\s+/)) assert(ids.includes(label), `missing accessible label: ${label}`);
  }
  for (const name of ['hello', 'guards', 'exact']) {
    assert(ids.includes(`${name}-source`), `missing runnable example: ${name}`);
    assert(ids.includes(`${name}-output`), `missing expected output: ${name}`);
  }
});
