#!/bin/sh
# Execute the programs printed on the website, including their saved bytecode.
set -eu
command=${PANACK_SITE_COMMAND:-./panack}
html=${PANACK_SITE_HTML:-site/examples/index.html}
case "${1:-all}" in
    all) examples='hello guards exact result collections records filenames fibonacci explain' ;;
    release) examples=hello ;;
    capabilities) examples='cap-exact cap-types cap-pure cap-result'; html=site/capabilities/index.html ;;
    *) echo 'expected all, release or capabilities' >&2; exit 2 ;;
esac
work=$(mktemp -d "${TMPDIR:-/tmp}/panack-site-examples.XXXXXX")
trap 'rm -rf "$work"' 0
trap 'exit 1' HUP INT TERM
extract() {
    awk -v marker="id=\"$1\"" '
        index($0, marker) { active=1; next }
        active && /<\/(code|samp)>/ { exit }
        active { print }
    ' "$html" | sed 's/&gt;/>/g;s/&lt;/</g;s/&amp;/\&/g'
}
for example in $examples; do
    if [ "$example" = hello ]; then html=site/get-started/index.html; elif [ "$example" = explain ]; then html=site/explain/index.html; elif [ "${1:-all}" != capabilities ]; then html=${PANACK_SITE_HTML:-site/examples/index.html}; fi
    extract "$example-source" > "$work/$example.panack"
    extract "$example-output" > "$work/expected"
    case "$example" in
      cap-exact) printf '10\n0.125\n' > "$work/expected" ;;
      cap-types)
        printf '\nmain(): Void {\n  n: Positive = 42\n  port: Port = 8080\n  print(n)\n  print(port)\n}\n' >> "$work/$example.panack"
        printf '42\n8080\n' > "$work/expected" ;;
      cap-pure)
        printf '\nmain(): Void { print(twice(21)) }\n' >> "$work/$example.panack"
        printf '42\n' > "$work/expected" ;;
      cap-result)
        printf '\nmain(): Void {\n  print(value_or(Some(42), 7))\n  print(value_or(None(), 7))\n}\n' >> "$work/$example.panack"
        printf '42\n7\n' > "$work/expected" ;;
    esac
    test -s "$work/$example.panack" && test -s "$work/expected"
    "$command" check "$work/$example.panack" > "$work/check"
    "$command" run "$work/$example.panack" > "$work/actual"
    cmp "$work/expected" "$work/actual"
    "$command" compile "$work/$example.panack" -o "$work/$example.bc" > "$work/compile"
    "$command" run "$work/$example.bc" > "$work/actual"
    cmp "$work/expected" "$work/actual"
    if [ "$example" = explain ]; then
      "$command" explain "$work/$example.panack" --function remaining > "$work/explanation"
      grep -q '^program: accepted$' "$work/explanation"
      grep -q '^subtraction: proved$' "$work/explanation"
      grep -q '^left lower bound: 2$' "$work/explanation"
      sed 's/n - 2/n - 3/' "$work/$example.panack" > "$work/unproved.panack"
      if "$command" explain "$work/unproved.panack" --function remaining > "$work/unproved" 2> "$work/diagnostic"; then
        echo 'Accepted insufficient subtraction bound' >&2; exit 1
      fi
      grep -q '^program: rejected$' "$work/unproved"
      grep -q '^subtraction: unproved$' "$work/unproved"
      extract explain-effect-source > "$work/report.panack"
      if "$command" explain "$work/report.panack" --function report > "$work/effect" 2> "$work/diagnostic"; then
        echo 'Accepted printing from a pure function' >&2; exit 1
      fi
      grep -q '^effect boundary: rejected$' "$work/effect"
      grep -q '^context: pure$' "$work/effect"
      grep -q 'pure function cannot call impure function print' "$work/diagnostic"
    fi
done
echo 'PASS website examples through source and bytecode'
