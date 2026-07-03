# Changelog

## 1.0.3

### Patch Changes

- Repository cleanup: rewrote commit history into a small set of conventional commits, adopted [Changesets](https://github.com/changesets/changesets) for versioning and releases, and switched to a provenance-safe publish flow.

- Fixed `package.json` metadata: corrected the `bugs` URL owner, set a real `author`, removed the discouraged `preferGlobal` flag, added `sideEffects: false`, aligned `homepage` with the live Cloudflare Workers URL, and switched `repository.url` to the `git+https` form.

- Renamed `LICENSE.md` to `LICENSE` and corrected the copyright holder.

- README fixes: corrected the clone URL owner, replaced `hulistmi.ai`-as-live-host references with the actual `hulistmi-ai.y6vd2dkjgb.workers.dev` URL, aligned the Node.js prerequisite with `engines.node`, fixed the `press <kbd>b</kbd>` phrasing, and clarified that `hulistmi serve` requires a repo checkout (it is not available from the published package).

> Note: Versions 1.0.0–1.0.2 were published to npm on 2026-06-28 in quick succession while fixing release-tooling issues. `1.0.3` re-publishes the unchanged source from the cleaned-up history; there are no functional changes since `1.0.0`.