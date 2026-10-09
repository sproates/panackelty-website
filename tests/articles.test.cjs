const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {build, markdown, parseArticle} = require('../scripts/articles.cjs');

const article = (slug, status, date, tags = ['compiler']) => `---\ntitle: ${slug}\nstatus: ${status}\n${date ? `date: ${date}\n` : ''}tags:\n${tags.map(tag => `  - ${tag}`).join('\n')}\n---\n\nAn article about **${slug}**.\n`;

test('article Markdown renders common prose, links, headings and code safely', () => {
  const html = markdown('# Heading\n\nA `value` and [link](https://example.com/?a=1&b=2).\n\n```panackelty\npure main(): Unit {}\n```\n\n<script>alert(1)</script>');
  assert.match(html, /<h1 id="heading">Heading<\/h1>/);
  assert.match(html, /<code>value<\/code>/);
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
  assert.match(html, /language-panackelty/);
  assert.match(html, /&lt;script/);
});

test('build publishes stable article, topic and paginated archive URLs, while keeping drafts preview-only', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'panackelty-articles-'));
  try {
    const content = path.join(root, 'content/articles'), drafts = path.join(root, 'drafts');
    const output = path.join(root, 'output');
    fs.mkdirSync(content, {recursive:true}); fs.mkdirSync(drafts);
    for (let i = 1; i <= 11; i++) fs.writeFileSync(path.join(content, `article-${String(i).padStart(2, '0')}.md`), article(`Article ${i}`, 'published', `2026-01-${String(i).padStart(2,'0')}`, ['exact arithmetic']));
    fs.writeFileSync(path.join(drafts, 'unpublished-draft.md'), article('Unpublished', 'draft', null));
    fs.mkdirSync(output); fs.writeFileSync(path.join(output, 'sitemap.xml'), '<?xml version="1.0"?><urlset></urlset>');
    const repoSite = path.join(root, 'site'); fs.mkdirSync(repoSite);
    fs.copyFileSync(path.join(__dirname, '../site/index.html'), path.join(repoSite, 'index.html'));
    build(root, output, true);
    const latest = fs.readFileSync(path.join(output, 'articles/index.html'), 'utf8');
    const older = fs.readFileSync(path.join(output, 'articles/page/2/index.html'), 'utf8');
    const oldest = fs.readFileSync(path.join(output, 'articles/page/3/index.html'), 'utf8');
    const detail = fs.readFileSync(path.join(output, 'articles/article-11/index.html'), 'utf8');
    const topic = fs.readFileSync(path.join(output, 'articles/tag/exact-arithmetic/index.html'), 'utf8');
    const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
    assert.equal((latest.match(/class="article-card"/g) || []).length, 5);
    assert.match(latest, /← Older/); assert.match(older, /← Older/); assert.match(older, /Newer →/);
    assert.doesNotMatch(oldest, /← Older/); assert.match(oldest, /Newer →/);
    assert.match(detail, /Posted by Ian Sproates on/); assert.match(detail, /data-copy-link="\/articles\/article-11\/"/);
    assert.equal((detail.match(/class="article-permalink article-permalink-(?:top|bottom)"/g) || []).length, 2);
    assert.match(detail, /class="article-permalink article-permalink-top"[\s\S]*?<a class="permalink-link" href="\.\/">Permalink<\/a>/);
    assert.match(detail, /class="article-permalink article-permalink-bottom"[\s\S]*?<a class="permalink-link" href="\.\/">Permalink<\/a>/);
    assert.equal((detail.match(/aria-label="Copy article link"/g) || []).length, 2);
    assert.match(detail, /exact arithmetic/); assert.match(topic, /Article 11/);
    assert.match(sitemap, /articles\/page\/2/); assert.match(sitemap, /articles\/article-11/);
    assert.doesNotMatch(sitemap, /unpublished-draft/);
    assert.ok(fs.existsSync(path.join(output, 'articles/unpublished-draft/index.html')));
    assert.throws(() => parseArticle(path.join(content, 'absent.md')));
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
