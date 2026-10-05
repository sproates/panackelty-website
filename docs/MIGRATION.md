# Migration acceptance

Independent website development, publication and backlog ownership are delivered.
This repository now owns and serves `panackelty.com`, with HTTPS enforcement
and successful technical production checks. **Owner-phone confirmation remains
pending**, so final migration acceptance is not yet recorded.

The initial cutover was rolled back after browser root requests returned 404
despite command-line verification. Republishing the exact original artifact
recovered root/www access and playground execution; the owner confirmed phone
recovery. A subsequent domain assignment followed immediately by fresh website
publication passed in the previously affected browser. These observations do
not establish the underlying cause of the original routing failure.

Core's ordinary website publisher is retired. Its bounded manual recovery
workflow is retained for rollback and requires first restoring the core domain
assignment. The historical core rerun still has inconsistent queued/completed
status; it cannot change domain ownership, and its unresolved state is not
reported as a successful cancellation. Do not retry it.

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

## Production acceptance checklist

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

The migration issue remains open until owner-device confirmation and the remaining
acceptance record are complete. No production
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

## Final cutover and timing evidence

[Website publication run 37245940764, attempt 3](https://github.com/sproates/panackelty-website/actions/runs/37245940764/attempts/3)
deployed website commit `7fa4ef8498f2147c15f44ad477ed7156f79b5534` after assigning
the domain to this repository. Publication ran from 00:06:50 to 00:07:08 UTC on
2026-10-05 and passed. Pages reports verified domain ownership and HTTPS
enforcement. Root and www loaded in the previously affected browser. Exact
website and playground asset bytes, Wasm MIME and publication provenance matched
the tested artifact. Owner-phone confirmation is pending.

Observed timings remain bounded measurements rather than guarantees:

| Observation | Elapsed | Queue/dispatch evidence |
| --- | --- | --- |
| Initial PR validation | 100s | 2s before first job; no action caches declared |
| Repeated full PR#5 validation | 98s, 00:00:31–00:02:09 UTC | 3s before first job |
| First main merge to verified staging | 118s | 3s from merge to run creation |
| PR#5 merge to required validation complete | 104s, 00:02:54–00:04:38 UTC | First job 00:02:59, 5s after merge |
| PR#5 merge to verified staging | 130s, ending 00:05:04 UTC | Includes dispatch, validation and publication |
| First documentation-only PR smoke validation | 92s, 00:09:57–00:11:29 UTC | 2s before first job; browser job 67s, nine tests 15.5s |
| Post-assignment production publication | 18s, 00:06:50–00:07:08 UTC | Publication phase only, not merge-to-live latency |

The repeated PR#5 timing evidence does not establish warm cache use. No action caches are configured. Initial and repeated full-route
observations are below the proposed three-minute validation and five-minute
merge-to-verified-site budgets where comparable; the production recovery phase
is not a comparable merge-to-live measurement. [Documentation-only run 37246410415](https://github.com/sproates/panackelty-website/actions/runs/37246410415)
used `mode: smoke` and passed all nine selected browser scenarios across three
engines, plus assembly and native release integrity. Final routine production
publication timing is recorded in the coordinating migration issue after merge.
