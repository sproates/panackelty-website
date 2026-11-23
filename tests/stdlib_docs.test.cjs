const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {run,documents}=require('../scripts/stdlib_docs.cjs');
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
test('stdlib development pages retain exact examples and resolve local anchors',()=>{
  run(true);
  for(const doc of documents){
    const html=fs.readFileSync(`site/${doc.route}/index.html`,'utf8');
    assert.match(html,/Not available in the alpha\.15 release or browser playground/);
    assert(!html.includes('\u0000'));
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length);
    for(const [,id]of html.matchAll(/href="#([^"]+)"/g))assert(ids.includes(id),`${doc.route}: ${id}`);
    for(const [,href]of html.matchAll(/href="(\.\.\/\.\.\/[^"]+)"/g)){
      const [file,anchor]=href.split('#');
      if(!anchor)continue;
      const dest=path.resolve('site',doc.route,file,'index.html');
      assert(fs.readFileSync(dest,'utf8').includes(`id="${anchor}"`),`missing destination anchor ${href}`);
    }
    const blocks=[...html.matchAll(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)].map(m=>decode(m[1]));
    for(const ex of doc.examples){const source=fs.readFileSync(`docs/stdlib/examples/${ex.file}`,'utf8').trimEnd();assert(blocks.includes(source),`changed code: ${ex.file}`);}
  }
});
test('module and migration comparisons render as tables, not pipe-delimited prose',()=>{
  for(const route of ['reference/standard-library','playbook/stdlib-migration']){
    const html=fs.readFileSync(`site/${route}/index.html`,'utf8');
    assert.match(html,/<table><thead>/);assert.match(html,/class="stdlib-table"/);
    assert.doesNotMatch(html,/<p>\|/);
  }
});
