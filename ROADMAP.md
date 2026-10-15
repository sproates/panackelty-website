# Website roadmap

This repository owns website development, publication, release promotion and
website-specific backlog. Core language and release programmes remain in
[Panackelty core](https://github.com/sproates/panackelty/blob/main/ROADMAP.md).
The RM identifiers below are preserved from that roadmap; they are not issue
numbers. Do not renumber or duplicate programme completion credit.

## Current work

The repository migration is in progress under
[core GI#178: Independent website publishing](https://github.com/sproates/panackelty/issues/178).
Standalone validation/staging is delivered by website PR#1. Production cutover,
core retirement and live acceptance remain pending. Migrating the backlog does
not start its individual features or change their agreed priorities.

## Alpha.13 release promotion

**In progress.** Promote verified native alpha.13 and browser v0.1.3 together
with download checksums, immutable installer/release-note references and current
capability claims. Keep alpha.12 roadmap text on a dedicated Previous releases
page; alpha.13 becomes available and alpha.14 becomes next. Historical
articles and release notes retain their original versions.

Acceptance: native examples from the published archive, website/browser checks,
a phone/desktop preview on the owner's local network, explicit merge approval,
and exact deployed-pin verification. This update does not republish core assets
or change the core installer's default. No issue was created solely for this
promotion. Native archive/example acceptance, 30 local automation tests, nine
editorial browser checks and all 24 playground browser cases passed. The LAN
preview is available for owner review; hosted checks, approval and production
verification remain pending. Owner review identified weak folder links and repeated generic milestone links.
Release cards now lead to on-site HTTP, package and folder-preview walkthroughs;
external links identify exact source files or scoped planning references.
Static content and navigation changes introduce no
new runtime service or client-side dependency.

## Website information architecture

**In progress.** [GI#8: Refactor the information structure](https://github.com/sproates/panackelty-website/issues/8)
was selected by the owner on 2026-10-06. Shorten Home and organise the existing
content into Capabilities, Get started, Examples, Under the hood, Releases and
roadmap, and About. Keep the current styling and feel, provide clean directory
URLs and distinguish Available now, the next planned release and the first
non-alpha target. No old URL or anchor compatibility is required. The
[page map](docs/INFORMATION_ARCHITECTURE.md) owns the detailed structure.
Acceptance requires the assembled site and native/browser checks plus a working
iPhone preview and explicit merge approval. Implementation does not publish a
new language release or change runtime pins.

## Website-owned backlog

### Articles publishing and archive

**In progress.** [GI#15: Articles publishing and archive](https://github.com/sproates/panackelty-website/issues/15)
records the Markdown-based authoring and publishing workflow. Articles have
stable individual URLs, title/body/date/tag metadata, a **Copy link** action and
author attribution. The `/articles/` archive lists newest first with Older/Newer
pagination, with up to five previews per page. Shared tags link to generated
topic pages. Editing an article keeps its URL and original publication date
stable and regenerates the article/tag listings and sitemap.

<a id="rm-119"></a>
### RM#119: Cookie-free website analytics

**Idea; unscheduled.** [GI#2: Analytics](https://github.com/sproates/panackelty-website/issues/2)
was transferred from core GI#252 with its history. Proposed basic Cloudflare
statistics, production-only collection and an accurate privacy notice require
provider/privacy verification, account setup and live dashboard acceptance.
No collection or account change is enabled by this migration. Provisional size:
small, one website PR plus setup and verification.

<a id="rm-8"></a>
### RM#8: Website CI follow-ups

**Deferred.** [GI#3: Website CI follow-ups](https://github.com/sproates/panackelty-website/issues/3)
was transferred from core GI#187 with its accepted delivery history. Keep its
remaining scheduling/timing trials deferred unless explicitly selected or a
practical publication problem warrants review. Coverage automatic scheduling and
report freshness belong to the coverage repository; historical core-only trigger
acceptance is a cross-repository record, not a requirement to restore coupled CI.
Migration timing acceptance is tracked separately in core GI#178.

<a id="rm-102"></a>
### RM#102: Source-map website adoption

**Promotion pending; dedicated examples unscheduled.** Native alpha.11 is already
advertised, but that does not complete the dedicated source-map guide/example.
The website maintainer owns adoption, linked to U2 in
[core GI#180: Compiler understanding](https://github.com/sproates/panackelty/issues/180).
Document exact-source reproduction, unavailable fallback, lookup cost and
full-source sidecar privacy; do not advertise automatic runtime explanations.
Validate against the promoted native artifact and verify live pages. Browser
examples stay unchanged until separately supported and verified.

<a id="rm-103"></a>
### RM#103: Corrective compiler release adoption

**Browser correction adopted; website acceptance complete.** Follow-up to
[core GI#182: Guard-fact correctness repair](https://github.com/sproates/panackelty/issues/182).
Browser v0.1.2 pins the published alpha.12 core commit, which includes the
corrected compiler seed. Runtime acceptance covers valid and rejected guarded
values in native and WASI execution. The website now pins and serves v0.1.2;
its deployed playground archive identity and namespace example were verified
against the immutable release. See the completed promotion record below.

<a id="rm-104"></a>
### RM#104: Explanation website adoption

**Promotion pending; dedicated examples unscheduled.** Native alpha.11 is
advertised, but dedicated U3 explanation examples remain pending under
[core GI#180](https://github.com/sproates/panackelty/issues/180). Website adoption
must describe bounded Nat-subtraction and local call/await effects, local versus
whole-program validity, unavailable cases and original diagnostics. Include
supported per-function recovery without implying transitive effects or runtime
execution. Browser support must be checked separately. The website maintainer
owns example/claim changes and live verification; broader demonstrations remain
in U9 below.

## Cross-repository dependencies

<a id="rm-11"></a>
### RM#11: Programme website demonstrations (U9)

**Planned; prerequisite-gated.** The authoritative scope, weights and acceptance
remain in [core GI#180](https://github.com/sproates/panackelty/issues/180) and its
[RM#11 record](https://github.com/sproates/panackelty/blob/main/ROADMAP.md#rm-11).
Website maintainers implement the adopted homepage/capability/learning/playground
changes; the core programme delivery owner retains programme acceptance.
Wait for U8, accepted features and published native/browser artifacts supporting
the demonstrations. Target release and tagline are undecided. Include tested
rejected/explained/corrected examples and live verification. Do not double-count
this pointer as another programme task or treat repository separation as feature
acceptance.

### Panackelty-written preview server

[Core GI#162](https://github.com/sproates/panackelty/issues/162) is complete (2026-10-15).
The generic service and tool live in core `packages/static_http` and
`tools/http-server`. This adoption replaces local HTTP serving with the installed
tool while retaining Node assembly, provenance and preview banners. The source
revision in `preview-tool.json` is built once; normal previews never rebuild it.

The launcher validates protocol/readiness and supervises normal stop, child
failure and abrupt parent loss. Existing supplied output survives; owned temporary
builds are deleted after the server stops. Both hosted browser suites now use the
actual tool. Local `make check` passes (30 tests plus assembly checks). The fresh preview
contains 81 files, all byte-identical through the tool; the largest is 706,607
bytes. All 24 execution/resource checks and nine editorial/navigation checks pass
across Chromium, Firefox and WebKit, including phone widths. Core PR #498 merged
into `next` as `90661d4`; the tool is pinned to the alpha.13 preparation commit
`994dc60`, including Linux libcurl compatibility. Website PR #42 merged as
`18b4cd5` after owner preview and merge approval. Its exact-head and post-merge
checks passed (post-merge Check run 38760731372); core PR #500 records completion
and GI#162 is closed. Production content,
release pins and domain settings are unchanged. The delivery maintainer owns the
request-latency trade-off (roughly 7–13 ms locally versus sub-millisecond Node)
and accepts it for local previews based on the complete responsive-page suite
(50.0s execution/resource checks; 5.5s editorial/navigation). This is not a
production-serving performance claim.

Learning-path, executable-documentation, technical-showcase and public-Markdown
work remain in core GI#137, GI#138, GI#140 and GI#281 respectively; website-specific
adoption can be recorded here when selected. Core GI#287 owns the future `next`
integration workflow and remains gated by release and migration acceptance.

## Release follow-ups and completed history

### Native alpha.12 website promotion

**Completed 2026-10-11.** Promoted published native `v0.1.0-alpha.12` from core commit
[`0c2b9a0`](https://github.com/sproates/panackelty/commit/0c2b9a0b15b6948e322ac10cc2e61a6dcec00e9e).
The release and both platform archives were published and their SHA-256 values
verified before this website change. This promotion updates native download and
installer pins, the release-history snapshot, get-started instructions, current
capability/roadmap claims, the alpha.12 article and examples. The original
promotion selected browser v0.1.1; the separate v0.1.2 promotion is tracked
below. PR #20 merged as `5aeb6af`; the main workflow passed release integrity,
assembly, browser integration and deployed-byte verification, and the live
home, release history and getting-started pages serve alpha.12.

### Browser v0.1.2 website promotion

**Completed 2026-10-11.** Promoted browser v0.1.2, built and tested against
native alpha.12 core commit `0c2b9a0b15b6948e322ac10cc2e61a6dcec00e9e`. The
immutable archive SHA-256 is
`b7913d78f98de2b85ae08485e0bd7344ec7353a3065a40475fb2f2d5ab447f84`; its asset
version is `9c63dea4bb3e3fa832a3b3f78be6f802f10dbdc6a708f26ab6ba595b00b4580c`.
PR [#21](https://github.com/sproates/panackelty-website/pull/21) merged as
[`8a23fa5`](https://github.com/sproates/panackelty-website/commit/8a23fa5cbbce815f9e7f2edcb77eb2ed201e395a).
Main workflow [#38124638084](https://github.com/sproates/panackelty-website/actions/runs/38124638084)
passed Website checks, release integrity, site assembly, browser integration,
and deployed-byte/provenance verification. Live `/publication.json` identifies
that exact commit and run; `/playground/release.json` matches the immutable
archive and asset identity, and the deployed examples include “Namespace imports.”
The owner reviewed and approved the preview before merge. Website acceptance is
complete. Owner: website maintainer.

Core release authors record affected website claims and hand over concrete
promotion work here, with source issue/PR, affected pages, current version,
release prerequisite, owner, state and acceptance evidence. Website maintainers
own adopted changes. A new core/browser release never automatically updates the
site. Ordinary promotion waits for supporting published releases; broken links,
failing examples and false claims are correctness defects to assess promptly.
Close adoption work only after live verification.

Completed RM#118 installation parity, RM#122 installer promotion and RM#127
release history retain their acceptance records in the
[core website register](https://github.com/sproates/panackelty/blob/main/ROADMAP.md#website-follow-up-register).
Their migration does not reopen completed work or transfer historical closed
issues. Future enhancements use this repository's issues and roadmap.
