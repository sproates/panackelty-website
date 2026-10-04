const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const requireMain=require('../scripts/require_current_main.cjs');
const context={repo:{owner:'sproates',repo:'panackelty-website'},ref:'refs/heads/main',sha:'a'.repeat(40)};
const api=sha=>({rest:{repos:{getBranch:async args=>{
  assert.deepEqual(args,{...context.repo,branch:'main'});
  return {data:{commit:{sha}}};
}}}});
test('only exact current main may publish, including reruns',async()=>{
  await requireMain(api(context.sha),context);
  await assert.rejects(requireMain(api('b'.repeat(40)),context),/stale/);
  await assert.rejects(requireMain(api(undefined),context),/stale/);
  await assert.rejects(requireMain(api(context.sha),{...context,ref:'refs/pull/1/merge'}),/main source/);
  await assert.rejects(requireMain({rest:{repos:{getBranch:async()=>{throw new Error('API unavailable');}}}},context),/API unavailable/);
});
test('main currency gate is immediately before the Pages deployment',()=>{
  const workflow=fs.readFileSync('.github/workflows/check.yml','utf8');
  assert.match(workflow,/await require\('\.\/validation-source\/scripts\/require_current_main.cjs'\)\(github, context\);\n      - uses: actions\/deploy-pages@v5/);
});
