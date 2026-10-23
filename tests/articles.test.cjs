const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {build, markdown, parseArticle} = require('../scripts/articles.cjs');

const article = (slug, status, date, tags = ['compiler'], publishedAt = '') => `---\ntitle: ${slug}\nstatus: ${status}\n${date ? `date: ${date}\n` : ''}${publishedAt ? `publishedAt: ${publishedAt}\n` : ''}tags:\n${tags.map(tag => `  - ${tag}`).join('\n')}\n---\n\nAn article about **${slug}**.\n`;

test('article Markdown renders common prose, links, headings and code safely', () => {
  const html = markdown('# Heading\n\nA `value`, [link](https://example.com/?a=1&b=2), and ![source to output diagram](/images/flow.svg).\n\n```panackelty\npure main(): Unit {}\n```\n\n<script>alert(1)</script>', '../../');
  assert.match(html, /<h1 id="heading">Heading<\/h1>/);
  assert.match(html, /<code>value<\/code>/);
  assert.match(html, /href="https:\/\/example\.com\/\?a=1&amp;b=2"/);
  assert.match(html, /<figure class="article-figure"><img src="\.\.\/\.\.\/images\/flow\.svg" alt="source to output diagram" loading="lazy" decoding="async"><\/figure>/);
  assert.match(html, /language-panackelty/);
  assert.match(html, /&lt;script/);
  assert.doesNotMatch(markdown('![remote diagram](https://example.com/flow.svg)'), /<img/);
  assert.doesNotMatch(markdown('![outside path](/../flow.svg)'), /<img/);
});

test('build publishes stable article, topic and paginated archive URLs, while keeping drafts preview-only', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'panackelty-articles-'));
  try {
    const content = path.join(root, 'content/articles'), drafts = path.join(root, 'drafts');
    const output = path.join(root, 'output');
    fs.mkdirSync(content, {recursive:true}); fs.mkdirSync(drafts);
    for (let i = 1; i <= 11; i++) {
      const sameDay = i >= 10;
      const date = sameDay ? '2026-01-10' : `2026-01-${String(i).padStart(2,'0')}`;
      const publishedAt = i === 10 ? '2026-01-10T09:00:00+02:00' : i === 11 ? '2026-01-10T11:00:00+02:00' : '';
      fs.writeFileSync(path.join(content, `article-${String(i).padStart(2, '0')}.md`), article(`Article ${i}`, 'published', date, i === 11 ? ['exact arithmetic', 'LLM'] : ['exact arithmetic'], publishedAt));
    }
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
    const llmTopic = fs.readFileSync(path.join(output, 'articles/tag/llm/index.html'), 'utf8');
    const sitemap = fs.readFileSync(path.join(output, 'sitemap.xml'), 'utf8');
    assert.equal((latest.match(/class="article-card"/g) || []).length, 5);
    assert.ok(latest.indexOf('Article 11') < latest.indexOf('Article 10'));
    assert.match(latest, /← Older/); assert.match(older, /← Older/); assert.match(older, /Newer →/);
    assert.doesNotMatch(oldest, /← Older/); assert.match(oldest, /Newer →/);
    assert.match(detail, /Posted by <a href="https:\/\/sproates\.net">Ian Sproates<\/a> on/); assert.match(detail, /data-copy-link="\/articles\/article-11\/"/);
    assert.match(detail, /<time datetime="2026-01-10T11:00:00\+02:00">10 January 2026<\/time>/);
    assert.equal((detail.match(/class="article-permalink article-permalink-(?:top|bottom)"/g) || []).length, 2);
    assert.match(detail, /class="article-permalink article-permalink-top"[\s\S]*?<a class="permalink-link" href="\.\/">Permalink<\/a>/);
    assert.match(detail, /class="article-permalink article-permalink-bottom"[\s\S]*?<a class="permalink-link" href="\.\/">Permalink<\/a>/);
    assert.equal((detail.match(/aria-label="Copy article link"/g) || []).length, 2);
    assert.match(detail, /class="article-tag" href="\.\.\/tag\/llm\/">LLM<\/a>/);
    assert.match(llmTopic, /<h1 class="topic-title">LLM<\/h1>/); assert.match(llmTopic, /Article 11/);
    assert.match(detail, /exact arithmetic/); assert.match(topic, /Article 11/);
    assert.match(sitemap, /articles\/page\/2/); assert.match(sitemap, /articles\/article-11/); assert.match(sitemap, /articles\/tag\/llm/);
    assert.doesNotMatch(sitemap, /unpublished-draft/);
    assert.ok(fs.existsSync(path.join(output, 'articles/unpublished-draft/index.html')));
    assert.throws(() => parseArticle(path.join(content, 'absent.md')));
    fs.writeFileSync(path.join(content, 'invalid-published-at.md'), article('Invalid timestamp', 'published', '2026-01-10', ['compiler'], '2026-01-10T25:00:00+02:00'));
    assert.throws(() => parseArticle(path.join(content, 'invalid-published-at.md')), /publishedAt must be a valid ISO 8601 timestamp/);
    fs.writeFileSync(path.join(content, 'mismatched-published-at.md'), article('Mismatched timestamp', 'published', '2026-01-10', ['compiler'], '2026-01-11T09:00:00+02:00'));
    assert.throws(() => parseArticle(path.join(content, 'mismatched-published-at.md')), /publishedAt must be a valid ISO 8601 timestamp/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});

test('homepage follows published ordering, escapes summaries and never promotes drafts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'panackelty-latest-'));
  try {
    const content = path.join(root, 'content/articles'), drafts = path.join(root, 'drafts'), output = path.join(root, 'output');
    fs.mkdirSync(content, {recursive:true}); fs.mkdirSync(drafts); fs.mkdirSync(output);
    const home = '<main><!-- LATEST_ARTICLE_START --><!-- LATEST_ARTICLE_END --></main>';
    fs.writeFileSync(path.join(output, 'index.html'), home);
    fs.writeFileSync(path.join(output, 'sitemap.xml'), '<urlset></urlset>');
    fs.writeFileSync(path.join(drafts, 'future.md'), article('Future draft', 'draft', '2030-01-01'));
    build(root, output, true);
    assert.equal(fs.readFileSync(path.join(output, 'index.html'), 'utf8'), home);
    fs.writeFileSync(path.join(content, 'morning.md'), article('Morning', 'published', '2026-01-10', ['HTTP'], '2026-01-10T09:00:00+02:00'));
    fs.writeFileSync(path.join(content, 'evening.md'), article('Evening & <news>', 'published', '2026-01-10', ['HTTP'], '2026-01-10T18:00:00+02:00').replace('status:', 'summary: A useful <tool> & a site.\nstatus:'));
    build(root, output, true);
    let html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    assert.match(html, /href="articles\/evening\/"/);
    assert.match(html, /Evening &amp; &lt;news&gt;/);
    assert.match(html, /A useful &lt;tool&gt; &amp; a site\./);
    assert.match(html, /<time datetime="2026-01-10">10 January 2026<\/time>/);
    assert.doesNotMatch(html, /Future draft|Morning/);
    fs.writeFileSync(path.join(content, 'tomorrow.md'), article('Tomorrow', 'published', '2026-01-11'));
    build(root, output, false);
    html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    assert.match(html, /href="articles\/tomorrow\/"/);
    assert.match(html, /An article about Tomorrow\./);
    assert.equal((html.match(/class="home-latest-article"/g) || []).length, 1);
    assert.doesNotMatch(html, /Evening|Future draft/);
  } finally { fs.rmSync(root, {recursive:true, force:true}); }
});
