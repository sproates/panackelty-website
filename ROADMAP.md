# Website roadmap

This repository owns website development, publication, release promotion and
website-specific backlog. Core language and release programmes remain in
[Panackelty core](https://github.com/sproates/panackelty/blob/main/ROADMAP.md).
The RM identifiers below are preserved from that roadmap; they are not issue
numbers. Do not renumber or duplicate programme completion credit.

## Inference assessment release allocation, 26 October 2026

Delivered in [PR#58](https://github.com/sproates/panackelty-website/pull/58).
The public roadmap places the inference/diagnostics assessment in alpha.16 and
keeps the library-boundary assessment in alpha.15, consistent with core GI#170
and merged [core PR#611](https://github.com/sproates/panackelty/pull/611).
Live verification on 27 October confirmed that allocation and native alpha.14
availability. Publication provenance identifies source
`baa2677d2840561803d0f47cf189f77c059d115d` and
[publication run 40470876662](https://github.com/sproates/panackelty-website/actions/runs/40470876662).
No released capability, download pin or historical article changed through the
allocation update.

## Current maintenance context

This repository owns and serves the production website. Independent publication
and core source retirement are delivered; [migration acceptance](docs/MIGRATION.md)
records the evidence and recovery limitations. Native alpha.14 and browser v0.2.1
are promoted. Alpha.15 package management is accepted on core `next` but remains
unreleased; use the [core release summary](https://github.com/sproates/panackelty/blob/next/docs/NEXT_RELEASE_STATUS.md)
for implementation status. Website release promotion remains a separate decision.

## Release rebalance: alpha.14 through alpha.19

Delivered by [PR#51](https://github.com/sproates/panackelty-website/pull/51), including
the reviewed release rebalance from PR#50. Alpha.14 methods, HTTP and reference
material are published; alpha.15–alpha.19 remain planned. Later allocation
changes belong in the current release descriptions and their specific records.

The older delivery records below retain the release pins and acceptance context
of their own changes. Their historical alpha.13 references do not override the
current pins or release-maintenance guidance above.

## Alpha.14 through alpha.18 release direction

Owner-selected general scope, 20 October 2026. Update the homepage release rows,
roadmap sections and maintenance guidance to match the core release direction.
Preserve alpha.13 availability and pins, historical articles and conditional or
optional scope. No new issue is needed for this editorial change.

Done: [PR#48](https://github.com/sproates/panackelty-website/pull/48) merged with
owner approval. Local and hosted checks passed; publication run 39429324422
verified deployed bytes and provenance. The live homepage and roadmap were
verified against source e27abcd on 20 October 2026. Content only: no compiler,
runtime or client-side dependency changes.

## Editorial headings and reference links — 20 October 2026

Done on successful publication: apply the owner-reviewed homepage and editorial
headings, remove unwanted forced line breaks, and repair the relocated language
reference link on Under the hood and in the pinned playground's assembled HTML.
Local website checks and a targeted reference-link regression test support the
change; hosted checks and deployed-page verification remain publication gates.
No issue is associated with this editorial task. No runtime or release-pin changes.

## Alpha.14 methods and HTTP framework communication

Done on publication: publish “Giving Panackelty methods a proper home” and update
the homepage release summary and alpha.14 roadmap to include type-owned dispatch
and the HTTP server framework. Both remain explicitly planned and unreleased;
alpha.13 release pins and historical release notes are unchanged. The article
explains deliberate early receiver sugar, staged arrow syntax and final dot calls.
No issue was created solely for this editorial update. Static content adds no
runtime service or client-side dependency. Acceptance requires local website
checks, hosted Website checks and verification of the deployed article and pages.

## Alpha.13 release promotion

**Done on successful publication of [PR#44](https://github.com/sproates/panackelty-website/pull/44).**
Promotes verified native alpha.13 and browser v0.1.3, including download checksums,
immutable installer/release-note references, capability descriptions and roadmap.
Alpha.12 is preserved on Previous releases; alpha.14 is identified as planned.
Historical articles and release notes retain their original versions.

Owner preview review selected a general-purpose static HTTP server description,
a self-contained two-package greeting example, and useful website destinations
instead of bare repository folders or repeated generic milestone links. The
introductory HTTP API tutorial was removed. Preview artifacts omit production
canonical/social URL metadata so sharing retains the preview host.

The owner authorised finalisation after LAN preview review. Published native
archive/example acceptance, local assembly/automation and three-engine browser
checks support the update; the current PR must pass Website checks before merge.
Completion requires the main publication job to verify deployed pages, browser
asset bytes and publication provenance against its tested artifact. If that job
fails, publication acceptance remains open. No issue was created solely for this
promotion. Core release assets and installer defaults are unchanged.

Performance: static content/navigation introduces no new runtime service or
client-side dependency. The installed static HTTP server remains the preview
server. Production canonical URLs remain intact.

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

## Playground release-label correction

The v0.1.3 browser archive retained a hard-coded alpha.12 label despite its
alpha.13 compiler. Website assembly now owns that presentation text, using
reviewed compiler/bytecode metadata alongside the immutable browser pin. Runtime
asset bytes and checksums are unchanged. Publication acceptance remains pending.
