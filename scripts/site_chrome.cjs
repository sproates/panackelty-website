// Homepage owns the shared header and footer for every assembled page.
const fs = require('node:fs');
const path = require('node:path');
const routes = ['explain', 'capabilities', 'get-started', 'examples', 'roadmap', 'previous-releases', 'under-the-hood', 'releases', 'playground', 'articles', 'article', 'article-tag', 'article-page', 'coverage', 'coverage/html', 'api', 'reference/http-client', 'reference/http-server', 'playbook/http-server'];
function once(text, needle, replacement) {
  if (text.split(needle).length !== 2) throw new Error(`site chrome: expected one ${needle}`);
  return text.replace(needle, () => replacement);
}
function render(home, html, page, release) {
  const headers = [...home.matchAll(/<header class="site-header">[\s\S]*?<\/header>/g)];
  const footers = [...home.matchAll(/<footer>[\s\S]*?<\/footer>/g)];
  if (headers.length !== 1 || footers.length !== 1) throw new Error('site chrome: invalid homepage chrome');
  if (page !== 'home' && !routes.includes(page)) throw new Error('site chrome: unknown page');
  const roots = {home: './', article: '../../', 'article-tag': '../../../', 'article-page': '../../../', 'coverage/html': '../../', 'reference/http-client': '../../', 'reference/http-server': '../../', 'playbook/http-server': '../../'};
  const root = roots[page] || (page === 'home' ? './' : '../');
  const relative = text => text.replace(/href="\.\/"/g, `href="${root}"`)
    .replace(/href="(api|explain|capabilities|get-started|examples|roadmap|previous-releases|under-the-hood|releases|playground|articles|reference\/http-client|reference\/http-server|playbook\/http-server)\/"/g, (_, route) => `href="${root}${route}/"`);
  let header = relative(headers[0][0]), footer = relative(footers[0][0]);
  const closing = relative(home.match(/<section class="closing">[\s\S]*?<\/section>/)?.[0] || '');
  if (html.includes('<!-- SITE_CLOSING -->')) html = once(html, '<!-- SITE_CLOSING -->', closing);
  const currentRoute = ['article', 'article-tag', 'article-page'].includes(page) ? 'articles' : page === 'previous-releases' ? 'roadmap' : page;
  const current = `href="${page === 'home' ? root : root + currentRoute + '/'}"`;
  if (header.includes(current)) header = once(header, current, current + ' aria-current="page"');
  else if (footer.includes(current)) footer = once(footer, current, current + ' aria-current="page"');
  // Older pinned browser artifacts predate the core documentation move.
  if (page === 'playground') {
    html = html.replaceAll('https://github.com/sproates/panackelty/blob/main/SPEC.md',
      'https://github.com/sproates/panackelty/blob/main/docs/reference/SPEC.md');
  }
  if (page === 'playground' && release) {
    if (!/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(release.tag) ||
        !/^[0-9]+\.[0-9]+\.[0-9]+-alpha\.[0-9]+$/.test(release.coreVersion) ||
        !Number.isSafeInteger(release.bytecodeVersion) || release.bytecodeVersion < 1) {
      throw new Error('site chrome: invalid reviewed playground version');
    }
    const notes = html.match(/<p class="version-note">[\s\S]*?<\/p>/g) || [];
    if (notes.length !== 1) throw new Error('site chrome: expected one playground version note');
    html = once(html, notes[0], `<p class="version-note">Experimental browser edition ${release.tag} · compiler based on native ${release.coreVersion} · bytecode v${release.bytecodeVersion}. Browser host capabilities remain limited.</p>`);
  }
  if (page === 'home' || page === 'playground') {
    const shell = html.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
    if (!shell) throw new Error('site chrome: missing site header');
    html = once(html, shell, header);
    if (page === 'home') html = once(html, footers[0][0], footer);
    else {
      html = once(html, '</body>', footer + '\n<script src="../site.js" defer></script>\n</body>');
      html = once(html, '</head>', '<link rel="stylesheet" href="../chrome.css">\n</head>');
    }
  } else {
    html = once(html, '<!-- SITE_HEADER -->', header);
    html = once(html, '<!-- SITE_FOOTER -->', footer);
  }
  return html;
}
module.exports = render;
if (require.main === module) {
  try { process.stdout.write(render(fs.readFileSync(process.argv[2], 'utf8'), fs.readFileSync(process.argv[3], 'utf8'), process.argv[4], process.argv[4] === 'playground' ? JSON.parse(fs.readFileSync(path.join(path.dirname(process.argv[2]), 'playground.json'), 'utf8')) : undefined)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
