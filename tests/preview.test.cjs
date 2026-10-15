const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawn} = require('node:child_process');
const {createHash} = require('node:crypto');
const {once} = require('node:events');
const http = require('node:http');
const {build, serve, start} = require('../scripts/preview.cjs');

async function availablePort() {
  const reservation = http.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  return port;
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-test-'));
  t.after(() => fs.rmSync(root, {recursive:true, force:true}));
  fs.cpSync(path.join(__dirname, '../site'), path.join(root, 'site'), {recursive:true});
  fs.copyFileSync(path.join(__dirname, '../CHANGELOG.md'), path.join(root, 'CHANGELOG.md'));
  fs.copyFileSync(path.join(__dirname, '../release-source.json'), path.join(root, 'release-source.json'));
  const version = 'a'.repeat(64);
  const browser = path.join(root, 'browser');
  fs.mkdirSync(path.join(browser, `assets/${version}/vendor`), {recursive:true});
  fs.writeFileSync(path.join(browser, 'index.html'), '<!doctype html><head></head><body><header class="site-header">Old</header><main id="main">Playground</main></body>');
  fs.writeFileSync(path.join(browser, 'asset-version.txt'), version);
  for (const file of ['style.css','app.mjs','examples.mjs','controller.mjs','worker.mjs','runtime.mjs','vm.wasm','compiler.bc','stdlib.json','provenance.json','LICENSE','vendor/index.js','vendor/LICENSE-MIT'])
    fs.writeFileSync(path.join(browser, `assets/${version}`, file), 'fixture');
  const archivePath = path.join(root, 'browser.tar.gz');
  execFileSync('tar', ['-czf',archivePath,'-C',browser,'.']);
  const archive = fs.readFileSync(archivePath);
  fs.writeFileSync(path.join(root,'site/playground.json'), JSON.stringify({repository:'sproates/panackelty-browser',tag:'v0.1.0',assetVersion:version,sha256:createHash('sha256').update(archive).digest('hex')}));
  return {root, archive, output:path.join(root,'output'), metadata:{commit:'1'.repeat(40),dirty:false,repository:'sproates/panackelty'}};
}

test('portable build preserves assets, records identity, and separates coverage', async t => {
  const f=fixture(t);
  await build(f.root,f.output,{...f.metadata,headCommit:'2'.repeat(40),baseCommit:'3'.repeat(40)},f.archive);
  const read = p => fs.readFileSync(path.join(f.output,p),'utf8');
  assert.equal(JSON.parse(read('preview.json')).commit, f.metadata.commit);
  for (const page of ['index.html', 'releases/index.html', 'playground/index.html', 'capabilities/index.html', ...['get-started','examples','under-the-hood','roadmap'].map(page => `${page}/index.html`)]) {
    const identity = read(page).match(/href="([^"]+)">Build identity/)[1];
    assert.equal(new URL(identity, `https://example.test/project/${page}`).pathname,
      '/project/preview.json', `identity escapes the project mount on ${page}`);
  }
  assert.equal(JSON.parse(read('preview.json')).headCommit, '2'.repeat(40));
  assert.match(read('index.html'), /Review preview: 222222/);
  assert.match(read('releases/index.html'), /Review preview: 222222/);
  assert.match(read('capabilities/index.html'), /Review preview: 222222/);
  assert.match(read('capabilities/index.html'), /href="..\/capabilities\/" aria-current="page"/);
  assert.match(read('playground/index.html'), /merged with PR base/);
  assert.match(read('coverage/index.html'), /different revision/);
  assert.equal(read(`playground/assets/${'a'.repeat(64)}/vm.wasm`),'fixture');
  assert.equal(read('styles.css'),fs.readFileSync(path.join(f.root,'site/styles.css'),'utf8'));
  await assert.rejects(build(f.root,f.output,f.metadata,f.archive),/already exists/);
});

