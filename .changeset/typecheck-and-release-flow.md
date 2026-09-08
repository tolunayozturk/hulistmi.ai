---
"@hulistmi/hulistmi": patch
---

Correct types in the published source. `buildCenterRequests` declares that it
returns both center requests, `SUPPORTED_CATALOGS` keeps its literal types so
the MCP catalog argument is checked, and `htmlToMarkdown` no longer assumes the
document root exists.
