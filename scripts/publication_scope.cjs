// Only regular Markdown articles/drafts can bypass unrelated native/browser tests.
// Missing history, mixed changes and unusual Git entries retain full validation.
const {execFileSync}=require('node:child_process');
function select(base,head,git=args=>execFileSync('git',args,{encoding:'utf8'})) {
  if (![base,head].every(x=>/^[a-f0-9]{40}$/.test(x||'')) || /^0+$/.test(base)) return 'full';
  try {
    const paths=git(['diff','--name-only','--no-renames','-z',base,head]).split('\0').filter(Boolean);
    if (!paths.length || !paths.every(p=>/^(content\/articles|drafts)\/[a-z0-9][a-z0-9-]*\.md$/.test(p))) return 'full';
    for (const ref of [base,head]) for (const p of paths) {
      const entry=git(['ls-tree',ref,'--',p]);
      if (entry && !entry.startsWith('100644 blob ')) return 'full';
    }
    return 'articles';
  } catch { return 'full'; }
}
module.exports={select};
if(require.main===module) console.log(select(process.env.SCOPE_BASE,process.env.SCOPE_HEAD));
