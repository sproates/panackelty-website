.PHONY: check build preview release-check
check:
	node --test tests/*.test.cjs
	sh tests/pages.sh
build:
	node scripts/fetch_playground.cjs site/playground.json build/playground
	sh scripts/assemble_site.sh site build/playground build/website
	node scripts/check_pages.cjs build/website
preview:
	node scripts/preview.cjs
release-check:
	node scripts/check_native_release.cjs
