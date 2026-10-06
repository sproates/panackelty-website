# Website information architecture

Owner-selected structure, 2026-10-06. Preserve the existing palette, typography,
components and feel; shorten the homepage by moving detailed content to focused
pages. Public page links use directory URLs with no `.html` suffix. No old-route
or old-anchor compatibility is required for this refactor.

| Page | Route | Content |
| --- | --- | --- |
| Home | `/` | Introduction, one exact-value program, three benefits, compact release outlook and next steps |
| Capabilities | `/capabilities/` | Features of the promoted native release, with browser limits and examples |
| Get started | `/get-started/` | Browser/native choice, greeting, optional installer, manual download and check/run/compile |
| Examples | `/examples/` | Curated released examples and links to release-specific source |
| Under the hood | `/under-the-hood/` | Compiler/VM pipeline, bootstrap, host boundary and verification evidence |
| Releases and roadmap | `/roadmap/` | Available now, alpha 12, alpha 13 and first non-alpha target, separately labelled |
| About | `/about/` | Vision, experimental status, contributor credit and feedback |
| Playground | `/playground/` | Separately pinned browser runtime and existing interactive examples |
| Release history | `/releases/` | Generated historical notes, availability and migration information |

Primary navigation includes Capabilities, Get started, Examples, Releases and
roadmap. Try it online stays visible on phones while the remaining primary links
use a progressively enhanced menu. Without JavaScript all primary links remain
available. Under the hood, About and release history live in the shared footer,
alongside coverage, GitHub and the licence.

The homepage owns shared chrome; `scripts/site_chrome.cjs` renders page-relative
links and one current-page marker on every editorial page and the playground.
`site/site.js` owns clipboard feedback and the mobile menu. The release history
renderer remains based on the immutable reviewed changelog snapshot.

## Release content maintenance

- Available now means the deliberately promoted native release, not core main
  or next. Browser capabilities follow their separately promoted artifact.
- Alpha 12 is the owner's intended next release. Else-if and source coverage are
  integrated into next; executable namespaces remain unfinished. None of these
  development states imply inclusion in the current native download.
- Alpha 13 is planned for native HTTP client/server and expanded checker and
  compilation explanations, backed by core GI#236/GI#237/GI#134/GI#173. Package
  prerequisites and the paused explanation programme remain explicit; recording
  the plan does not restart implementation. Exact explanation cases are defined
  during slice planning.
- The first non-alpha section is a target, with scope/version/date still under
  definition. Future features must not appear as current capabilities.
- A release promotion updates Get started's commands and example validation,
  native pins, Home/Capabilities/Roadmap claims and the reviewed release-history
  snapshot together. Move delivered features into Available now and revise the
  next-release outlook. Dates and performance claims need supporting evidence.

Validate clean links, anchors, shared chrome, release pins, runnable examples,
mobile menu and clipboard fallback. The full existing browser runtime suite is
retained; additional editorial tests cover all routes at desktop and phone widths.
Provide an iPhone-accessible preview before merge approval.

Tracking: [website GI#8](https://github.com/sproates/panackelty-website/issues/8).
