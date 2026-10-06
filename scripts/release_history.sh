#!/bin/sh
# Render the documented changelog subset with validated snapshot provenance.
set -eu
[ "$#" = 1 ] || { echo 'usage: release_history.sh SOURCE_ROOT' >&2; exit 1; }
root=$1
script=$(CDPATH= cd "$(dirname "$0")" && pwd)
published=$(cat "$root/site/native-release.txt")
printf '%s\n' "$published" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+-alpha\.[0-9]+$'
browser=$(awk -F '"' '{ for(i=2;i<=NF;i+=2) if($i=="tag") print $(i+2) }' "$root/site/playground.json")
printf '%s\n' "$browser" | awk 'BEGIN { valid=1 } !/^v[0-9]+\.[0-9]+\.[0-9]+$/ { valid=0 } END { exit !(valid && NR==1) }'
source_commit=$(node -e '
  const fs = require("node:fs");
  const source = JSON.parse(fs.readFileSync(process.argv[1]));
  if (source.repository !== "sproates/panackelty" || !/^[a-f0-9]{40}$/.test(source.commit)) {
    throw new Error("Invalid release notes source snapshot");
  }
  console.log(source.commit);
' "$root/release-source.json")
fragment=$(mktemp)
trap 'rm -f "$fragment" "$fragment.page"' 0
trap 'exit 1' HUP INT TERM
awk -v published="$published" -v browser="$browser" -v source_commit="$source_commit" -f "$script/release_history.awk" "$root/CHANGELOG.md" > "$fragment"
awk -v fragment="$fragment" '
  $0 == "<!-- RELEASE_HISTORY -->" { count++; while((getline line < fragment)>0) print line; close(fragment); next }
  { print }
  END { if(count!=1) exit 1 }
' "$script/release_history.html" > "$fragment.page"
node "$script/site_chrome.cjs" "$root/site/index.html" "$fragment.page" releases
