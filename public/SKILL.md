---
name: hulistmi
description: Use when fetching or searching HarmonyOS developer documentation in AI-readable Markdown.
---

# hulistmi

Use hulistmi-ai.y6vd2dkjgb.workers.dev to fetch and search HarmonyOS developer documentation in AI-readable Markdown.

## HTTP API

- `GET /consumer/en/doc/harmonyos-guides/<path>`
- `GET /consumer/en/doc/harmonyos-references/<path>`
- `GET /search?q=<query>`
- `GET /catalog?catalogName=harmonyos-guides&language=en`

## MCP Tools

- `searchHarmonyOSDocumentation`
- `fetchHarmonyOSDocumentation`
- `fetchHarmonyOSCatalog`

## CLI

- `hulistmi search UIAbility --json`
- `hulistmi fetch /consumer/en/doc/harmonyos-guides/start-overview`
