// Keep the playground's initial request burst within the preview server's
// bounded admission capacity. The stylesheet bytes and their order are unchanged.
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(process.argv[2]);
const root = path.dirname(path.dirname(file));
const html = fs.readFileSync(file, 'utf8').replace(
  /<link rel="stylesheet" href="([^"]+)">/g,
  (_, href) => {
    const stylesheet = path.resolve(path.dirname(file), href);
    if (!stylesheet.startsWith(root + path.sep)) throw new Error('Stylesheet outside assembled site');
    const css = fs.readFileSync(stylesheet, 'utf8');
    if (/<\/style/i.test(css)) throw new Error('Unexpected style closing tag');
    if (/url\s*\(|@import\b/i.test(css)) throw new Error('Cannot inline stylesheet resources without preserving their asset base');
    return `<style>\n${css}\n</style>`;
  }
);
fs.writeFileSync(file, html);
