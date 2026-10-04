// Presentation/docs changes use smoke coverage; integration and unknown paths
// retain the full suite. Invalid or unavailable revisions fail closed to full.
const {execFileSync}=require('node:child_process');
function mode(paths) {
  const presentation=/^(?:README\.md|CONTRIBUTING\.md|ROADMAP\.md|CHANGELOG\.md|docs\/[^\n]+\.md|site\/(?:styles\.css|chrome\.css|favicon\.svg))$/;
  return paths.length && paths.every(p=>presentation.test(p)) ? 'smoke' : 'full';
}
function select(base,head,git=args=>execFileSync('git',args,{encoding:'utf8'})) {
  if (![base,head].every(x=>/^[a-f0-9]{40}$/.test(x||'')) || /^0+$/.test(base)) return 'full';
  try { return mode(git(['diff','--name-only','--no-renames','-z',base,head]).split('\0').filter(Boolean)); }
  catch { return 'full'; }
}
module.exports={mode,select};
if(require.main===module) console.log(select(process.env.SCOPE_BASE,process.env.SCOPE_HEAD));
