---
name: hulistmi
description: Use when fetching or searching HarmonyOS developer documentation in AI-readable Markdown. Supports English (en, default) and Chinese (cn).
---

# hulistmi

Use hulistmi-ai.y6vd2dkjgb.workers.dev to fetch and search HarmonyOS developer documentation in AI-readable Markdown.

Both English (`en`, default) and Chinese (`cn`) documentation are supported. For `fetchHarmonyOSDocumentation`, use the `/consumer/{en|cn}/doc/<catalog>/<path>` prefix to pick the language. For `fetchHarmonyOSCatalog` and `searchHarmonyOSDocumentation`, pass `language=cn` to receive Chinese content.

## Supported catalogs

- `harmonyos-guides`
- `harmonyos-references`
- `harmonyos-releases`
- `design-guides`
- `best-practices`

## HTTP API

- `GET /consumer/en/doc/harmonyos-guides/<path>`
- `GET /consumer/cn/doc/harmonyos-guides/<path>`
- `GET /consumer/en/doc/harmonyos-references/<path>`
- `GET /consumer/cn/doc/harmonyos-references/<path>`
- `GET /consumer/{en|cn}/doc/harmonyos-releases/<path>`
- `GET /consumer/{en|cn}/doc/design-guides/<path>`
- `GET /consumer/{en|cn}/doc/best-practices/<path>`
- `GET /search?q=<query>&language=en|cn`
- `GET /catalog?catalogName=<name>&language=en|cn` (any of the 5 supported catalogs above)

## MCP Tools

- `searchHarmonyOSDocumentation` — accepts optional `language: "en" | "cn"` (default `"en"`)
- `fetchHarmonyOSDocumentation` — accepts optional `language: "en" | "cn"` (default `"en"`); the `path` must start with one of the supported catalog names (e.g. `harmonyos-guides/<slug>`, `harmonyos-releases/<slug>`, …)
- `fetchHarmonyOSCatalog` — accepts optional `language: "en" | "cn"` (default `"en"`) and `catalogName` (one of the 5 supported catalogs; default `harmonyos-guides`)

## CLI

- `hulistmi search UIAbility --language cn --json`
- `hulistmi fetch /consumer/en/doc/harmonyos-guides/start-overview`
- `hulistmi fetch /consumer/cn/doc/harmonyos-guides/start-overview`
- `hulistmi fetch /consumer/en/doc/harmonyos-releases/overview-allversion`
- `hulistmi fetch /consumer/en/doc/best-practices/bpta-app-architecture-overview`