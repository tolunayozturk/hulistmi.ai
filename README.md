# hulistmi.ai

Making HarmonyOS docs AI-readable.

## HTTP API

- `GET /consumer/en/doc/harmonyos-guides/<path>`
- `GET /consumer/en/doc/harmonyos-references/<path>`
- `GET /search?q=<query>`
- `GET /catalog?catalogName=harmonyos-guides&language=en`

> Only English (`en`) documentation is currently supported.

## MCP

- Endpoint: `/mcp`
- WebMCP manifest: `/webmcp/manifest.json`
- Tools: `searchHarmonyOSDocumentation`, `fetchHarmonyOSDocumentation`, `fetchHarmonyOSCatalog`

## CLI

```bash
npx @hulistmi/hulistmi search UIAbility --json
npx @hulistmi/hulistmi fetch /consumer/en/doc/harmonyos-guides/pipwindow-overview
```

## Agent Skill

- `/SKILL.md`
- `/.well-known/agent-skills/hulistmi/SKILL.md`

hulistmi.ai is unofficial, on-demand, transient, and not a redistribution channel.

## Acknowledgements

hulistmi.ai is based on [sosumi.ai](https://sosumi.ai) by [NSHipster](https://nshipster.com) ([MIT](https://github.com/NSHipster/sosumi.ai/blob/main/LICENSE.md)).
