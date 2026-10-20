# Contributing

Use a dedicated descriptive branch and a pull request targeting `main`.
Substantive changes require a pull request to `main`, passing `Website checks`,
a current branch and explicit owner approval before merge. The owner may record
approval on the pull request or in the associated project conversation. Do not
push directly to main. Use the project GitHub noreply identity for commits.

For text-only edits, verify the requested wording in the source and rendered
preview, check affected links and anchors, and run `git diff --check`. This
includes prose, labels and link text or destinations in Markdown, HTML or template
strings, provided the change does not alter rendering logic, page structure,
styles, executable examples, release pins or download coordinates. Regenerate
any affected output through its existing generator. These edits do not require
local `make check` or a browser test suite; existing hosted checks still apply.
Use the same focused verification for contributor-guidance prose changes, with
source review instead of a rendered preview when the file is not published.

For other changes, run `make check` after your final edit.
Run `make release-check` for release pins,
examples and download changes; hosted CI runs it for every change. Explicit
documentation/presentation-only paths use the pinned three-engine smoke suite;
HTML, pins, integration code, unknown paths and unavailable comparison history
retain full browser integration. See README.md for the exact boundary. Provide a working preview
for content or visual changes. Keep generated artifacts out of commits.

Website source is independent of the core compiler and browser repositories.
Follow the release promotion procedure in README.md instead of following new
releases automatically. Never update production-domain settings as a side
effect of routine content work.

For an approved hosting cutover or rollback, follow [the migration procedure](docs/MIGRATION.md).
Publish freshly after assigning the domain, then verify the root and www in a
browser, playground execution and exact deployed bytes. Do not mark production
accepted from a domain setting, command-line check or deployment result alone.
