# Migration acceptance

This first slice prepares independent development and staging publication.
Production remains on its existing publisher. The extracted baseline is recorded
in `release-source.json`. The snapshot includes merged core `5f92782`
(contributor and homepage cleanup); migration-only homepage differences pin the
installer source and requested release. Future source changes require the same
comparison before cutover.

## Refresh the source snapshot

Compare the recorded source commit with the selected current core commit for
`site/`, `CHANGELOG.md`, assembly/chrome/history helpers and their relevant tests.
Bring forward all accepted source changes. Reapply the immutable installer URL, explicit version, released-example labels
and recorded-source capability link in `site/index.html`; preserve concurrent
site edits. Update the source commit separately from the installer source pin,
which stays immutable until deliberately reviewed. Repeat the standalone checks,
release acceptance, browser suite and visual preview after the refresh.

The copied assembly dependencies are `site/`, `CHANGELOG.md`,
`scripts/assemble_site.sh`, `scripts/site_chrome.awk`, the three
`scripts/release_history.*` files, `scripts/fetch_playground.cjs`,
`scripts/check_pages.cjs` and `scripts/preview.cjs`. The external browser test
suite and image are immutable pins in `browser-validation.yml`. The native
example harness executes downloaded releases rather than a core checkout.

## Before production cutover

- Confirm the accepted source snapshot and compare old/new assembled bytes;
  explain intended installer/provenance differences.
- Accept the public staging preview and browser behavior under its project path.
- Verify URL preservation for home, capabilities, releases, playground and both
  coverage compatibility routes, including every browser asset and Wasm MIME.
- Measure cold/warm validation and merge-to-live time with runner queue time
  separately. Targets remain unverified until measured; retain full browser
  integration while deciding a narrower routine smoke-test boundary.
- Agree and review the domain transfer and rollback sequence. Remove the old
  production writer in coordination with enabling the new one; never run both.
- Verify `panackelty.com`, TLS/domain ownership, publication provenance and
  deployed bytes, then retire obsolete core website files/tests and update core
  documentation through its own PR.

The migration issue remains open until production checks and retirement finish.
No production CNAME or domain transfer belongs in this first slice.

## Initial hosted evidence

The first [PR validation run](https://github.com/sproates/panackelty-website/actions/runs/37242306414)
for website commit `35524b4` passed assembly, published-release integrity, all
browser integration checks and the required aggregate check. On 2026-10-04 UTC,
creation/start was 23:02:54 and completion was 23:04:34: 100 seconds end to end,
including two seconds before the first job began. Reported job durations were
assembly 8s, release integrity 11s, browser integration 83s and aggregate 2s;
parallel durations are not additive. No action caches were declared in this
initial run. This is one initial-run observation, not a warm-run or merge-to-live
guarantee. Subsequent changes require fresh validation.

## Cutover procedure and rollback

The owner has approved PR merges for this migration, including backlog transfer.
Independent review, current passing checks and existing protections still apply.
Use the reviewed default branch for every deployment.

1. Merge the reviewed website backlog/coverage-route PR and verify staging again.
   Check the latest core main for site changes since `5f92782`; refresh any newer
   accepted site changes before retiring the source. Snapshot the old Pages
   settings and published provenance for rollback.
2. Finish review and required checks for core retirement. Disable the old core
   Pages workflow and confirm no active old deployment remains before changing
   domain ownership. Merge the reviewed retirement PR; core releases and coverage
   publication retain their own validation and ownership.
3. Remove `panackelty.com` from core's Pages setting and assign it to this
   repository's Pages setting. DNS stays unchanged: the apex has GitHub Pages'
   four A/four AAAA records and www points to `sproates.github.io`. The workflows
   use Pages settings, not a committed production CNAME file.
4. Dispatch the new main-branch website workflow. Verify successful deployment,
   every expected page/asset and provenance, Wasm MIME, HTTPS certificate/domain
   ownership and the www redirect. Enable HTTPS enforcement once GitHub accepts
   it. Keep the coordinating migration issue open if any check is unverified.
5. Record live acceptance and remove obsolete staging-only wording. Core keeps
   coordination/history links; website ROADMAP.md owns its transferred backlog.

If new publication fails, stop new deployments and restore the old repository's
saved domain setting to serve its previous deployment. Do not run both writers.
Restore retired core publishing code only through a reviewed revert PR with
required checks; a historical run must not silently deploy older source over
new main. Verify restored live bytes/HTTPS before calling rollback complete.
A temporary GitHub Pages routing/certificate delay is possible during the domain
move even though no DNS propagation change is required.

## Staging and backlog evidence

Website PR#1 merged as `66fb316`. Its
[main publication run](https://github.com/sproates/panackelty-website/actions/runs/37242899890)
passed all checks, deployment and byte verification. Merge time was
2026-10-04 23:12:13 UTC; run creation was 23:12:16 and completion 23:14:11:
118 seconds merge-to-verified-staging, including three seconds before run creation.
The browser loaded the project-path homepage and executed Hello, browser!
from the staged playground. Production timing remains separate.

Core analytics GI#252 transferred to website GI#2; deferred core website-CI GI#187
transferred to website GI#3, preserving history and status. ROADMAP.md carries
unissued adoption follow-ups and links core-owned programme/server dependencies.

Routine documentation and explicit presentation-only paths now use browser smoke
coverage for responsive resources, worker execution/errors and all selectable
examples through homepage navigation, across all configured engines. HTML,
release/runtime pins, workflows, assembly code, unknown changes and unavailable
comparison history retain full integration. Each route keeps assembly/link and
native released-example checks. No native core build is introduced.
