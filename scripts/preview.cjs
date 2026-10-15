// Portable static review artifact and loopback server. No deployment credentials.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {once, EventEmitter} = require('node:events');
const {execFileSync, fork} = require('node:child_process');
const {download, unpack} = require('./fetch_playground.cjs');

async function build(root, destination, metadata, archive) {
  if (!/^[0-9a-f]{40}$/.test(metadata.commit) ||
      typeof metadata.dirty !== 'boolean' ||
      !/^[\w.-]+\/[\w.-]+$/.test(metadata.repository)) throw new Error('Invalid preview provenance');
  destination = path.resolve(destination);
  for (const key of ['headCommit', 'baseCommit']) {
    if (metadata[key] !== undefined && !/^[0-9a-f]{40}$/.test(metadata[key])) throw new Error('Invalid preview provenance');
  }
  if (fs.existsSync(destination)) throw new Error('Preview destination already exists');
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  const temporary = fs.mkdtempSync(path.join(path.dirname(destination), '.preview-'));
  try {
    const pin = JSON.parse(fs.readFileSync(path.join(root, 'site/playground.json'), 'utf8'));
    const playground = path.join(temporary, 'playground');
    unpack(archive || await download(pin), pin, playground);
    const output = path.join(temporary, 'site');
    execFileSync('sh', [path.join(__dirname, 'assemble_site.sh'), path.join(root, 'site'), playground, output], {env:{...process.env, PANACKELTY_PREVIEW_DRAFTS:'1'}});
    const provenance = {...metadata, browser: pin};
    fs.writeFileSync(path.join(output, 'preview.json'), JSON.stringify(provenance, null, 2) + '\n');
    const notice = identity => `<aside style="padding:1rem;background:#fff3cd;color:#222;overflow-wrap:anywhere;min-width:0;box-sizing:border-box">Review preview: ${metadata.headCommit || metadata.commit}${metadata.headCommit ? ' (merged with PR base)' : ''}${metadata.dirty ? ' (local changes)' : ''}. <a href="${identity}">Build identity</a></aside>`;
    for (const file of ['index.html', 'releases/index.html', 'playground/index.html', ...['capabilities','get-started','examples','explain','under-the-hood','roadmap','previous-releases'].map(page => `${page}/index.html`)]) {
      const target = path.join(output, file);
      const html = fs.readFileSync(target, 'utf8');
      if (!/<body\b[^>]*>/i.test(html)) throw new Error('Preview page has no body');
      fs.writeFileSync(target, html.replace(/<body\b[^>]*>/i, match => match + notice(path.posix.relative(path.posix.dirname(file), 'preview.json'))));
    }
    // Browser share controls may prefer canonical metadata to the current URL.
    // Preview artifacts are portable across loopback, LAN and staging hosts.
    function removeProductionShareMetadata(directory) {
      for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) removeProductionShareMetadata(file);
        else if (entry.isFile() && entry.name.endsWith('.html')) {
          const html = fs.readFileSync(file, 'utf8');
          fs.writeFileSync(file, html
            .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, '')
            .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:url|twitter:url)["'][^>]*>/gi, ''));
        }
      }
    }
    removeProductionShareMetadata(output);
    fs.writeFileSync(path.join(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
    fs.renameSync(output, destination);
  } finally { fs.rmSync(temporary, {recursive: true, force: true}); }
}

