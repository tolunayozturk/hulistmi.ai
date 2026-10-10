# Changelog

## 1.4.0

### Minor Changes

- Remove the `hulistmi serve` command. It worked only in a clone of the repository, where `npm run dev` does the same.

### Patch Changes

- Run the CLI when the install path has a space, and on Windows. Before, the CLI stopped without output.

- Show only a valid value in a `--language` warning.

- Start the CLI without a shell on Windows. Before, characters such as `&` in a URL or a search query ran as commands.

- Pass SIGTERM to the CLI process, and report a process that a signal stops as a failure.

- Show control characters from Huawei content as U+FFFD in CLI output, so the content cannot change the terminal.

- Refuse a JSON-RPC batch on `/mcp`. Before, one request carried many tool calls but counted as one request against the rate limit.

- Answer `GET /mcp` with 405. Before, the request opened an event stream that the server did not use.

- Do not follow a redirect from the Huawei API.

- Count each spelling of a route path in one rate-limit bucket. Before, a percent-encoded path such as `/%73earch` got a new bucket.

- Keep a search query on one line in the Markdown heading.

- Trim slashes from a page path in linear time. Before, a path with a long run of slashes used much CPU.

## 1.3.1

### Patch Changes

- Accept a Huawei documentation URL and a `/consumer/{en|cn}/doc/<catalog>/<path>` path in the `fetchHarmonyOSDocumentation` MCP tool, as `SKILL.md` describes.

- Keep the document ETag when Huawei signs the image links again. The ETag changes when the text changes, and on the next day, when the image links expire.

## 1.3.0

### Minor Changes

- Present the origin of the deployment, not the hosted origin, in the document footer, on `/bot`, in the `User-Agent`, and on the static pages. A self-hosted deployment links to the hosted version. The `PUBLIC_ORIGIN` var and the `HULISTMI_PUBLIC_ORIGIN` environment variable override the origin.

### Patch Changes

- Remove the unused `zod-to-json-schema` dependency.

## 1.2.0

### Minor Changes

- Add the `harmonyos-faqs` catalog.

### Patch Changes

- Answer 404 instead of 502 for a document that does not exist on Huawei.

## 1.1.4

### Patch Changes

- [#3](https://github.com/tolunayozturk/hulistmi.ai/pull/3) [`377acab`](https://github.com/tolunayozturk/hulistmi.ai/commit/377acab3f9b2cda62b6e95e31617a318b4693cd4) - Keep the inline content of a list item on one line, and keep code spans. Render a definition list as a bold term above its definition.

- [#4](https://github.com/tolunayozturk/hulistmi.ai/pull/4) [`4318c48`](https://github.com/tolunayozturk/hulistmi.ai/commit/4318c482f73e83d378ae6728aba6d791ac5bec35) - Remove the `timestamp` field from the document frontmatter, so the same page always has the same ETag. The retrieval time is now in the `X-Retrieved-At` response header.

- [#1](https://github.com/tolunayozturk/hulistmi.ai/pull/1) [`3782de1`](https://github.com/tolunayozturk/hulistmi.ai/commit/3782de1dd8040be273ff3be4d585d429dbcca480) - Accept underscores in document slugs, also as the first character. Pages such as `_ark_ui_compile` were not reachable.

- [#6](https://github.com/tolunayozturk/hulistmi.ai/pull/6) [`6185b64`](https://github.com/tolunayozturk/hulistmi.ai/commit/6185b64f2f6a5cdb2b84e91f9750db9834a605bb) - Correct types in the published source.

## 1.1.3

### Patch Changes

- [`31d4d07`](https://github.com/tolunayozturk/hulistmi.ai/commit/31d4d07df660adfcfe58e3c604cc6a01cf47837c) - Enforce rate limiting on public routes via Cloudflare ratelimits binding

## 1.1.2

### Patch Changes

- [`985da1f`](https://github.com/tolunayozturk/hulistmi.ai/commit/985da1fba6b1ecaef21525a89f2e0ad09e4724c3) - rendering improvements: fenced code blocks with language detection, bold/emphasis/superscript/subscript, image rendering with fallback alt text, [hX] heading artifact stripping, duplicate h1 removal, and list item code block support

## 1.1.1

### Patch Changes

- Replace regex-based error message echo with typed `ValidationError` class for safer error handling

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
