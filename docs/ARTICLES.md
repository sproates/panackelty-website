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

For two articles published on the same day, add `publishedAt` with the full
ISO 8601 publication time and its timezone offset, for example
`publishedAt: 2026-10-12T09:30:00+02:00`. The archive uses it to put the later
article first; article pages continue to display the calendar date from `date`.

The build creates the newest-first `/articles/` archive, article pages and
tag-topic pages. It adds published routes to `sitemap.xml`. The archive shows
up to five articles per page, with Older and Newer links when needed.

Every article page has an Ian Sproates byline linking to [sproates.net](https://sproates.net),
its publication date, linked topic tags and a **Copy link** button. The button
copies the current preview or production URL. Drafts have no publication date
until one is set as part of publishing.

Article Markdown supports local SVG illustrations. Store them under
`site/images/` and refer to them with a site-root path and descriptive alt text:

```md
![Diagram showing how the browser runs a program](/images/playground-run-flow.svg)
```

The homepage automatically highlights the newest published article, using the same
publication order as the archive. Drafts are excluded, even in preview builds.
Add an optional single-line `summary:` to the article metadata for the homepage
blurb; otherwise the build uses a short excerpt. With no published articles,
the homepage omits the strip.

## Fast article publication

A change containing only regular Markdown files directly in `content/articles/`
or `drafts/` uses article validation. It tests rendering and article metadata,
assembles the complete site with the pinned playground assets, and checks local
links, navigation and required pages. It does not rebuild the native preview
server, recheck unchanged release archives, or execute the unchanged playground.
The normal `Website checks` gate still has to pass before publication.

Changes to images, templates, styles, scripts, workflows, release pins or any
other files keep the existing broader validation. Missing comparison history or
unusual Git entries also use that broader path. Code examples still need their
appropriate authoring checks; article routing does not prove that a snippet runs.

Production pushes and manual runs on `main` can reuse a successful PR artifact
only when its exact source tree matches. Expired, missing or mismatched artifacts
fall back to fresh validation. Manual runs without a reusable artifact also use
broader validation because they have no reliable change baseline.

When merging for publication, use a clean squash commit message without a draft's
`[skip ci]` marker. If automatic deployment was skipped, manually run `Check` on
`main`; it can now reuse the same checked PR artifact. Publication still verifies
current `main` immediately before deployment and the deployed files afterwards.
