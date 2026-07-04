---
"@hulistmi/hulistmi": minor
---

Add Chinese (`cn`) language support alongside English (`en`, default) across the
HTTP API, MCP tools, and CLI. Catalog and document fetches now honor an
explicit `language` parameter: `/consumer/cn/doc/<catalog>/<path>` routes serve
Chinese-rendered Markdown, `/catalog?language=cn` returns the Chinese catalog
tree, `?language=cn` is accepted on `/search`, and the MCP tools gain an
optional `language: "en" | "cn"` (default `"en"`) input.

CLI `fetch` derives its language from the URL prefix (`/consumer/{en|cn}/doc/...`)
and no longer accepts bare shorthand paths like `harmonyos-guides/start-overview`
— pass the full Huawei doc URL or the full prefixed path. CLI `search` gains a
new `--language`/`-l` flag (default `en`).

The rendered section labels (catalog heading, search heading, document
frontmatter category, "Untitled" fallback) are now localized; the document
frontmatter's `language` field and `source` URL reflect the requested language.

Internal: `MCP_SERVER_INFO.version` is now sourced from `package.json` via a
`sync-version.mjs` script chained into `dev`/`deploy`/`prepublishOnly`, closing
the drift between the hardcoded MCP version and the package version.