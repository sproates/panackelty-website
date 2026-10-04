// Test only the explicitly promoted release; never build or execute core HEAD.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');

function validate(root = '.') {
  const pin = JSON.parse(fs.readFileSync(path.join(root, 'site/native-release.json')));
  if (!/^\d+\.\d+\.\d+-alpha\.\d+$/.test(pin.version) ||
      fs.readFileSync(path.join(root, 'site/native-release.txt'), 'utf8').trim() !== pin.version ||
      !['linux-x86_64','macos-arm64'].every(platform => /^[a-f0-9]{64}$/.test(pin.sha256?.[platform]))) {
    throw new Error('Invalid or inconsistent native release pin');
  }
  const source = JSON.parse(fs.readFileSync(path.join(root, 'release-source.json')));
  if (source.repository !== 'sproates/panackelty' || !/^[a-f0-9]{40}$/.test(source.installerCommit)) {
    throw new Error('Invalid installer source pin');
  }
  const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
  const command = html.match(/<code id="optional-install-command">([^<]+)<\/code>/)?.[1];
  if (!command?.includes(`/panackelty/${source.installerCommit}/scripts/install.sh | sh -s -- --version ${pin.version}`)) {
    throw new Error('Installer must pin its source and selected release');
  }
  const downloads = [...html.matchAll(/https:\/\/github.com\/sproates\/panackelty\/releases\/download\/v([^\s<]+)/g)];
  if (downloads.length !== 2 || downloads.some(match => match[1] !== pin.version)) {
    throw new Error('Website download targets differ from the promoted release');
  }
  return pin;
}

async function download(pin, platform, fetcher = fetch) {
  const filename = `panackelty-${pin.version}-${platform}.tar.gz`;
  const base = `https://github.com/sproates/panackelty/releases/download/v${pin.version}/${filename}`;
  const [archive, checksum] = await Promise.all([base, base + '.sha256'].map(async url => {
    const response = await fetcher(url, {signal: AbortSignal.timeout(60000)});
    if (!response.ok) throw new Error(`Native release unavailable (${response.status})`);
    const chunks=[]; let size=0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > 32*1024*1024) throw new Error('Native release response exceeds 32 MiB');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }));
  if (checksum.toString().trim() !== `${pin.sha256[platform]}  ${filename}` ||
      createHash('sha256').update(archive).digest('hex') !== pin.sha256[platform]) {
    throw new Error('Native release checksum does not match reviewed pin');
  }
  return archive;
}

async function main() {
  const root=process.cwd(), pin=validate(root);
  const platform = process.platform === 'darwin' && process.arch === 'arm64' ? 'macos-arm64'
    : process.platform === 'linux' && process.arch === 'x64' ? 'linux-x86_64' : null;
  if (!platform) throw new Error('Unsupported released native host');
  // Check both advertised platforms, then execute the matching host release.
  const archives = await Promise.all(['linux-x86_64','macos-arm64'].map(p => download(pin,p)));
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'website-release-'));
  try {
    const archive=path.join(temporary,'release.tar.gz');
    fs.writeFileSync(archive,archives[platform === 'linux-x86_64' ? 0 : 1]);
    const entries=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split('\n');
    if (entries.some(name => name.startsWith('/') || name.includes('\\') || name.split('/').includes('..'))) throw new Error('Unsafe native archive path');
    if (execFileSync('tar',['-tvzf',archive],{encoding:'utf8'}).trim().split('\n').some(line => !/^[d-]/.test(line))) throw new Error('Unsafe native archive entry');
    execFileSync('tar',['--no-same-owner','--no-same-permissions','-xzf',archive,'-C',temporary]);
    const command=path.join(temporary,'panackelty/bin/panack');
    if (!execFileSync(command,['--version'],{encoding:'utf8'}).startsWith(`panack ${pin.version} (bytecode `)) throw new Error('Native release version mismatch');
    for (const mode of ['all','capabilities']) execFileSync('sh',['tests/site_examples.sh',mode],{
      cwd:root,env:{...process.env,PANACK_SITE_COMMAND:command},stdio:'inherit',
    });
    console.log(`Verified both download archives and native examples on ${platform}`);
  } finally {fs.rmSync(temporary,{recursive:true,force:true});}
}
module.exports={validate,download};
if (require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});
