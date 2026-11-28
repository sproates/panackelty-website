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
    'https://panackelty.com/playground/',
    'https://panackelty.com/releases/',
    'https://panackelty.com/previous-releases/',
    'https://panackelty.com/api/',
    'https://panackelty.com/reference/http-client/',
    'https://panackelty.com/reference/http-server/',
    'https://panackelty.com/playbook/http-server/',
    'https://panackelty.com/reference/standard-library/',
    'https://panackelty.com/playbook/stdlib-migration/',
    'https://panackelty.com/playbook/async-resources/',
    'https://panackelty.com/playbook/async-input-and-files/',
    'https://panackelty.com/playbook/async-stdlib/',
    'https://panackelty.com/reference/stdlib-time/',
    'https://panackelty.com/reference/stdlib-environment/',
    'https://panackelty.com/reference/stdlib-console/',
    'https://panackelty.com/reference/stdlib-process/',
    'https://panackelty.com/reference/stdlib-filesystem/',
    'https://panackelty.com/reference/stdlib-filesystem-confined/',
    'https://panackelty.com/reference/stdlib-filesystem-staging/',
    'https://panackelty.com/reference/stdlib-sha256/',
    'https://panackelty.com/reference/stdlib-gzip/',
    'https://panackelty.com/reference/stdlib-http-stream/',
    'https://panackelty.com/reference/stdlib-tcp/',
    'https://panackelty.com/reference/stdlib-bytecode/',
    'https://panackelty.com/reference/stdlib-path/',
    'https://panackelty.com/reference/stdlib-utf8/',
    'https://panackelty.com/reference/stdlib-bytes/',
    'https://panackelty.com/reference/stdlib-testing/',
    'https://panackelty.com/reference/stdlib-testing-reporting/',
    'https://panackelty.com/reference/stdlib-testing-filesystem/',
    'https://panackelty.com/reference/stdlib-testing-process/',
    'https://panackelty.com/reference/stdlib-state/',
    'https://panackelty.com/playbook/callables-and-state/',
    'https://panackelty.com/playbook/anonymous-functions/',
    'https://panackelty.com/playbook/closures/',
    'https://panackelty.com/playbook/state/',
  ]);
  assert.equal(new Set(urls).size, urls.length);
  for (const url of urls) assert.match(url, /^https:\/\/panackelty\.com\//);
});

test('robots.txt allows ordinary crawling and advertises the hosted sitemap', () => {
  const robots = fs.readFileSync(path.join(root, 'site/robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\nAllow: \/\nSitemap: https:\/\/panackelty\.com\/sitemap\.xml\n$/);
});
