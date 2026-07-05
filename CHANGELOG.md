# Changelog

## 1.1.0

### Minor Changes

- [`1a006c7`](https://github.com/tolunayozturk/hulistmi.ai/commit/1a006c74441a56102483bcbb1d1021cfd4c50275) Thanks [@tolunayozturk](https://github.com/tolunayozturk)! - Add 3 new catalogs (releases, design-guides, best-practices) with generic catalog pipeline.

## 1.0.5

### Patch Changes

- Centralized hardcoded values that caused incorrect behavior: the User-Agent, `/bot` page link, and rendered Markdown footer href now derive from `VERSION` and a new `PUBLIC_ORIGIN` constant instead of a stale `1.0` version and a `/#bot` fragment that pointed at the homepage rather than the `/bot` route. `src/index.ts` and `src/cli.ts` now call `generateHuaweiDocUrl` (with a new optional `catalogName` argument, byte-identical when omitted) instead of inline template literals. A new `resolveHuaweiDocUrl` helper fixes protocol-relative search-result URLs that previously produced a double origin. The HTTP `/search` guard and the MCP schema read `UPSTREAM_CONTRACT.search.maxQueryLength` instead of the duplicated literal `120`. Renamed `bodyForUIAbility` to `searchBodyTemplate` and cleared the placeholder `keyWord` (always overridden by `buildSearchBody`).

## 1.0.4

### Minor Changes

- Add Chinese (`cn`) language support alongside English (`en`, default) across the HTTP API, MCP tools, and CLI. `/consumer/cn/doc/<catalog>/<path>` routes serve Chinese-rendered Markdown, `/catalog?language=cn` returns the Chinese catalog tree, `?language=cn` is accepted on `/search`, and the three MCP tools gain an optional `language: "en" | "cn"` input (default `"en"`). CLI `fetch` derives language from the URL prefix and no longer accepts bare shorthand paths; CLI `search` gains a `--language`/`-l` flag. Rendered section labels and document frontmatter are localized per language. `MCP_SERVER_INFO.version` is now sourced from `package.json` via `sync-version.mjs` to close the drift between the hardcoded version and the package version.

## 1.0.3

### Patch Changes

- Repository cleanup: rewrote commit history into a small set of conventional commits, adopted [Changesets](https://github.com/changesets/changesets) for versioning and releases, and switched to a provenance-safe publish flow.

- Fixed `package.json` metadata: corrected the `bugs` URL owner, set a real `author`, removed the discouraged `preferGlobal` flag, added `sideEffects: false`, aligned `homepage` with the live Cloudflare Workers URL, and switched `repository.url` to the `git+https` form.

- Renamed `LICENSE.md` to `LICENSE` and corrected the copyright holder.

- README fixes: corrected the clone URL owner, replaced `hulistmi.ai`-as-live-host references with the actual `hulistmi-ai.y6vd2dkjgb.workers.dev` URL, aligned the Node.js prerequisite with `engines.node`, fixed the `press <kbd>b</kbd>` phrasing, and clarified that `hulistmi serve` requires a repo checkout (it is not available from the published package).

> Note: Versions 1.0.0–1.0.2 were published to npm on 2026-06-28 in quick succession while fixing release-tooling issues. `1.0.3` re-publishes the unchanged source from the cleaned-up history; there are no functional changes since `1.0.0`.
