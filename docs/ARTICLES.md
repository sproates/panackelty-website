# Writing and publishing articles

Articles are Markdown files. Keep drafts in `drafts/`; a draft is excluded from
the production site. For a phone/desktop review preview, run:

```sh
PANACKELTY_PREVIEW_DRAFT_DIR="$PWD/drafts" make preview
```

Each file starts with this metadata:

```yaml
---
title: How Panackelty checks a value
status: draft
tags:
  - compiler
  - guarded types
---
```

When ready to publish, move the Markdown file to `content/articles/`, change
`status` to `published`, and set `date` to the intended publication date in
`YYYY-MM-DD` format. The filename is the permanent URL slug, for example
`content/articles/checked-values.md` becomes `/articles/checked-values/`. Do not
rename it after publication. Editing an existing article leaves its URL and
original date unchanged.

The build creates the newest-first `/articles/` archive, article pages and
tag-topic pages. It adds published routes to `sitemap.xml`. The archive shows
up to five articles per page, with Older and Newer links when needed.

Every article page has an Ian Sproates byline, its publication date, linked
topic tags and a **Copy link** button. The button copies the current preview or
production URL. Drafts have no publication date until one is set as part of
publishing.
