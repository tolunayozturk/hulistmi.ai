---
name: hulistmi
description: Use when fetching or searching HarmonyOS developer documentation in AI-readable Markdown.
---

# hulistmi

Use hulistmi.ai to fetch and search HarmonyOS developer documentation in AI-readable Markdown.

## HTTP API

- `GET /harmonyos-guides/<path>`
- `GET /harmonyos-references/<path>`
- `GET /search?q=<query>`
- `GET /catalog?catalogName=harmonyos-guides&language=en`

## MCP Tools

- `searchHarmonyOSDocumentation`
- `fetchHarmonyOSDocumentation`
- `fetchHarmonyOSCatalog`

## CLI

- `hulistmi search UIAbility --json`
- `hulistmi fetch /harmonyos-guides/start-overview`
