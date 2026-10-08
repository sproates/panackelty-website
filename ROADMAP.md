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

## Website information architecture

**In progress.** [GI#8: Refactor the information structure](https://github.com/sproates/panackelty-website/issues/8)
was selected by the owner on 2026-10-06. Shorten Home and organise the existing
content into Capabilities, Get started, Examples, Under the hood, Releases and
roadmap, and About. Keep the current styling and feel, provide clean directory
URLs and distinguish Available now, planned alpha 12 and the first non-alpha
target. No old URL or anchor compatibility is required. The
[page map](docs/INFORMATION_ARCHITECTURE.md) owns the detailed structure.
Acceptance requires the assembled site and native/browser checks plus a working
iPhone preview and explicit merge approval. Implementation does not publish a
new language release or change runtime pins.

## Website-owned backlog

### Articles publishing and archive

**Unscheduled.** [GI#15: Articles publishing and archive](https://github.com/sproates/panackelty-website/issues/15)
records the planned Markdown-based authoring and publishing workflow. Articles
have stable individual URLs, title/body/date/tag metadata, sharing links and
author attribution. The `/articles/` archive lists newest first with Older/Newer
pagination; 10 previews per page is the current recommendation, to confirm in
the implementation preview. Shared tags link to generated topic pages. Editing
an article keeps its URL and original publication date stable and regenerates
the article/tag listings and sitemap. Implementation remains unscheduled.

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

**Browser prerequisite pending; adoption unscheduled.** Follow-up to
[core GI#182: Guard-fact correctness repair](https://github.com/sproates/panackelty/issues/182).
Alpha.11 contains the native correction. The pinned browser v0.1.1 compiler has
the affected core seed digest; a corrective browser release is still required
and its implementation owner remains unassigned. The website maintainer owns
explicit pin/claim promotion once a supporting browser release exists. Review
static-safety and guarded-type claims against the actual artifacts; the literal
homepage example does not reproduce the mutation defect. Acceptance includes
public verification that unsafe examples reject and valid examples still run.
This entry neither implements the browser repair nor claims adoption is complete.

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

[Core GI#162](https://github.com/sproates/panackelty/issues/162) remains the
unscheduled general-purpose server/dogfooding proposal. Repository choice and
required capabilities remain unresolved. This website may eventually consume it;
retain the working Node preview until a separately accepted replacement exists.

Learning-path, executable-documentation, technical-showcase and public-Markdown
work remain in core GI#137, GI#138, GI#140 and GI#281 respectively; website-specific
adoption can be recorded here when selected. Core GI#287 owns the future `next`
integration workflow and remains gated by release and migration acceptance.

## Release follow-ups and completed history

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
