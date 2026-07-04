---
name: hulistmi
description: Use when fetching or searching HarmonyOS developer documentation in AI-readable Markdown. Supports English (en, default) and Chinese (cn).
---

# hulistmi

Use hulistmi-ai.y6vd2dkjgb.workers.dev to fetch and search HarmonyOS developer documentation in AI-readable Markdown.

Both English (`en`, default) and Chinese (`cn`) documentation are supported. For `fetchHarmonyOSDocumentation`, use the `/consumer/{en|cn}/doc/<catalog>/<path>` prefix to pick the language. For `fetchHarmonyOSCatalog` and `searchHarmonyOSDocumentation`, pass `language=cn` to receive Chinese content.

## HTTP API

- `GET /consumer/en/doc/harmonyos-guides/<path>`
- `GET /consumer/cn/doc/harmonyos-guides/<path>`
- `GET /consumer/en/doc/harmonyos-references/<path>`
- `GET /consumer/cn/doc/harmonyos-references/<path>`
- `GET /search?q=<query>&language=en|cn`
- `GET /catalog?catalogName=harmonyos-guides&language=en|cn`

## MCP Tools

- `searchHarmonyOSDocumentation` — accepts optional `language: "en" | "cn"` (default `"en"`)
- `fetchHarmonyOSDocumentation` — accepts optional `language: "en" | "cn"` (default `"en"`)
- `fetchHarmonyOSCatalog` — accepts optional `language: "en" | "cn"` (default `"en"`)

## CLI

- `hulistmi search UIAbility --language cn --json`
- `hulistmi fetch /consumer/en/doc/harmonyos-guides/start-overview`
- `hulistmi fetch /consumer/cn/doc/harmonyos-guides/start-overview`
