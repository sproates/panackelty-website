// A stale rerun must not replace a newer website; lookup errors fail closed.
module.exports = async function requireCurrentMain(github, context) {
  if (context.ref !== 'refs/heads/main' || !/^[a-f0-9]{40}$/.test(context.sha)) {
    throw new Error('Publication requires a valid main source');
  }
  const {data} = await github.rest.repos.getBranch({...context.repo, branch:'main'});
  if (data?.commit?.sha !== context.sha) {
    throw new Error('Refusing to deploy a stale website: validated source is no longer main');
  }
};
