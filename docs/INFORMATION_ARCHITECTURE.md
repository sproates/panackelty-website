# Website information architecture

Owner-selected structure, 2026-10-06. Preserve the existing palette, typography,
components and feel; shorten the homepage by moving detailed content to focused
pages. Public page links use directory URLs with no `.html` suffix. No old-route
or old-anchor compatibility is required for this refactor.

| Page | Route | Content |
| --- | --- | --- |
| Home | `/` | Compact introduction, release outline and links onward |
| Capabilities | `/capabilities/` | Features of the promoted native release, with browser limits and examples |
| Get started | `/get-started/` | Browser/native choice, greeting, one-command installer and optional manual-download reveal |
| Examples | `/examples/` | Curated released examples and links to release-specific source |
| Compiler explanations | `/explain/` | Released command, actual proof/effect output, usage and limits |
| Under the hood | `/under-the-hood/` | Compiler/VM pipeline, bootstrap, host boundary and verification evidence |
| Releases and roadmap | `/roadmap/` | Available now, alpha.14–alpha.18 direction and first non-alpha target, separately labelled |
| Playground | `/playground/` | Separately pinned browser runtime and existing interactive examples |
| Release history | `/releases/` | Generated historical notes, availability and migration information |

Primary navigation includes Capabilities, Get started, Examples, Releases and
roadmap. All primary links, including Try it online, are always visible and aligned
in one navigation group; they wrap naturally on phones. No expanding menu. Under the hood and release history live in the shared footer,
alongside compiler explanations, coverage, GitHub and the licence. Project motivation and creator credit live on the homepage.

The homepage owns shared chrome; `scripts/site_chrome.cjs` renders page-relative
links and one current-page marker on every editorial page and the playground.
`site/site.js` owns clipboard feedback. The release history
renderer remains based on the immutable reviewed changelog snapshot.

## Release content maintenance

- Available now means the deliberately promoted native release, not core main
  or next. Browser capabilities follow their separately promoted artifact.
- Alpha.13 is the promoted native release. Alpha.14–alpha.18 have agreed general
  directions on the homepage and roadmap: foundations; useful programs; everyday
  development; interactive/connected applications; language ergonomics.
- Keep the homepage outline and detailed roadmap consistent with core's agreed
  release scope. Package-management scope remains to be settled; alpha.17's Docker
  and Linux ARM64 work is optional; alpha.18 features require design and evidence.
  Preserve existing alpha.14 guard/inference selections and avoid duplicate credit.
- Historical articles keep their publication context. Current capability pages,
  download pins and release history change only during a release promotion.
- The first non-alpha section is a target, with scope/version/date still under
  definition. Future features must not appear as current capabilities.
- A release promotion updates Get started's commands and example validation,
  native pins, Home/Capabilities/Roadmap claims and the reviewed release-history
  snapshot together. Move delivered features into Available now and revise the
  next-release outlook. Dates and performance claims need supporting evidence.

Validate clean links, anchors, shared chrome, release pins, runnable examples,
always-visible mobile navigation and clipboard fallback. The full existing browser runtime suite is
retained; additional editorial tests cover all routes at desktop and phone widths.
Provide an iPhone-accessible preview before merge approval.

Tracking: [website GI#8](https://github.com/sproates/panackelty-website/issues/8).

Owner preview feedback: Home uses a compact introduction and linked release rows;
all editorial pages share the same closing link component. Coverage entry pages
use the same assembled chrome. The external report publisher also needs matching
chrome, delivered separately without changing coverage data.

The Examples page includes complete released programs for Result handling, persistent collections, records, sorting names and Fibonacci. Release integrity executes displayed source and saved bytecode, plus the guide’s explanation query. Alpha 13 describes new capabilities; the first non-alpha section describes integration, breadth and readiness.

## Previous releases

`/previous-releases/` preserves completed release summaries, beginning with the
full alpha.12 roadmap text. The roadmap retains the current release and future
plans and links to this archive. `/releases/` remains the detailed changelog and
migration reference. Historical articles retain their original release context.
Both the roadmap and release notes link to the archive; shared navigation marks
it within Roadmap. Future promotions move the previous current summary here.

Release cards link to website walkthroughs with prerequisites, commands, expected
results and limitations. Repository links are secondary references to specific
files or planning sections; avoid folder listings and repeated generic issue links.