test('capabilities navigation and homepage topic links resolve in the assembled site', async t => {
  const f = fixture(t);
  await build(f.root, f.output, f.metadata, f.archive);
  for (const page of ['index.html', 'capabilities/index.html', 'releases/index.html', 'playground/index.html']) {
    const html = fs.readFileSync(path.join(f.output, page), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
    for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
      const url = new URL(href, `https://preview.invalid/${page}`);
      if (url.origin !== 'https://preview.invalid') continue;
      let target = path.join(f.output, url.pathname);
      if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      assert.ok(fs.statSync(target).isFile(), `${page}: missing ${href}`);
      if (url.hash) {
        const targetHtml = fs.readFileSync(target, 'utf8');
        assert.ok(targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${page}: missing ${href}`);
      }
    }
  }
});

test('corrupt release, symlink and invalid identity never publish partial output', async t => {
  const f=fixture(t);
  await assert.rejects(build(f.root,f.output,f.metadata,Buffer.from('corrupt')),/SHA-256/);
  await assert.rejects(build(f.root,f.output,{...f.metadata,commit:'<script>'},f.archive),/provenance/);
  fs.symlinkSync(path.join(f.root,'browser.tar.gz'),path.join(f.root,'site/leak'));
  await assert.rejects(build(f.root,f.output,f.metadata,f.archive));
  assert.equal(fs.existsSync(f.output),false);
  assert.equal(fs.readdirSync(f.root).some(p=>p.startsWith('.preview-')),false);
});

test('server serves Wasm with correct MIME and rejects traversal, links and writes', async t => {
  const f=fixture(t);
  await build(f.root,f.output,{...f.metadata,dirty:true},f.archive);
  fs.writeFileSync(path.join(f.root,'secret'),'not public');
  fs.symlinkSync(path.join(f.root,'secret'),path.join(f.output,'leak'));
  const server=serve(f.output,await availablePort());
  await once(server,'listening');
  t.after(()=>server.close());
  const request = (url,method='GET') => new Promise((resolve,reject)=> {
    http.request({host:'127.0.0.1',port:server.address().port,path:url,method},res=>{
      const chunks=[];res.on('data',x=>chunks.push(x));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}));
    }).on('error',reject).end();
  });
  assert.match((await request('/')).body,/local changes/);
  const capabilities = await request('/capabilities/');
  assert.equal(capabilities.status, 200);
  assert.match(capabilities.body, /local changes/);
  const wasm=await request(`/playground/assets/${'a'.repeat(64)}/vm.wasm`);
  assert.equal(wasm.status,200);assert.equal(wasm.headers['content-type'],'application/wasm');
  assert.equal(wasm.headers['cache-control'],'no-store');
  for(const url of ['/../secret','/%2e%2e/secret','/%xx']) assert.equal((await request(url)).status,400);
  for(const url of ['/leak','/missing']) assert.equal((await request(url)).status,404);
  assert.equal((await request('/','POST')).status,405);
  assert.equal((await request('/','HEAD')).body,'');
});

test('one-command session builds fresh bytes, preserves saved builds, and cleans up on stop', async t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'build/preview'), {recursive:true});
  fs.writeFileSync(path.join(f.root, 'build/preview/keep'), 'user-owned');
  const first = await start(f.root, f.metadata, await availablePort(), f.archive);
  t.after(first.stop);
  assert.equal(first.server.address().address, '127.0.0.1');
  const url = `http://127.0.0.1:${first.server.address().port}/`;
  assert.equal((await fetch(url)).status, 200);
  const closed = once(first.server, 'close'); first.stop(); await closed;
  assert.equal(fs.existsSync(first.directory), false);
  assert.equal(fs.readFileSync(path.join(f.root, 'build/preview/keep'), 'utf8'), 'user-owned');
  fs.appendFileSync(path.join(f.root, 'site/index.html'), '\n<!-- rebuilt-local-edit -->');
  const second = await start(f.root, {...f.metadata, dirty:true}, await availablePort(), f.archive);
  t.after(second.stop);
  const response = await fetch(`http://127.0.0.1:${second.server.address().port}/`);
  assert.match(await response.text(), /rebuilt-local-edit/);
  assert.notEqual(second.directory, first.directory);
});

test('startup failures release temporary directories and signal handlers', async t => {
  const f = fixture(t);
  const temporary = () => fs.readdirSync(os.tmpdir()).filter(name => name.startsWith('panackelty-preview-')).sort();
  const before = temporary();
  const signals = ['exit','SIGINT','SIGTERM'].map(name => process.listenerCount(name));
  await assert.rejects(start(f.root, f.metadata, await availablePort(), Buffer.from('bad')), /SHA-256/);
  const server = serve(f.root, await availablePort()); await once(server, 'listening'); t.after(() => server.close());
  await assert.rejects(start(f.root, f.metadata, server.address().port, f.archive), {code:'EADDRINUSE'});
  assert.deepEqual(temporary(), before);
  assert.deepEqual(['exit','SIGINT','SIGTERM'].map(name => process.listenerCount(name)), signals);
});

test('signals and launcher death stop the tool and remove its temporary build', {timeout:15000}, async t => {
  const f = fixture(t);
  for (const signal of ['SIGINT','SIGTERM','SIGKILL']) {
    const child = spawn(process.execPath, ['-e', `
      const fs = require('node:fs');
      const {start} = require(process.argv[1]);
      start(process.argv[2], JSON.parse(process.argv[3]), Number(process.argv[5]), fs.readFileSync(process.argv[4]))
        .then(session => process.send({directory:session.directory,port:session.server.address().port}));
    `, path.resolve(__dirname,'../scripts/preview.cjs'), f.root, JSON.stringify(f.metadata), path.join(f.root,'browser.tar.gz'), String(await availablePort())],
    {stdio:['ignore','pipe','pipe','ipc']});
    t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
    const [{directory, port}] = await once(child, 'message');
    assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status, 200);
    const exited = once(child, 'exit'); child.kill(signal);
    assert.deepEqual(await exited, signal === 'SIGKILL' ? [null, signal] : [0,null]);
    for (let attempt = 0; attempt < 100 && fs.existsSync(directory); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(fs.existsSync(directory), false);
    await assert.rejects(fetch(`http://127.0.0.1:${port}/`));
  }
});

test('CLI rejects invalid ports and extra arguments before building', () => {
  for (const args of [['start','0'],['start','65536'],['start','bad'],['start','4173','extra'],['build','x','extra']]) {
    assert.throws(() => execFileSync(process.execPath, [path.resolve(__dirname,'../scripts/preview.cjs'), ...args], {stdio:'pipe'}),
      error => error.status === 1 && /Usage:/.test(error.stderr.toString()));
  }
});


test('unexpected tool exit reports failure and cleans its owned directory', {timeout:10000}, async t => {
  const f = fixture(t);
  const session = await start(f.root, f.metadata, await availablePort(), f.archive);
  t.after(session.stop);
  const failed = once(session.server, 'error');
  // The error event intentionally precedes close; avoid once(close)'s error rejection.
  const closed = new Promise(resolve => session.server.once('close', resolve));
  process.kill(session.server.pid, 'SIGKILL');
  assert.match((await failed)[0].message, /stopped unexpectedly/);
  await closed;
  assert.equal(fs.existsSync(session.directory), false);
});

test('missing or incompatible tools fail clearly without losing supplied files', {timeout:10000}, async t => {
  const f = fixture(t);
  const previous = process.env.PANACK_HTTP_SERVER;
  t.after(() => {
    if (previous === undefined) delete process.env.PANACK_HTTP_SERVER;
    else process.env.PANACK_HTTP_SERVER = previous;
  });
  const incompatible = path.join(f.root, 'wrong-tool');
  fs.writeFileSync(incompatible, '#!/bin/sh\nprintf "wrong protocol\\n"\n', {mode:0o755});
  for (const executable of [path.join(f.root, 'missing'), incompatible]) {
    process.env.PANACK_HTTP_SERVER = executable;
    const server = serve(f.root, await availablePort());
    const closed = new Promise(resolve => server.once('close', resolve));
    await assert.rejects(once(server, 'listening'), /Install the pinned tool/);
    await closed;
    assert.ok(fs.existsSync(path.join(f.root, 'site/index.html')));
  }
});

test('startup with no readiness times out and terminates its child', {timeout:15000}, async t => {
  const f = fixture(t);
  const previous = process.env.PANACK_HTTP_SERVER;
  t.after(() => {
    if (previous === undefined) delete process.env.PANACK_HTTP_SERVER;
    else process.env.PANACK_HTTP_SERVER = previous;
  });
  const executable = path.join(f.root, 'silent-tool');
  fs.writeFileSync(executable, `#!${process.execPath}
if (process.argv.includes('--version')) console.log('panackelty-http-server 1');
else setInterval(() => {}, 1000);
`, {mode:0o755});
  process.env.PANACK_HTTP_SERVER = executable;
  const server = serve(f.root, await availablePort());
  const closed = new Promise(resolve => server.once('close', resolve));
  await assert.rejects(once(server, 'listening'), /readiness timed out/);
  await closed;
  assert.ok(fs.existsSync(f.root));
});


test('CI pins the tool and exercises both suites through the preview launcher', () => {
  const pin = require('../preview-tool.json');
  assert.equal(pin.repository, 'sproates/panackelty');
  assert.match(pin.revision, /^[0-9a-f]{40}$/);
  assert.equal(pin.protocol, 'panackelty-http-server 1');
  const checks = fs.readFileSync('.github/workflows/check.yml', 'utf8');
  assert.match(checks, /require\("\.\/preview-tool.json"\)\.revision/);
  assert.match(checks, /ref: \$\{\{ steps.preview-tool.outputs.revision \}\}/);
  assert.match(checks, /make -C build\/preview-tool-source -j2 install/);
  assert.match(checks, /apt-get install --no-install-recommends -y libcurl4-openssl-dev/);
  const browser = fs.readFileSync('.github/workflows/browser-validation.yml', 'utf8');
  assert.equal((browser.match(/--config preview.playwright.config.mjs/g) || []).length, 2);
  assert.match(browser, /PANACK_PREVIEW_SCRIPT=/);
  assert.match(fs.readFileSync('tests/website.playwright.config.mjs', 'utf8'), /preview.playwright.config.mjs/);
});
