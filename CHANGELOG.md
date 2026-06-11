# Changelog

## [0.3.0] - 2026-06-11
### Added
- **📊 Usage & cost dashboard** (webview) — today / 7-day / 30-day / all-time cost and token totals, a 30-day daily-cost bar chart, and cost-by-project / cost-by-model breakdowns. Parsed from `~/.claude/projects` session logs with `message.id` de-duplication (resumed/forked sessions no longer double-count).
- **Status-bar item** showing today's Claude Code spend; click to open the dashboard. Toggle with `claudeSettings.showStatusBar`.
- **Configurable pricing** via `claudeSettings.pricing` (per-million-token rates keyed by `opus` / `sonnet` / `haiku`), merged over built-in Claude 4.x defaults.
- **🎛 Manage view** — toggle plugins (`enabledPlugins`) and MCP servers on/off inline, plus a read-only hooks visualizer (event → command). Disabled MCP servers are parked under `_disabledMcpServers` and restored on re-enable.
### Changed
- Rebranded the Marketplace description and keywords around usage/cost tracking (the signature feature).

## [0.2.2] - 2026-04-16
### Changed
- Rebranded to **Claude Code Navigator** (displayName) for better Marketplace discoverability
- Rewrote description and expanded keywords (claude code, CLAUDE.md, AGENTS.md, mcp, anthropic, …)
- Internal extension ID unchanged (`broker4develop.claude-settings-manager`) so existing installs keep working

## [0.2.1] - 2026-04-16
### Added
- Global view: rules/, plans/, todos/, config/, local/ directories with dedicated icons

## [0.2.0] - 2026-04-15
### Added
- Inline folder expansion in the Global view (no more jumping to Finder)
- Right-click context menu on files / folders / repos: Reveal in Finder, Open in Integrated Terminal, Copy Path, Copy Relative Path, Rename, Delete (to Trash)
- Shared tree-item module (`items.ts`) reused by Global, Repo, and Project views

## [0.1.3] - 2026-04-15
### Changed
- Removed personal default paths from `scanRoots`
- Added `claudeSettings.autoDetectScanRoots` (default `true`) that auto-detects common dev folders under `~` (workspace, projects, code, dev, src, repos, work, Documents/GitHub, …)

## [0.1.2] - 2026-04-15
### Changed
- Rewrote Marketplace description and README to cover the Repo view and per-repo config editing
- Expanded keywords (claude.md, agents.md, mcp, project-manager, repo-finder) for better search discoverability

## [0.1.1] - 2026-04-15
### Fixed
- Force republish to ensure Repo view and Claude+gear icon are included
- Reordered sidebar: Global → Repo → MCP Servers → Project

## [0.1.0] - 2026-04-15
### Added
- Repo view — scans git repos under configured roots and exposes per-repo Claude config
- Inline folder exploration for `.claude/` (no longer opens Finder)
- Hide missing files by default (only show existing ones)
- Claude + gear Activity Bar icon

## [0.0.1] - 2026-04-15
### Added
- Initial scaffold with Global / MCP / Project tree views
- Open-or-create command, refresh-on-save
