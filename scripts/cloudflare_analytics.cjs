const fs = require('node:fs');
const path = require('node:path');

const marker = '<!-- Cloudflare Web Analytics -->';

function htmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file);
  }
  return files;
}

function install(directory, {token = process.env.PANACKELTY_CF_WEB_ANALYTICS_TOKEN, preview = process.env.PANACKELTY_PREVIEW_DRAFTS === '1'} = {}) {
  if (preview || !token) return 0;
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) throw new Error('Invalid Cloudflare Web Analytics site token');
  const snippet = `${marker}<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script><!-- End Cloudflare Web Analytics -->`;
  const files = htmlFiles(directory);
  const pages = files.map(file => {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes(marker)) throw new Error(`${file}: Cloudflare Web Analytics snippet is already present`);
    if (!/<\/body>/i.test(html)) throw new Error(`${file}: cannot install Cloudflare Web Analytics without a closing body tag`);
    return {file, html:html.replace(/<\/body>/i, `${snippet}\n</body>`)};
  });
  for (const page of pages) fs.writeFileSync(page.file, page.html);
  return pages.length;
}

if (require.main === module) {
  try {
    const directory = path.resolve(process.argv[2]);
    const count = install(directory);
    if (count) console.log(`Added Cloudflare Web Analytics to ${count} production pages.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {install};
