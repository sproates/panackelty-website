// Only reuse a completed PR run from this repository with the exact Git tree.
// Artifact names bind the tested tree and run attempt; commit IDs may differ
// after a squash or merge without changing any source files.
function eligibleRun(run, repository) {
  return run.event === 'pull_request' && run.status === 'completed' &&
    run.conclusion === 'success' && run.head_repository?.full_name === repository &&
    run.path === '.github/workflows/check.yml' &&
    Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0;
}
function selectArtifact(run, artifacts, tree) {
  const name = `pages-candidate-${tree}-${run.run_attempt}`;
  const matches = artifacts.filter(a => a.name === name && !a.expired && a.size_in_bytes > 0);
  return matches.length === 1 ? matches[0] : null;
}
async function findCandidate(github, context, tree) {
  if (context.eventName !== 'push' || context.ref !== 'refs/heads/main') return null;
  if (!/^[a-f0-9]{40}$/.test(tree)) throw new Error('Invalid source tree');
  const repository = `${context.repo.owner}/${context.repo.repo}`;
  const {data} = await github.rest.actions.listWorkflowRuns({...context.repo,
    workflow_id:'check.yml', event:'pull_request', status:'success', per_page:30});
  for (const run of data.workflow_runs) {
    if (!eligibleRun(run, repository)) continue;
    const {data:{artifacts}} = await github.rest.actions.listWorkflowRunArtifacts({
      ...context.repo, run_id:run.id, per_page:100});
    const artifact = selectArtifact(run, artifacts, tree);
    if (artifact) return {run_id:String(run.id), attempt:String(run.run_attempt),
      artifact_name:artifact.name, artifact_id:String(artifact.id)};
  }
  return null;
}
async function verifyCandidate(github, context, candidate, tree) {
  const {data:run} = await github.rest.actions.getWorkflowRun({...context.repo, run_id:candidate.run_id});
  if (!eligibleRun(run, `${context.repo.owner}/${context.repo.repo}`) ||
      String(run.run_attempt) !== candidate.attempt) throw new Error('Validation run changed');
  const {data:artifact} = await github.rest.actions.getArtifact({...context.repo, artifact_id:candidate.artifact_id});
  if (!selectArtifact(run, [artifact], tree) || artifact.name !== candidate.artifact_name ||
      String(artifact.workflow_run?.id) !== candidate.run_id) throw new Error('Validated artifact changed or expired');
}
module.exports = {findCandidate, verifyCandidate};
