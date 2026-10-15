// Own the tool independently so loss of the launcher IPC channel also stops it.
const fs = require('node:fs');
const {execFile, spawn} = require('node:child_process');
const configuration = JSON.parse(process.argv[2]);
const {protocol} = require('../preview-tool.json');
let child;
let stopping = false;
let finished = false;
let startupTimer;
let killTimer;
let diagnostics = '';
let output = '';
let ready = false;
let diagnosticPending = '';
let diagnosticSending = false;
function forwardDiagnostic(text) {
  diagnosticPending = (diagnosticPending + text).slice(-8192);
  if (diagnosticSending || !process.connected || !diagnosticPending) return;
  const diagnostic = diagnosticPending;
  diagnosticPending = '';
  diagnosticSending = true;
  process.send({diagnostic}, () => {
    diagnosticSending = false;
    forwardDiagnostic('');
  });
}
const send = message => {
  if (process.connected) process.send(message, () => {});
};
function finish(error) {
  if (finished) return;
  finished = true;
  clearTimeout(startupTimer);
  clearTimeout(killTimer);
  // Only start() passes a directory it created. serve() never owns its input.
  if (configuration.temporary) fs.rmSync(configuration.temporary, {recursive:true, force:true});
  if (error) send({error});
  send({closed:true});
  if (process.connected) process.disconnect();
}
function stop(error) {
  if (stopping || finished) return;
  stopping = true;
  clearTimeout(startupTimer);
  if (!child) { finish(error); return; }
  if (error) send({error});
  child.kill('SIGTERM');
  killTimer = setTimeout(() => child.kill('SIGKILL'), 3000);
}
process.once('disconnect', () => stop());
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
process.on('message', message => { if (message.stop) stop(); });

execFile(configuration.executable, ['--version'], {timeout:3000, maxBuffer:1024}, (error, stdout) => {
  if (stopping) return;
  if (error || stdout !== protocol + '\n') {
    finish('Preview needs panack-http-server protocol 1. Install the pinned tool described in README.md, or set PANACK_HTTP_SERVER to its executable path.');
    return;
  }
  child = spawn(configuration.executable, ['--root', configuration.root, '--host', '127.0.0.1',
    '--port', String(configuration.port), '--no-cache', '--noindex'], {stdio:['ignore','pipe','pipe']});
  startupTimer = setTimeout(() => stop('Preview server readiness timed out'), 10000);
  child.stdout.on('data', chunk => {
    if (ready || stopping) return;
    output += chunk.toString();
    if (output.length > 1024) { stop('Invalid preview server readiness output'); return; }
    const expected = `Serving http://127.0.0.1:${configuration.port}/\n`;
    if (output === expected) {
      ready = true;
      clearTimeout(startupTimer);
      send({ready:true, port:configuration.port, pid:child.pid});
    } else if (output.includes('\n')) stop('Invalid preview server readiness output');
  });
  child.stderr.on('data', chunk => {
    diagnostics = (diagnostics + chunk.toString()).slice(-8192);
    if (ready) forwardDiagnostic(chunk.toString());
  });
  child.once('error', error => finish(`Cannot start preview server: ${error.message}`));
  child.once('close', (code, signal) => {
    if (stopping) finish();
    else finish(`Preview server ${ready ? 'stopped unexpectedly' : 'failed before readiness'} (${signal || code})${diagnostics ? ': ' + diagnostics.trim() : ''}`);
  });
});
