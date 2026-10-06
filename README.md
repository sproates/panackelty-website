# Panackelty website

Independent source and validation for the Panackelty website. Builds consume
reviewed released artifacts; they do not check out or compile the core project.
Website development and release promotion are independent of core. This repository
now serves [panackelty.com](https://panackelty.com/), with successful production
deployment, browser and exact-byte verification. See the
[cutover record](docs/MIGRATION.md) for evidence, limitations and recovery.

## Backlog

[ROADMAP.md](ROADMAP.md) records website-owned work and cross-repository
dependencies. Use this repository's issues for website changes; core language
and release programmes remain in core.

## Website structure

[Information architecture](docs/INFORMATION_ARCHITECTURE.md) records page ownership,
clean routes and release-content maintenance. Installation lives on Get started,
examples have their own catalogue and release history is generated at `/releases/`.
All pages use the homepage-owned shared navigation and footer.

## Develop and preview

Use Node 24, Git, Make, a POSIX shell, awk and tar. No npm packages are needed
for local assembly and automation tests.

```sh
make check
make build
make preview
```

`make check` runs offline automation, assembly and portable-preview tests.
`make build` downloads the checksummed browser release and writes a fresh
`build/website`; remove your previous generated build before rebuilding.
`make preview` prints a loopback URL and removes its temporary output when stopped.
Stop and restart after edits. A saved review artifact can be built with
`node scripts/preview.cjs build build/preview` and served with
`node scripts/preview.cjs serve build/preview 4173`.

`make release-check` verifies both advertised native archives against committed
checksums and the published checksum files, then checks, runs and compiles the
website examples using the matching released native toolchain. It supports
Linux x86-64 and macOS arm64 and requires network access.

Every PR also runs editorial navigation, release-status and clipboard checks
at desktop and phone widths. It runs these checks plus browser tests from an immutable reviewed
browser-repository commit. Documentation and explicit presentation-only paths
use smoke coverage across all three browsers: responsive resources, worker
compilation/errors and homepage navigation with every example. HTML, pins,
build/workflow code, unknown paths and missing comparison history retain the
full integration suite. The required `Website checks` job fails
if any dependency fails or is skipped. No core build or core CI run is required.
PR artifacts contain review previews with source identity and no-index metadata.

## Publish and promote releases

A successful main-branch run publishes its tested artifact to this repository's
configured GitHub Pages target. Immediately before deployment, an authenticated main
lookup rejects stale reruns and fails closed on API errors. `publication.json` identifies the website source
commit and validation run. Domain ownership is configured in Pages settings;
no production CNAME file is committed. Coverage remains independently published; coverage
entry pages link to the independently published report from `/coverage/` and `/coverage/html/` paths.

Creating a core or browser release does **not** update this repository or website.
A separate website PR promotes a release deliberately:

1. Choose an existing native release and record its version in
   `site/native-release.txt` and `site/native-release.json`. Obtain and review
   both published archive SHA-256 values; never derive a pin from an unchecked
   downloaded archive alone.
2. Update Get started download commands, installer version and versioned claims together.
   The installer URL uses the immutable `installerCommit` in `release-source.json`
   and passes an explicit `--version`; it never follows core main's default.
3. Copy the intended release notes into `CHANGELOG.md` and record the source
   commit in `release-source.json`. These are a reviewed snapshot, not notes
   fetched from core during builds. The rendered notes link to that exact source
   commit and label the website-selected release without claiming it is latest.
   Review pending/unreleased claims explicitly.
4. If promoting the browser runtime, update `site/playground.json` with its
   released tag, archive digest and asset identity. Native and browser versions
   may differ; explain the differences on the site.
5. Run checks, native release acceptance and browser integration, review the
   preview, then obtain explicit merge approval. A website merge is the promotion;
   the core release alone cannot cause it.

Rollback is a reviewed revert of website source/pins followed by the same checks
and publication. Do not introduce a second writer for the production domain.
Domain reassignment, including rollback, requires a fresh deployment afterwards
and browser/live-byte verification. A settings change alone is not acceptance.
See [migration acceptance](docs/MIGRATION.md) for the procedure and current evidence.
