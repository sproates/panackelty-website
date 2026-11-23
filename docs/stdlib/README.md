# Website stdlib documentation snapshot

`snapshot.json` records the reviewed core commit and the five public routes.
Four Markdown documents and all nine example sources are copied from that
commit. `ASYNC_STDLIB_BASICS.md` is website-authored narrative using those exact
examples; its metadata marks it as site-authored. The core revision is a content
reference, not a new release pin or a request to build the compiler.

Run `node scripts/stdlib_docs.cjs` to regenerate the five HTML pages.
`node scripts/stdlib_docs.cjs --check` checks synchronization; `make check`
includes code-preservation, anchor, table, assembly and preview tests.

Update copied Markdown and source examples together with their core revision.
External code/specification links use that revision so development references
work before integration and cannot silently point at a different API. Internal
links between the guides and embedded examples stay on this website.

These pages are labelled alpha.16 development. They do not change alpha.15
release pins, the playground, released HTTP references or published articles.
Owner preview review and a separately approved website merge/publication remain
required. CI remains off for this development branch under the owner's trial.
