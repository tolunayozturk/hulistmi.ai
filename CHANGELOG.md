# Changelog

## 1.1.0

### Minor Changes

- Added 3 new catalogs: `harmonyos-releases`, `design-guides`, `best-practices`
- Refactored catalog handling into a generic pipeline (`src/lib/generic/index.ts`), eliminating per-catalog branching. Adding future catalogs now only requires updating `upstream-contract.json` and `labels.ts`
- Introduced `src/lib/catalog-name.ts` with a `CatalogName` union type, `SUPPORTED_CATALOGS` array, `isCatalogName()` guard, and label key maps that auto-propagate to routes, MCP tools, CLI, and tests

## 1.0.5

### Patch Changes

- Centralized hardcoded values: User-Agent, `/bot` page link, and rendered Markdown footer href now derive from `VERSION` and a `PUBLIC_ORIGIN` constant instead of stale `1.0` version and a `/#bot` fragment pointing at the homepage rather than the `/bot` route
- `src/index.ts` and `src/cli.ts` now call `generateHuaweiDocUrl` (with optional `catalogName` argument) instead of inline template literals
- Fixed protocol-relative search-result URLs that previously produced a double origin via new `resolveHuaweiDocUrl` helper
- HTTP `/search` guard and MCP schema now read `UPSTREAM_CONTRACT.search.maxQueryLength` instead of duplicated literal `120`
- Renamed `bodyForUIAbility` to `searchBodyTemplate` and cleared the placeholder `keyWord`

## 1.0.4

### Minor Changes

- Added Chinese (`cn`) language support across the HTTP API, MCP tools, and CLI
- `/consumer/cn/doc/<catalog>/<path>` routes serve Chinese-rendered Markdown
- `/catalog?language=cn` returns the Chinese catalog tree
- `/search?language=cn` accepted; CLI `search` gains `--language`/`-l` flag
- MCP tools accept optional `language: "en" | "cn"` input (default `"en"`)
- Rendered section labels and document frontmatter are localized per language

## 1.0.3

### Patch Changes

- Repository cleanup: rewrote commit history, adopted Changesets for versioning, switched to OIDC-based npm publishing
- Fixed `package.json` metadata: corrected owner URLs, added `author`, removed `preferGlobal`, added `sideEffects: false`, aligned `homepage`
- Renamed `LICENSE.md` to `LICENSE`
- README fixes: corrected clone URL, replaced live-host references with actual Cloudflare Workers URL

> Versions 1.0.0–1.0.2 had release-tooling issues. `1.0.3` re-publishes the unchanged source from the cleaned-up history.
