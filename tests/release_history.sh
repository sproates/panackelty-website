#!/bin/sh
# Generated notes must follow the recorded source snapshot and release pins.
set -eu
root=$(pwd -P)
work=$(mktemp -d "${TMPDIR:-/tmp}/panack-history.XXXXXX")
trap 'rm -rf "$work"' 0
trap 'exit 1' HUP INT TERM
mkdir "$work/site"
cp site/index.html site/native-release.txt site/playground.json "$work/site/"
cp CHANGELOG.md "$work/CHANGELOG.md"
cp release-source.json "$work/release-source.json"
render() { sh "$root/scripts/release_history.sh" "$work"; }
render > "$work/first"
! grep -q 'Latest published\|current source\|blob/main/CHANGELOG' "$work/first"
source_commit=$(node -p "require('./release-source.json').commit")
grep -q "blob/$source_commit/CHANGELOG.md" "$work/first"
grep -q 'Website-selected native preview:' "$work/first"
! grep -q '<details class="release-pending">' "$work/first"
grep -q 'releases/tag/v0.1.0-alpha.12' "$work/first"
grep -q "blob/$source_commit/docs/guides/METHOD_MIGRATION.md" "$work/first"
grep -q '0.1.0-alpha.1</h2>' "$work/first"
! grep -q 'releases/tag/vUnreleased' "$work/first"
# Prepared version does not become downloadable just because notes were merged.
published=$(cat site/native-release.txt)
prepared=$(node -p "const v=require('./site/native-release.json').version; v.replace(/alpha[.](\\d+)$/, (_,n)=>'alpha.'+(Number(n)+1))")
awk -v published="$published" -v prepared="$prepared" '$1=="##" && $2==published { print "## " prepared " — 2026-10-22\n\n- Prepared only.\n" } { print }' CHANGELOG.md > "$work/CHANGELOG.md"
render > "$work/prepared"
grep -q 'Prepared notes' "$work/prepared"
! grep -q "releases/tag/v$prepared" "$work/prepared"
# Changes in canonical notes are reflected immediately; markup is escaped.
awk '/^## Unreleased/ { print; print "\n- New <script> & `safe` text.\n"; next } { print }' CHANGELOG.md > "$work/CHANGELOG.md"
render > "$work/second"
! cmp -s "$work/first" "$work/second"
grep -q 'New &lt;script&gt; &amp; <code>safe</code>' "$work/second"
grep -q '<details class="release-pending">' "$work/second"
for problem in duplicate empty heading inline markdown unsafe-link traversal-link date missing; do
    cp CHANGELOG.md "$work/CHANGELOG.md"
    case "$problem" in
      duplicate) printf '\n## Unreleased\n- Duplicate.\n' >> "$work/CHANGELOG.md" ;;
      empty) printf '\n## 0.1.0-alpha.0 — 2026-09-01\n' >> "$work/CHANGELOG.md" ;;
      heading) printf '\n#### Unsupported\n' >> "$work/CHANGELOG.md" ;;
      inline) printf '\n- Unclosed `code\n' >> "$work/CHANGELOG.md" ;;
      markdown) printf '\n- Unsupported **emphasis**\n' >> "$work/CHANGELOG.md" ;;
      unsafe-link) printf '\n- [Unsafe](javascript:bad)\n' >> "$work/CHANGELOG.md" ;;
      traversal-link) printf '\n- [Outside](docs/../secret)\n' >> "$work/CHANGELOG.md" ;;
      date) sed 's/2026-09-30/2026-02-30/' CHANGELOG.md > "$work/CHANGELOG.md" ;;
      missing) printf '0.1.0-alpha.99\n' > "$work/site/native-release.txt" ;;
    esac
    if render > "$work/bad" 2>/dev/null; then echo "Accepted $problem changelog" >&2; exit 1; fi
done
# Snapshot provenance is mandatory and must be an immutable core commit.
cp site/native-release.txt "$work/site/native-release.txt"
printf '{"repository":"sproates/panackelty","commit":"main"}\n' > "$work/release-source.json"
if render > "$work/bad" 2>/dev/null; then echo 'Accepted moving source reference' >&2; exit 1; fi
echo 'PASS release history: canonical changes, availability, escaping and malformed inputs'
