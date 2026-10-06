#!/bin/sh
# Shared website/playground assembly for production and review builds.
set -eu
site=$1
playground=$2
destination=$3
for file in index.html capabilities/index.html get-started/index.html examples/index.html explain/index.html under-the-hood/index.html roadmap/index.html about/index.html styles.css chrome.css site.js favicon.svg; do test -s "$site/$file"; done
test -s "$playground/index.html"
version=$(cat "$playground/asset-version.txt")
case "$version" in *[!0-9a-f]*|'') echo 'Invalid playground asset version' >&2; exit 1;; esac
test "${#version}" -eq 64
for asset in style.css app.mjs examples.mjs controller.mjs worker.mjs runtime.mjs vm.wasm compiler.bc stdlib.json provenance.json LICENSE vendor/index.js vendor/LICENSE-MIT; do
    test -s "$playground/assets/$version/$asset"
done
test ! -e "$destination"
test ! -e "$site/playground"
test -s "$site/coverage/index.html"
test -s "$site/coverage/html/index.html"
test ! -e "$site/coverage/summary.txt"
test ! -e "$site/coverage/provenance.txt"
test -z "$(find "$site" "$playground" -type l -print)"
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' 0
trap 'exit 1' HUP INT TERM
sh "$(dirname "$0")/release_history.sh" "$site/.." > "$temporary/releases"
node "$(dirname "$0")/site_chrome.cjs" "$site/index.html" "$playground/index.html" playground > "$temporary/playground"
node "$(dirname "$0")/site_chrome.cjs" "$site/index.html" "$site/index.html" home > "$temporary/home"
for page in capabilities get-started examples explain under-the-hood roadmap about coverage coverage/html; do
    node "$(dirname "$0")/site_chrome.cjs" "$site/index.html" "$site/$page/index.html" "$page" > "$temporary/$(printf %s "$page" | tr / _)"
done
mkdir -p "$destination"
cp -R "$site/." "$destination/"
mkdir "$destination/playground" "$destination/releases"
cp -R "$playground/." "$destination/playground/"
cp "$temporary/releases" "$destination/releases/index.html"
cp "$temporary/playground" "$destination/playground/index.html"
cp "$temporary/home" "$destination/index.html"
for page in capabilities get-started examples explain under-the-hood roadmap about coverage coverage/html; do
    cp "$temporary/$(printf %s "$page" | tr / _)" "$destination/$page/index.html"
done
