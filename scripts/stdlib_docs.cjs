// Reviewed portable documentation snapshot; no core build or network dependency.
const fs = require('node:fs');
const path = require('node:path');
const {markdown} = require('./articles.cjs');
const root = path.resolve(__dirname,'..');
const metadata = require('../docs/stdlib/snapshot.json');
const escape = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function headings(source) {
  let fence=false;
  return source.split('\n').flatMap(line=>{
    if(line.startsWith('```')){fence=!fence;return [];}
    const m=!fence&&line.match(/^(#{2,3}) (.+)$/);
    return m?[{level:m[1].length,text:m[2].replace(/`/g,''),id:slug(m[2])}]:[];
  });
}
function renderMarkdown(source) {
  const lines=source.split('\n');
  let output=[],pending=[],fenced=false;
  const flush=()=>{if(pending.length){output.push(markdown(pending.join('\n'),'../../'));pending=[];}};
  const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(cell=>cell.trim());
  const inline=cell=>markdown(cell,'../../').replace(/^<p>|<\/p>$/g,'');
  for(let i=0;i<lines.length;i++){
    if(lines[i].startsWith('```'))fenced=!fenced;
    if(!fenced&&lines[i].startsWith('|')&&/^\|[ :|\-]+\|$/.test(lines[i+1]||'')){
      flush();const header=cells(lines[i]);i+=2;let rows=[];
      while(i<lines.length&&lines[i].startsWith('|')){rows.push(cells(lines[i]));i++;}i--;
      if(rows.some(row=>row.length!==header.length))throw new Error('Inconsistent documentation table');
      output.push('<div class="stdlib-table" role="region" aria-label="Scrollable API comparison" tabindex="0"><table><thead><tr>'+header.map(c=>'<th scope="col">'+inline(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>');
    } else pending.push(lines[i]);
  }
  flush();return output.join('\n');
}
function render(doc) {
  if(!/^[0-9a-f]{40}$/.test(metadata.revision))throw new Error('Invalid core snapshot revision');
  let source=fs.readFileSync(path.join(root,'docs/stdlib',doc.name),'utf8').replace(/^# [^\n]+\n/,'');
  for(const example of doc.examples) {
    const code=fs.readFileSync(path.join(root,'docs/stdlib/examples',example.file),'utf8');
    source+='\n## Complete example: '+example.title+'\n\n```panack\n'+code.trimEnd()+'\n```\n';
  }
  source=source.split(/(```[\s\S]*?```)/g).map(part=>part.startsWith('```')?part:part.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,target)=>{
    if(/^(https?:|\/)/.test(target))return `[${label}](${target})`;
    const [file,fragment]=target.split('#');
    const resolved=file?path.posix.normalize(path.posix.join(path.posix.dirname(doc.source),file)):doc.source;
    const destination=metadata.documents.find(d=>d.source===resolved||(d.aliases||[]).includes(resolved));
    if(destination)return `[${label}](/${destination.route}/${fragment?'#'+fragment:''})`;
    for(const page of metadata.documents){const example=page.examples.find(e=>e.source===resolved);if(example)return `[${label}](/${page.route}/#${slug('Complete example: '+example.title)})`;}
    return `[${label}](https://github.com/${metadata.repository}/blob/${metadata.revision}/${resolved}${fragment?'#'+fragment:''})`;
  })).join('');
  const toc=headings(source).map(h=>`<li class="toc-level-${h.level}"><a href="#${h.id}">${escape(h.text)}</a></li>`).join('\n');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#15130f"><meta name="description" content="${escape(doc.intro)}">
<link rel="canonical" href="https://panackelty.com/${doc.route}/">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../styles.css"><link rel="stylesheet" href="../../chrome.css">
<title>${escape(doc.title)} — Panackelty</title>
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
<!-- SITE_HEADER -->
<main id="main" class="capabilities-page http-docs${doc.apiReference ? ' stdlib-api-reference' : ''}">
<section class="capabilities-hero" aria-labelledby="page-title">
<p class="eyebrow">Alpha.16 · development documentation</p>
<h1 id="page-title">${escape(doc.title)}</h1><p class="lede">${escape(doc.intro)}</p>
<p><strong>Not available in the alpha.15 release or browser playground.</strong> These pages describe the native development branch. <a href="../../api/#stdlib-development">Browse the stdlib guides</a>.</p>
</section>
<div class="capabilities-layout"><nav class="capabilities-toc" aria-label="On this page"><p class="eyebrow">On this page</p><ul>${toc}</ul></nav>
<article class="capabilities-content http-docs-content">${doc.apiReference ? '<p><a href="../standard-library/">All standard library modules</a></p>' : ''}${renderMarkdown(source)}${doc.apiReference ? '<p class="source-reference">Implementation: <a href="https://github.com/'+metadata.repository+'/blob/'+metadata.revision+'/'+doc.source+'">view source on GitHub</a>.</p>' : ''}</article></div>
<!-- SITE_CLOSING -->
</main><!-- SITE_FOOTER -->
<script src="../../site.js" defer></script>
</body></html>
`;
}
function run(check=false){for(const doc of metadata.documents){const file=path.join(root,'site',doc.route,'index.html'),html=render(doc);if(check){if(fs.readFileSync(file,'utf8')!==html)throw new Error('Regenerate '+doc.route);}else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,html);}}}
module.exports={run,render,documents:metadata.documents};
if(require.main===module)run(process.argv.includes('--check'));