function serve(directory, port = 4173, temporary) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid preview port');
  const root = fs.realpathSync(directory);
  const server = new EventEmitter();
  let closed = false;
  let endpoint = null;
  let failure;
  const worker = fork(path.join(__dirname, 'preview_server.cjs'), [JSON.stringify({
    root, port, temporary, executable:process.env.PANACK_HTTP_SERVER || 'panack-http-server'
  })], {stdio:['ignore','ignore','pipe','ipc']});
  const completed = new Promise(resolve => worker.once('close', resolve));
  server.address = () => endpoint;
  server.close = () => {
    if (!closed && worker.connected) worker.send({stop:true}, () => {});
    return completed;
  };
  const failed = message => {
    if (failure) return;
    failure = new Error(message);
    if (/bind failed/.test(message)) failure.code = 'EADDRINUSE';
    server.emit('error', failure);
  };
  // Store failures even when a caller is between attaching lifecycle listeners.
  server.on('error', () => {});
  worker.stderr.on('data', chunk => process.stderr.write(chunk));
  worker.on('message', message => {
    if (message.ready) {
      endpoint = {address:'127.0.0.1', port:message.port};
      server.pid = message.pid;
      server.emit('listening');
    }
    if (message.diagnostic) process.stderr.write(message.diagnostic);
    if (message.error) failed(message.error);
    if (message.closed) closed = true;
  });
  worker.once('error', error => failed(error.message));
  worker.once('close', () => {
    if (!closed) failed('Preview supervisor stopped unexpectedly');
    closed = true;
    server.emit('close');
  });
  return server;
}

async function start(root, metadata, port = 4173, archive) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'panackelty-preview-'));
  const directory = path.join(temporary, 'site');
  let server;
  let stopped = false;
  let stopping;
  const cleanup = () => fs.rmSync(temporary, {recursive:true, force:true});
  const detach = () => {
    process.removeListener('exit', exit);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  };
  const stop = () => {
    if (stopping) return stopping;
    stopped = true;
    stopping = (async () => {
      if (server) await server.close();
      cleanup();
      detach();
    })();
    return stopping;
  };
  // After spawn the supervisor owns cleanup and observes parent death through IPC.
  const exit = () => { if (!server) cleanup(); };
  const interrupt = () => { stop().then(() => process.exit(0)); };
  process.once('exit', exit);
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    await build(root, directory, metadata, archive);
    if (stopped) throw new Error('Preview startup cancelled');
    server = serve(directory, port, temporary);
    server.once('close', () => { cleanup(); detach(); });
    await once(server, 'listening');
    return {server, directory, stop};
  } catch (error) {
    await stop();
    throw error;
  }
}

module.exports = {build, serve, start};
if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const [command = 'start', output = 'build/preview', port = '4173'] = args;
  const validPort = value => /^\d+$/.test(value) && +value > 0 && +value < 65536;
  const metadata = () => {
    const git = args => execFileSync('git', args, {encoding: 'utf8'}).trim();
    return {commit: git(['rev-parse','HEAD']),
      dirty: git(['status','--porcelain','--untracked-files=normal']) !== '',
      repository: process.env.GITHUB_REPOSITORY || 'sproates/panackelty-website',
      ...(process.env.PREVIEW_HEAD_SHA ? {headCommit:process.env.PREVIEW_HEAD_SHA,baseCommit:process.env.PREVIEW_BASE_SHA} : {})};
  };
  if (command === 'start' && args.length <= 2 && validPort(args[1] || '4173')) {
    const selectedPort = +(args[1] || '4173');
    console.log('Building a fresh local preview...');
    const session = await start(process.cwd(), metadata(), selectedPort);
    session.server.on('error', error => { console.error(error.message); process.exitCode = 1; });
    console.log(`Preview: http://127.0.0.1:${selectedPort}/\nStop with Ctrl-C. After editing, stop and rerun to rebuild, then refresh your browser.`);
  } else if (command === 'build' && args.length <= 2) {
    await build(process.cwd(), output, metadata());
    console.log(`Preview built at ${output}`);
  } else if (command === 'serve' && args.length <= 3 && validPort(port)) {
    const server = serve(output, +port);
    const stop = () => server.close().then(() => process.exit(0));
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    server.once('close', () => {
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
    });
    server.on('listening', () => console.log(`Preview: http://127.0.0.1:${port}/`))
      .on('error', error => { console.error(error.message); process.exitCode = 1; });
  } else throw new Error('Usage: node scripts/preview.cjs [start [port] | build [output] | serve [output] [port]]');
})().catch(error => {
  console.error(error.code === 'EADDRINUSE' ? 'Preview port is already in use. Stop the other server or choose another port: node scripts/preview.cjs start 4180' : error.message);
  process.exitCode = 1;
});
