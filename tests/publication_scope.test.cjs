const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
const {select}=require('../scripts/publication_scope.cjs');
test('real Git changes select articles only for regular article and draft Markdown',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'article-scope-'));
  const git=args=>execFileSync('git',args,{cwd:dir,encoding:'utf8'});
  const write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(dir,p)),{recursive:true});fs.writeFileSync(path.join(dir,p),s);};
  const commit=()=>{git(['add','.']);git(['-c','user.name=Test','-c','user.email=test@example.com','commit','-qm','fixture']);return git(['rev-parse','HEAD']).trim();};
  try {
    git(['init','-q']);write('content/articles/one.md','first');const base=commit();
    write('content/articles/one.md','edited');const edit=commit();assert.equal(select(base,edit,git),'articles');
    write('drafts/two.md','draft');const draft=commit();assert.equal(select(edit,draft,git),'articles');
    fs.renameSync(path.join(dir,'drafts/two.md'),path.join(dir,'content/articles/two.md'));const published=commit();assert.equal(select(draft,published,git),'articles');
    fs.unlinkSync(path.join(dir,'content/articles/two.md'));const removed=commit();assert.equal(select(published,removed,git),'articles');
    write('scripts/articles.cjs','changed renderer');const mixed=commit();assert.equal(select(base,mixed,git),'full');
    fs.unlinkSync(path.join(dir,'content/articles/one.md'));fs.symlinkSync('../../scripts/articles.cjs',path.join(dir,'content/articles/one.md'));const symlink=commit();assert.equal(select(mixed,symlink,git),'full');
    assert.equal(select(base,base,git),'full');assert.equal(select('',base,git),'full');
    assert.equal(select('0'.repeat(40),base,git),'full');assert.equal(select(base,'f'.repeat(40),git),'full');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('unknown paths, images, workflows and unavailable history retain full validation',()=>{
  for (const file of ['site/images/chart.svg','site/index.html','.github/workflows/check.yml','README.md','content/articles/a.json','drafts/nested/a.md']) {
    assert.equal(select('a'.repeat(40),'b'.repeat(40),()=>file+'\0'),'full');
  }
  assert.equal(select('a'.repeat(40),'b'.repeat(40),()=>{throw Error('unavailable');}),'full');
});
test('article gate requires assembly success and skipped unrelated jobs, never failed jobs',()=>{
  const workflow=fs.readFileSync('.github/workflows/check.yml','utf8');
  const gate=workflow.match(/        run: \|\n(          test "\$LOOKUP"[\s\S]*?)\n\n  publish:/)[1].replace(/^          /gm,'');
  const env={LOOKUP:'success',REUSED_RUN:'',SCOPE:'articles',ASSEMBLY:'success',RELEASE:'skipped',BROWSER:'skipped'};
  const check=env=>spawnSync('/bin/sh',['-e','-c',gate],{env}).status;
  assert.equal(check(env),0);
  for(const key of ['LOOKUP','ASSEMBLY','RELEASE','BROWSER']) for(const value of ['failure','cancelled']) assert.notEqual(check({...env,[key]:value}),0);
  assert.notEqual(check({...env,SCOPE:'unknown'}),0);
  assert.notEqual(check({...env,ASSEMBLY:'skipped'}),0);
  for(const name of ['Read pinned preview tool revision','Check out pinned preview tool source','Install native tool build prerequisites','Build the preview tool once']) assert.ok(workflow.includes(`name: ${name}\n        if: needs.reuse.outputs.scope != 'articles'`));
  for(const job of ['release','browser']) assert.match(workflow.split(`  ${job}:`)[1].split(/\n  [a-z]+:/)[0],/needs.reuse.outputs.scope != 'articles'/);
  assert.match(workflow,/run: node --test tests\/articles.test.cjs tests\/sitemap.test.cjs/);
  assert.match(workflow,/- run: make build/);
  assert.match(workflow,/Verify deployed website bytes and provenance/);
});
