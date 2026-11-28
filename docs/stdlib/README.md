# Website standard library documentation

`snapshot.json` records the reviewed core revision and all public routes. The
reference is self-contained: module pages must document imports, function
signatures, each parameter, return values, behaviour, errors and relevant bounds
and ownership. Ordinary and async forms belong together. Link to other website
reference entries and complete examples; GitHub is an optional implementation
reference, never a substitute for API documentation.

The twenty `API_*.md` module pages, standard-library index and practical
walkthrough are website-authored. Four other guides and twelve examples are copied
from the recorded core revision. `api-signatures.json` records the 75 reviewed
public function signatures and their defining source files, including re-exports.
Compatibility and internal support APIs are identified where relevant rather
than presented as the recommended application interface.

Run `node scripts/stdlib_docs.cjs` to regenerate pages.
`node scripts/stdlib_docs.cjs --check` checks synchronization; `make check`
checks signature presence, parameter/return sections, local module navigation,
examples, anchors, assembly and preview behaviour. When the core API changes,
review the prose and limits as well as refreshing signatures and example bytes.
A signature check alone does not verify behaviour.

Development labelling does not advance alpha.15 release pins or the playground.
Published articles are unchanged. Owner preview review and separately approved
website integration/publication remain required.
