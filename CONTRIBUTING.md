# Contributing

Use a dedicated descriptive branch and a pull request targeting `main`.
Substantive changes require independent review, passing `Website checks`, a
current branch and explicit owner approval before merge. Do not push directly
to main. Use the project GitHub noreply identity for commits.

Run `make check` after your final edit. Run `make release-check` for release pins,
examples and download changes; hosted CI runs it for every change. Explicit
documentation/presentation-only paths use the pinned three-engine smoke suite;
HTML, pins, integration code, unknown paths and unavailable comparison history
retain full browser integration. See README.md for the exact boundary. Provide a working preview
for content or visual changes. Keep generated artifacts out of commits.

Website source is independent of the core compiler and browser repositories.
Follow the release promotion procedure in README.md instead of following new
releases automatically. Never update production-domain settings as a side
effect of routine content work.
