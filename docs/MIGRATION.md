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
