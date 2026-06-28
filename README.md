# hulistmi.ai

Making HarmonyOS docs AI-readable.

[hulistmi.ai](https://hulistmi.ai)
provides HarmonyOS developer documentation in an AI-readable format
by converting web-rendered pages into Markdown.

## Usage

### HTTP API

Replace `developer.huawei.com/consumer/en/doc/` with `hulistmi.ai/`
in any HarmonyOS documentation URL:

**Original:**

```
https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview
```

**AI-readable:**

```
https://hulistmi.ai/consumer/en/doc/harmonyos-guides/start-overview
```

This works for all HarmonyOS guides and API reference documentation.

Search is also supported:

```
https://hulistmi.ai/search?q=UIAbility
```

And you can browse the full documentation catalog:

```
https://hulistmi.ai/catalog?catalogName=harmonyos-guides&language=en
```

> Only English (`en`) documentation is currently supported.

### MCP Integration

Hulistmi's MCP server supports Streamable HTTP transport.
Configure your MCP client to connect to `https://hulistmi.ai/mcp`.

If your client requires stdio transport,
you can proxy over stdio using `mcp-remote`:

```json
{
  "mcpServers": {
    "hulistmi": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://hulistmi.ai/mcp"]
    }
  }
}
```

#### Available Tools

- `searchHarmonyOSDocumentation` - Searches HarmonyOS developer documentation
  - Parameters: `query` (string)
  - Returns structured results with titles, URLs, and descriptions

- `fetchHarmonyOSDocumentation` - Fetches a HarmonyOS documentation page as Markdown
  - Parameters: `path` (string) — Documentation path (e.g., `/consumer/en/doc/harmonyos-guides/start-overview`)
  - Returns content as Markdown

- `fetchHarmonyOSCatalog` - Fetches a HarmonyOS documentation catalog tree
  - Parameters: `catalogName` ("harmonyos-guides" | "harmonyos-references"), `depth` (number, optional)
  - Returns the catalog as a Markdown listing

### WebMCP

Hulistmi also supports the WebMCP protocol.
The manifest is available at:

```
https://hulistmi.ai/webmcp/manifest.json
```

### CLI

Hulistmi provides a CLI that complements MCP:

```bash
npx @hulistmi/hulistmi fetch https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview
```

If you use it regularly, install once:

```bash
npm i -g @hulistmi/hulistmi
```

Then use `hulistmi` directly:

```bash
hulistmi fetch https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview
```

Short paths work too:

```bash
hulistmi fetch /consumer/en/doc/harmonyos-guides/start-overview
hulistmi fetch harmonyos-guides/start-overview
```

Search documentation:

```bash
hulistmi search UIAbility
```

Run a local server from the published package:

```bash
hulistmi serve
hulistmi serve --port 8787
```

By default, output is plain text / Markdown.
Use JSON output for scripts:

```bash
hulistmi fetch /consumer/en/doc/harmonyos-guides/start-overview --json
hulistmi search UIAbility --json
```

### AI Agent Skill

Want your AI coding assistant to use Hulistmi consistently?
Use the hosted skill file:
[`https://hulistmi.ai/SKILL.md`](https://hulistmi.ai/SKILL.md)

Spec-compliant clients can also install it with:

```bash
npx skills add https://hulistmi.ai
```

## Self-Hosting

This project is designed to be easily run on your own machine
or deployed to a hosting provider.

Hulistmi.ai is currently hosted by
[Cloudflare Workers](https://workers.cloudflare.com).

> The application is built with Hono,
> making it compatible with various runtimes.
>
> See the [Hono docs](https://hono.dev/docs/getting-started/basic)
> for more information about deploying to different platforms.

### Prerequisites

- Node.js 20+
- npm

### Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/hulistmi/hulistmi.ai.git
   cd hulistmi.ai
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

Once the application is up and running, press the <kbd>b</kbd>
to open the URL in your browser.

To configure MCP clients to use your development server,
replace `hulistmi.ai` with the local server address
(`http://localhost:8787` by default).

## Development

### Testing

This project uses [vitest](https://vitest.dev)
for unit and integration testing.

```bash
npm run test          # Watch mode
npm run test:run      # Run tests once
```

> When running the CLI through npm scripts during local development,
> use `-s` (`--silent`)
> to suppress npm's script preamble so output pipes cleanly:
>
> ```bash
> npm run -s cli -- fetch /consumer/en/doc/harmonyos-guides/start-overview | bat -l md
> ```

### Code Quality

This project uses [Biome](https://biomejs.dev/)
for code formatting, linting, and import organization.

- `npm run format` - Format all code files
- `npm run lint` - Lint and fix code issues
- `npm run check` - Format, lint, and organize imports (recommended)
- `npm run check:ci` - Check code without making changes (for CI)

### Editor Integration

For the best development experience, install the Biome extension for your editor:

- [VSCode](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [Vim/Neovim](https://github.com/biomejs/biome/tree/main/editors/vim)
- [Emacs](https://github.com/biomejs/biome/tree/main/editors/emacs)

### Cloudflare Workers

Whenever you update your `wrangler.jsonc` or change your Worker bindings,
be sure to re-run:

```bash
npm run cf-typegen
```

### Publishing

Publishing can be done with:

```bash
npm publish
```

## Acknowledgements

hulistmi.ai is based on [sosumi.ai](https://sosumi.ai) by [NSHipster](https://nshipster.com) ([MIT](https://github.com/NSHipster/sosumi.ai/blob/main/LICENSE.md)).

## License

This project is available under the MIT license.
See the [LICENSE](LICENSE.md) file for more info.

## Legal

This is an unofficial,
independent project and is not affiliated with or endorsed by Huawei Technologies Co., Ltd.
"HarmonyOS" and related marks are trademarks of Huawei Technologies Co., Ltd.

This service is an accessibility-first,
on-demand renderer.
It converts a single HarmonyOS documentation page to Markdown only when requested by a user.
It does not crawl, spider, or bulk download;
it does not attempt to bypass authentication or security;
and it implements rate limiting to avoid imposing unreasonable load.

Content is fetched transiently and may be cached briefly to improve performance.
No permanent archives are maintained.
All copyrights and other rights in the underlying content remain with Huawei Technologies Co., Ltd.
Each page links back to the original source.

Your use of this service must comply with Huawei's Terms of Use and applicable law.
You are solely responsible for how you access and use Huawei's content through this tool.
Do not use this service to circumvent technical measures or for redistribution.

**Contact:** <info@hulistmi.ai>
