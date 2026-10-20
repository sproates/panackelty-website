// Core Markdown is the authoring source. Keep a portable snapshot for site builds.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {markdown} = require('./articles.cjs');
const root = path.resolve(__dirname, '..');
const documents = [
  {source:'docs/reference/http-server.md', name:'http-server.md', route:'reference/http-server', title:'HTTP Server', label:'API reference', intro:'Signatures, behaviour and limits for the routed HTTP server.'},
  {source:'docs/guides/HTTP_PLAYBOOK.md', name:'HTTP_PLAYBOOK.md', route:'playbook/http-server', title:'HTTP server playbook', label:'Playbook', intro:'Start a server. Send a request. Build from a working example.'},
];
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const githubSlug = s => s.toLowerCase().replace(/[`.,:()[\]]/g,'').replace(/ /g,'-');
function headings(source) {
  let fence = false;
  return source.split('\n').flatMap(line => {
    if (line.startsWith('```')) { fence = !fence; return []; }
    const m = !fence && line.match(/^(#{2,3}) (.+)$/);
    return m ? [{level:m[1].length, text:m[2].replace(/`/g,''), id:slug(m[2]), github:githubSlug(m[2])}] : [];
  });
}
function render(doc, sources) {
  let source = sources[doc.name].replace(/^# [^\n]+\n/, '').replace(/\n## API index\n[\s\S]*?(?=\n## Import and first server)/, '');
  source = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (whole, label, target) => {
    label = label.replace(/`/g, "");
    if (/^https?:/.test(target)) return `[${label}](${target})`;
    const [file, fragment] = target.split('#');
    const resolved = file ? path.posix.normalize(path.posix.join(path.posix.dirname(doc.source),file)) : doc.source;
    const destination = documents.find(d => d.source === resolved);
    if (!destination) return `[${label}](https://github.com/sproates/panackelty/blob/next/${resolved}${fragment ? '#'+fragment : ''})`;
    const h = headings(sources[destination.name]).find(h => h.github === fragment || h.id === fragment);
    if (fragment && !h) throw new Error(`Unknown heading: ${target}`);
    return `[${label}](/${destination.route}/${fragment ? '#'+h.id : ''})`;
  });
  const toc = headings(source).map(h => `<li class="toc-level-${h.level}"><a href="#${h.id}">${escape(h.text)}</a></li>`).join('\n');
  const body = markdown(source, '../../');
  const companion = documents.find(d => d !== doc);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#15130f"><meta name="description" content="${escape(doc.intro)}">
<link rel="canonical" href="https://panackelty.com/${doc.route}/">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="../../chrome.css">
<title>${doc.title} — Panackelty</title>
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<!-- SITE_HEADER -->
<main id="main" class="capabilities-page http-docs">
<section class="capabilities-hero" aria-labelledby="page-title">
<p class="eyebrow">${doc.label} · alpha.14 development</p>
<h1 id="page-title">${doc.title}</h1><p class="lede">${doc.intro}</p>
<p><a href="../../${companion.route}/">${doc === documents[0] ? 'Start here: HTTP server playbook →' : 'Looking up a method? HTTP Server reference →'}</a></p>
</section>
<div class="capabilities-layout">
<nav class="capabilities-toc" aria-label="On this page"><p class="eyebrow">On this page</p><ul>${toc}</ul></nav>
<article class="capabilities-content http-docs-content">${body}</article>
</div>
<!-- SITE_CLOSING -->
</main>
<!-- SITE_FOOTER -->
<script src="../../site.js" defer></script>
</body></html>
`;
}
function run(core, check = false) {
  const dir = path.join(root,'docs/http');
  const sources = {};
  for (const doc of documents) {
    const file = path.join(dir,doc.name);
    if (core) {
      const original = fs.readFileSync(path.join(core,doc.source),'utf8');
      if (check) {
        if (fs.readFileSync(file,'utf8') !== original) throw new Error(`Core/site mismatch: ${doc.source}`);
      } else { fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(file,original); }
    }
    sources[doc.name] = fs.readFileSync(file,'utf8');
  }
  for (const doc of documents) {
    const file = path.join(root,'site',doc.route,'index.html');
    const html = render(doc,sources);
    if (check) { if (fs.readFileSync(file,'utf8') !== html) throw new Error(`Regenerate ${doc.route}`); }
    else { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,html); }
  }
  return documents.map(doc => ({source:doc.source, sha256:crypto.createHash('sha256').update(sources[doc.name]).digest('hex')}));
}
module.exports = {run,render,documents};
if (require.main === module) {
  const args = process.argv.slice(2);
  const coreIndex = args.indexOf('--core');
  const core = coreIndex === -1 ? undefined : args[coreIndex+1];
  if (coreIndex !== -1 && !core) throw new Error('--core requires a checkout path');
  console.log(JSON.stringify(run(core,args.includes('--check')),null,2));
}
