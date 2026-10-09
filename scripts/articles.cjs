const fs = require('node:fs');
const path = require('node:path');
const renderChrome = require('./site_chrome.cjs');

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text, root = '') {
  const tokens = [];
  const hold = html => `\u0000${tokens.push(html) - 1}\u0000`;
  text = escape(text).replace(/`([^`]+)`/g, (_, code) => hold(`<code>${code}</code>`));
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, label, url) => hold(`<a href="${escape(url.startsWith('/') ? `${root}${url.slice(1)}` : url.replace(/&amp;/g, '&'))}">${label}</a>`));
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[+i]);
}
function markdown(source, root = '') {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out = []; let paragraph = [], list = '', code = false, language = '', codeLines = [];
  const flush = () => { if (paragraph.length) { out.push(`<p>${inline(paragraph.join(' '), root)}</p>`); paragraph = []; } };
  const closeList = () => { if (list) { out.push(`</${list}>`); list = ''; } };
  for (const line of lines) {
    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      flush(); closeList();
      if (code) { out.push(`<pre><code${language ? ` class="language-${escape(language)}"` : ''}>${escape(codeLines.join('\n'))}</code></pre>`); codeLines = []; code = false; }
      else { code = true; language = fence[1]; }
      continue;
    }
    if (code) { codeLines.push(line); continue; }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const item = line.match(/^\s*([-*]|\d+\.)\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    if (!line.trim()) { flush(); closeList(); continue; }
    if (heading) { flush(); closeList(); const level = heading[1].length; const slug = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); out.push(`<h${level} id="${slug}">${inline(heading[2], root)}</h${level}>`); continue; }
    if (item) { flush(); const next = /^\d+\./.test(item[1]) ? 'ol' : 'ul'; if (list && list !== next) closeList(); if (!list) { list = next; out.push(`<${list}>`); } out.push(`<li>${inline(item[2], root)}</li>`); continue; }
    if (quote) { flush(); closeList(); out.push(`<blockquote><p>${inline(quote[1], root)}</p></blockquote>`); continue; }
    if (/^---+$/.test(line.trim())) { flush(); closeList(); out.push('<hr>'); continue; }
    closeList(); paragraph.push(line.trim());
  }
  flush(); closeList();
  if (code) throw new Error('Unclosed fenced code block in article');
  return out.join('\n');
}
function parseArticle(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  if (!raw.startsWith('---\n')) throw new Error(`${file}: missing YAML front matter`);
  const end = raw.indexOf('\n---\n', 4);
  if (end < 0) throw new Error(`${file}: unterminated YAML front matter`);
  const header = raw.slice(4, end), body = raw.slice(end + 5);
  const values = {};
  for (const line of header.split('\n')) {
    const match = line.match(/^(title|date|status):\s*(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    else if (/^tags:\s*$/.test(line)) values.tags = [];
    else if (/^\s+-\s+/.test(line) && Array.isArray(values.tags)) values.tags.push(line.replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
    else if (line.trim()) throw new Error(`${file}: unsupported metadata line: ${line}`);
  }
  const slug = path.basename(file, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${file}: filename must be a stable lowercase slug`);
  if (!values.title || !Array.isArray(values.tags) || !values.tags.length) throw new Error(`${file}: title and one or more tags are required`);
  if (!['draft', 'published'].includes(values.status)) throw new Error(`${file}: status must be draft or published`);
  if (values.status === 'published') {
    const date = new Date(`${values.date || ''}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date || '') || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== values.date) {
      throw new Error(`${file}: published articles need a valid YYYY-MM-DD date`);
    }
  }
  values.tags = values.tags.map(tag => tag.toLowerCase());
  const bodyLines = body.split('\n');
  if (bodyLines[0] === `# ${values.title}`) bodyLines.splice(0, 1);
  return {...values, slug, file, body:bodyLines.join('\n').replace(/^\n+/, '')};
}
const dateLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
const urlFor = slug => `/articles/${slug}/`;
const tagSlug = tag => tag.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function metadataHead(title, description, canonical, root) {
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#15130f"><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://panackelty.com${canonical}"><link rel="icon" href="${root}favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${root}styles.css"><link rel="stylesheet" href="${root}chrome.css"><title>${escape(title)} — Panackelty</title></head><body>\n<a class="skip-link" href="#main">Skip to content</a>\n<!-- SITE_HEADER -->\n`;
}
function renderCard(article, preview = false, prefix = '') {
  const href = `${prefix}${article.slug}/`;
  return `<article class="article-card"><p class="eyebrow">${preview ? 'Draft preview' : dateLabel(article.date)}</p><h2><a href="${href}">${escape(article.title)}</a></h2><p>${escape(article.excerpt)}</p><a class="article-read" href="${href}">Read article <span aria-hidden="true">→</span></a></article>`;
}
function excerpt(body) { return body.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220); }
const PAGE_SIZE = 5;
function renderArchive(articles, previewDrafts, pageNumber = 1) {
  const published = articles.filter(a => a.status === 'published').sort((a,b) => b.date.localeCompare(a.date));
  const ordered = [...previewDrafts.map(a => ({...a, previewDraft:true})), ...published];
  const pageCount = Math.ceil(ordered.length / PAGE_SIZE);
  const shown = ordered.slice((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE);
  const preview = previewDrafts.length > 0;
  const cardPrefix = pageNumber === 1 ? '' : '../../';
  const cards = shown.length ? shown.map(a => renderCard({...a, excerpt: excerpt(a.body)}, Boolean(a.previewDraft), cardPrefix)).join('\n') : '<p class="articles-empty">The first article is on its way. Check back soon.</p>';
  const summary = preview ? '<p class="preview-notice">This is a draft preview. It will not appear on the live site until it is published.</p>' : '';
  const canonical = pageNumber === 1 ? '/articles/' : `/articles/page/${pageNumber}/`;
  const pager = pageCount > 1 ? `<nav class="article-pagination" aria-label="Article pages">${pageNumber < pageCount ? `<a rel="prev" href="${pageNumber === 1 ? 'page/2/' : `../${pageNumber + 1}/`}">← Older</a>` : '<span></span>'}${pageNumber > 1 ? `<a rel="next" href="${pageNumber === 2 ? '../../' : `../${pageNumber - 1}/`}">Newer →</a>` : ''}</nav>` : '';
  const depth = pageNumber === 1 ? '../' : '../../../';
  const html = `${metadataHead(pageNumber === 1 ? 'Articles' : `Articles · page ${pageNumber}`, 'Articles about Panackelty, its language, tools and development.', canonical, depth)}<main id="main" class="article-layout"><p class="eyebrow">Notes from the project</p><h1>Articles.</h1><p class="lede">Longer explanations, decisions and ideas from the making of Panackelty.</p>${summary}<section class="article-list" aria-label="Latest articles">${cards}</section>${pager}</main><!-- SITE_FOOTER --><script src="${depth}site.js" defer></script></body></html>`;
  return {html: renderChrome(fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8'), html, pageNumber === 1 ? 'articles' : 'article-page'), published};
}
function renderDetail(article, isPreview) {
  const tags = article.tags.map(tag => `<a class="article-tag" href="../tag/${tagSlug(tag)}/">${escape(tag)}</a>`).join(' ');
  const date = article.date ? ` on <time datetime="${escape(article.date)}">${dateLabel(article.date)}</time>` : '';
  const notice = isPreview ? '<p class="preview-notice">Draft preview. This article is not published.</p>' : '';
  const body = markdown(article.body, '../../');
  const permalink = position => `<div class="article-permalink article-permalink-${position}"><a class="permalink-link" href="./">Permalink</a><button class="icon-copy" type="button" data-copy-link="${escape(urlFor(article.slug))}" aria-label="Copy article link" title="Copy article link"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path></svg></button><span class="copy-status" aria-live="polite"></span></div>`;
  const html = `${metadataHead(article.title, excerpt(article.body), urlFor(article.slug), '../../')}<main id="main" class="article-layout article-detail">${notice}<p class="eyebrow">Article</p><h1>${escape(article.title)}</h1><p class="article-byline">Posted by Ian Sproates${date}</p>${permalink('top')}<div class="article-body">${body}</div><div class="article-meta"><div class="article-tags" aria-label="Topics">${tags}</div>${permalink('bottom')}</div><p><a href="../">← All articles</a></p></main><!-- SITE_FOOTER --><script src="../../site.js" defer></script></body></html>`;
  return renderChrome(fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8'), html, 'article');
}
function renderTag(tag, articles, previewDrafts = []) {
  const published = articles.filter(a => a.status === 'published' && a.tags.includes(tag)).sort((a,b) => b.date.localeCompare(a.date));
  const drafts = previewDrafts.filter(a => a.tags.includes(tag)).map(a => ({...a, previewDraft:true}));
  const shown = [...drafts, ...published];
  const cards = shown.map(a => renderCard({...a, excerpt: excerpt(a.body)}, Boolean(a.previewDraft), '../../')).join('\n');
  const route = `/articles/tag/${tagSlug(tag)}/`;
  const draftNotice = drafts.length ? '<p class="preview-notice">Draft preview. Draft articles will not appear here on the live site until published.</p>' : '';
  const html = `${metadataHead(`Articles tagged ${tag}`, `Panackelty articles about ${tag}.`, route, '../../../')}<main id="main" class="article-layout"><p class="eyebrow"><a href="../../">Articles</a> · Topic</p><h1 class="topic-title">${escape(tag)}</h1>${draftNotice}<section class="article-list">${cards || '<p>No articles have been published under this topic yet.</p>'}</section><p><a href="../../">← All articles</a></p></main><!-- SITE_FOOTER --><script src="../../../site.js" defer></script></body></html>`;
  return renderChrome(fs.readFileSync(path.join(__dirname, '../site/index.html'), 'utf8'), html, 'article-tag');
}
function write(destination, relative, content) { const file = path.join(destination, relative); fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, content); }
function build(repository, destination, includeDrafts = false) {
  const source = path.join(repository, 'content/articles');
  const articles = fs.existsSync(source) ? fs.readdirSync(source).filter(f => f.endsWith('.md')).map(f => parseArticle(path.join(source, f))) : [];
  const draftDirectory = process.env.PANACKELTY_PREVIEW_DRAFT_DIR || path.join(repository, 'drafts');
  const draftFiles = fs.existsSync(draftDirectory) ? fs.readdirSync(draftDirectory).filter(f => f.endsWith('.md')) : [];
  const drafts = draftFiles.map(f => parseArticle(path.join(draftDirectory, f))).filter(a => a.status === 'draft');
  const published = articles.filter(a => a.status === 'published').sort((a,b) => b.date.localeCompare(a.date));
  const previews = includeDrafts ? drafts : [];
  const slugs = new Set();
  for (const article of [...published, ...previews]) {
    if (slugs.has(article.slug)) throw new Error(`Duplicate article slug: ${article.slug}`);
    slugs.add(article.slug);
  }
  const pageCount = Math.ceil((published.length + previews.length) / PAGE_SIZE) || 1;
  const publishedPageCount = Math.ceil(published.length / PAGE_SIZE);
  for (let page = 1; page <= pageCount; page++) {
    const archive = renderArchive(articles, previews, page);
    write(destination, page === 1 ? 'articles/index.html' : `articles/page/${page}/index.html`, archive.html);
  }
  for (const article of published) write(destination, `articles/${article.slug}/index.html`, renderDetail(article, false));
  if (includeDrafts) for (const article of previews) write(destination, `articles/${article.slug}/index.html`, renderDetail(article, true));
  const tags = [...new Set(published.flatMap(a => a.tags))].sort();
  const previewTags = [...new Set([...tags, ...previews.flatMap(a => a.tags)])].sort();
  for (const tag of previewTags) write(destination, `articles/tag/${tagSlug(tag)}/index.html`, renderTag(tag, articles, previews));
  const sitemap = path.join(destination, 'sitemap.xml');
  let xml = fs.readFileSync(sitemap, 'utf8');
  const urls = [ ...(published.length ? Array.from({length:publishedPageCount}, (_,i) => i === 0 ? 'https://panackelty.com/articles/' : `https://panackelty.com/articles/page/${i + 1}/`) : []), ...published.map(a => `https://panackelty.com${urlFor(a.slug)}`), ...tags.map(t => `https://panackelty.com/articles/tag/${tagSlug(t)}/`) ];
  if (urls.length) xml = xml.replace('</urlset>', `${urls.map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>`);
  fs.writeFileSync(sitemap, xml);
}
module.exports = {build, markdown, parseArticle};
if (require.main === module) {
  try { build(path.resolve(process.argv[2]), path.resolve(process.argv[3]), process.env.PANACKELTY_PREVIEW_DRAFTS === '1'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
