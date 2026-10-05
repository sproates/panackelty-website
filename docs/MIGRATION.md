# Migration acceptance

Independent website development, staging and backlog ownership are delivered.
**Production migration acceptance is pending.** The initial cutover was rolled
back after browser requests to the root returned 404 despite successful
command-line verification. Republishing the exact original artifact recovered
root/www browser access and playground execution; the owner confirmed phone
recovery. This observation does not establish the cause of the routing failure.
Production remains assigned to the core Pages site until a fresh cutover is
verified. Core's ordinary website publisher is retired; only the bounded
manual recovery mechanism remains.

The accepted source snapshot is core `5f92782`, recorded in `release-source.json`.
Core source retirement is complete, so future website edits belong here. Native
release-note promotion remains deliberate; it does not follow core main.

## Source snapshot record

Before retirement, snapshot reconciliation compared the recorded source with core for
`site/`, `CHANGELOG.md`, assembly/chrome/history helpers and their relevant tests.
Accepted changes were retained alongside the migration-only installer pins,
released-example labels and recorded-source link. Core no longer maintains these
website files. Future release-note snapshots update the recorded source commit
separately from the installer pin and require the promotion checks in README.md.

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
  separately. Targets remain unverified until measured. The implemented smoke route must
  retain its documented coverage; runtime/integration changes keep full tests.
- Agree and review the domain transfer and rollback sequence. Remove the old
  production writer in coordination with enabling the new one; never run both.
- Verify `panackelty.com`, TLS/domain ownership, publication provenance and
  deployed bytes, then record final acceptance in both repositories. Core source/workflow
  retirement is already merged; retain tested rollback until acceptance.

The migration issue remains open until production checks finish. No production
CNAME file is needed; use the explicitly approved Pages domain-setting change.

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

1. Verify the current reviewed website main and checks, accepted snapshot, staged
   browser behavior and the exact artifact intended for production. Snapshot the
   current Pages settings and publication identity. Keep the original recovery
   archive and manual workflow available.
2. Confirm the ordinary core Pages publisher remains disabled/retired and inspect
   any outstanding deployment before changing ownership. Never run two writers.
   The historical rerun showed inconsistent queued/completed API responses;
   do not retry it as a recovery mechanism.
3. Remove `panackelty.com` from core's Pages setting and assign it to this
   repository's Pages setting. DNS stays unchanged: apex GitHub Pages A/AAAA
   records and www pointing to `sproates.github.io`. No CNAME source file is used.
4. **Immediately dispatch a fresh main-branch website deployment after the
   domain assignment.** Do not rely on the prior staging deployment becoming
   available at the new domain merely because settings changed. A fresh dispatch
   is the recovery fallback if replay state is uncertain. Pages upload/deploy
   uses the matching `github-pages-RUN_ATTEMPT` name, preventing earlier attempts
   in the same run from making artifact selection ambiguous. The tested candidate
   remains unchanged.
5. Require successful deployment and exact live page/asset/provenance checks,
   correct Wasm MIME and valid HTTPS/domain settings. In a browser that previously
   exhibited the failure, open `/` and www, follow nested navigation and compile
   and run the playground example. Check the www redirect and record owner-device
   acceptance separately. A curl success, healthy `/index.html` or successful
   deploy job alone cannot substitute for root-page browser acceptance.
6. Record the verified artifact/commit, run links, browser/device results and
   timing before closing migration acceptance. Retain the recovery mechanism
   until these checks have passed; remove it only through a reviewed follow-up.

### Rollback requires republishing

Stop new website deployments, restore the core repository's saved domain setting,
then **dispatch a fresh `Website recovery` deployment after reassignment**. Merely
restoring the domain setting did not restore reliable root access during the
initial attempt. The bounded workflow introduced by
[core PR#295](https://github.com/sproates/panackelty/pull/295) verifies and redeploys
original artifact `11317802847` from run `37241687324`, preserving exact bytes
and provenance. It does not restore the retired source or automatic publisher.
See [the recovery instructions](https://github.com/sproates/panackelty/blob/main/docs/WEBSITE_RECOVERY.md).

[Recovery run 37245222845](https://github.com/sproates/panackelty/actions/runs/37245222845)
restored observed root/www browser access after domain rollback. Repeat the same
root/www browser, playground, exact-byte and HTTPS checks before declaring any
future rollback successful. Keep domain ownership stable while investigating
unexpected results; do not infer the underlying cause from a successful replay.

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
