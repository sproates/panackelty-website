const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {validate,download}=require('../scripts/check_native_release.cjs');

test('installer and advertised native downloads remain on the reviewed release', t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'native-pin-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.cpSync('site',path.join(root,'site'),{recursive:true});
  fs.copyFileSync('release-source.json',path.join(root,'release-source.json'));
  const original=fs.readFileSync(path.join(root,'site/get-started/index.html'),'utf8');
  const pin=validate(root);
  const source=JSON.parse(fs.readFileSync('release-source.json'));
  assert.equal(pin.version,fs.readFileSync('site/native-release.txt','utf8').trim());
  for (const html of [original.replaceAll(source.installerCommit,'main'),
    original.replace(`| sh -s -- --version ${pin.version}`,'| sh'),
    original.replace(`releases/download/v${pin.version}`,'releases/download/v999.0.0-alpha.1')]) {
    fs.writeFileSync(path.join(root,'site/get-started/index.html'),html);
    assert.throws(()=>validate(root),/Installer|download targets/);
  }
  fs.writeFileSync(path.join(root,'site/get-started/index.html'),original);
  fs.writeFileSync(path.join(root,'site/native-release.txt'),'999.0.0-alpha.1\n');
  assert.throws(()=>validate(root),/inconsistent/);
});

test('native download rejects unavailable, tampered and changed-checksum releases',async()=>{
  const archive=Buffer.from('fixture'),digest=createHash('sha256').update(archive).digest('hex');
  const pin={version:'0.1.0-alpha.11',sha256:{'linux-x86_64':digest}};
  const checksum=`${digest}  panackelty-${pin.version}-linux-x86_64.tar.gz\n`;
  const fetcher=async url=>new Response(url.endsWith('.sha256')?checksum:archive);
  assert.deepEqual(await download(pin,'linux-x86_64',fetcher),archive);
  await assert.rejects(download(pin,'linux-x86_64',async()=>new Response('',{status:404})),/unavailable/);
  await assert.rejects(download(pin,'linux-x86_64',async url=>new Response(url.endsWith('.sha256')?checksum:'tampered')),/checksum/);
  await assert.rejects(download(pin,'linux-x86_64',async url=>new Response(url.endsWith('.sha256')?'unreviewed':archive)),/checksum/);
});
