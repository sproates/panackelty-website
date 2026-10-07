const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sitemap = fs.readFileSync(path.join(root, 'site/sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

test('sitemap lists the canonical public website routes once', () => {
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, /<\/urlset>\s*$/);
  assert.deepEqual(urls, [
    'https://panackelty.com/',
    'https://panackelty.com/capabilities/',
    'https://panackelty.com/get-started/',
    'https://panackelty.com/examples/',
    'https://panackelty.com/explain/',
    'https://panackelty.com/under-the-hood/',
    'https://panackelty.com/roadmap/',
    'https://panackelty.com/about/',
    'https://panackelty.com/playground/',
    'https://panackelty.com/releases/',
  ]);
  assert.equal(new Set(urls).size, urls.length);
  for (const url of urls) assert.match(url, /^https:\/\/panackelty\.com\//);
});

test('robots.txt allows ordinary crawling and advertises the hosted sitemap', () => {
  const robots = fs.readFileSync(path.join(root, 'site/robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\nAllow: \/\nSitemap: https:\/\/panackelty\.com\/sitemap\.xml\n$/);
});
