const {test}=require('node:test');
const assert=require('node:assert/strict');
const {findCandidate,verifyCandidate}=require('../scripts/reuse_website_candidate.cjs');
const tree='a'.repeat(40);
const context={eventName:'push',ref:'refs/heads/main',repo:{owner:'sproates',repo:'panackelty-website'}};
function fixture(overrides={}) {
  const run={id:123,event:'pull_request',status:'completed',conclusion:'success',run_attempt:2,
    path:'.github/workflows/check.yml',head_repository:{full_name:'sproates/panackelty-website'},...overrides};
  const artifact={id:456,name:`pages-candidate-${tree}-2`,expired:false,size_in_bytes:100,workflow_run:{id:123}};
  const artifacts=[artifact];
  const github={rest:{actions:{
    listWorkflowRuns:async args=>{assert.equal(args.workflow_id,'check.yml');assert.equal(args.event,'pull_request');return {data:{workflow_runs:[run]}};},
    listWorkflowRunArtifacts:async()=>({data:{artifacts}}),
    getWorkflowRun:async()=>({data:run}),getArtifact:async()=>({data:artifact})
  }}};
  return {run,artifact,artifacts,github};
}
test('matching tested tree is reused across different commit IDs and verified before publication',async()=>{
  const f=fixture({head_sha:'b'.repeat(40)});
  const candidate=await findCandidate(f.github,{...context,sha:'c'.repeat(40)},tree);
  assert.deepEqual(candidate,{run_id:'123',attempt:'2',artifact_name:`pages-candidate-${tree}-2`,artifact_id:'456'});
  await verifyCandidate(f.github,context,candidate,tree);
});
test('PRs, manual runs and non-main pushes always validate afresh',async()=>{
  for(const override of [{eventName:'pull_request'},{eventName:'workflow_dispatch'},{ref:'refs/heads/feature/test'}])
    assert.equal(await findCandidate({}, {...context,...override},tree),null);
});
test('failed, pending, foreign and unrelated workflows cannot supply candidates',async()=>{
  for(const override of [{conclusion:'failure'},{status:'in_progress'},{event:'push'},
    {head_repository:{full_name:'someone/fork'}},{path:'.github/workflows/other.yml'},{run_attempt:0}]) {
    assert.equal(await findCandidate(fixture(override).github,context,tree),null);
  }
});
test('changed trees, old attempts, expired, empty and ambiguous artifacts require fresh validation',async()=>{
  for(const mutate of [f=>{f.artifact.name=`pages-candidate-${'b'.repeat(40)}-2`;},
    f=>{f.artifact.name=`pages-candidate-${tree}-1`;},f=>{f.artifact.expired=true;},
    f=>{f.artifact.size_in_bytes=0;},f=>f.artifacts.push({...f.artifact,id:789}),f=>f.artifacts.pop()]) {
    const f=fixture();mutate(f);assert.equal(await findCandidate(f.github,context,tree),null);
  }
});
test('a rerun, expiration or artifact substitution after selection blocks publication',async()=>{
  for(const mutate of [f=>{f.run.run_attempt=3;},f=>{f.run.conclusion='failure';},
    f=>{f.artifact.expired=true;},f=>{f.artifact.workflow_run.id=999;},f=>{f.artifact.name='other';}]) {
    const f=fixture();const candidate=await findCandidate(f.github,context,tree);mutate(f);
    await assert.rejects(verifyCandidate(f.github,context,candidate,tree));
  }
});
test('API lookup failures are surfaced to the workflow fresh-validation fallback',async()=>{
  const f=fixture();f.github.rest.actions.listWorkflowRuns=async()=>{throw new Error('API unavailable');};
  await assert.rejects(findCandidate(f.github,context,tree),/API unavailable/);
  await assert.rejects(findCandidate(f.github,context,'invalid'),/Invalid source tree/);
});
test('workflow gate accepts only successful fresh validation or a complete reuse path',()=>{
  const fs=require('node:fs');const {spawnSync}=require('node:child_process');
  const workflow=fs.readFileSync('.github/workflows/check.yml','utf8');
  const gate=workflow.match(/        run: \|\n(          test "\$LOOKUP"[\s\S]*?)\n\n  publish:/)[1].replace(/^          /gm,'');
  for (const [states,expected] of [
    [['success','','success','success','success'],0],
    [['success','123','skipped','skipped','skipped'],0],
    [['success','','skipped','success','success'],1],
    [['success','','success','failure','success'],1],
    [['failure','123','skipped','skipped','skipped'],1],
    [['success','123','success','skipped','skipped'],1],
    [['success','123','skipped','skipped','cancelled'],1]
  ]) {
    const env=Object.fromEntries(['LOOKUP','REUSED_RUN','ASSEMBLY','RELEASE','BROWSER'].map((key,i)=>[key,states[i]]));
    assert.equal(spawnSync('/bin/sh',['-e','-c',gate],{env}).status,expected,JSON.stringify(states));
  }
  assert.match(workflow,/if: always\(\) && needs.checks.result == 'success'/);
  assert.match(workflow,/run-id: \$\{\{ needs.reuse.outputs.run_id \|\| github.run_id \}\}/);
  assert.match(workflow,/artifact_name=pages-candidate-\$\(git rev-parse 'HEAD\^\{tree\}'\)-\$\{\{ github.run_attempt \}\}/);
  assert.match(workflow,/artifact_name: \$\{\{ needs.prepare.outputs.artifact_name \}\}/);
});
