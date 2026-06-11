# Claude Code Navigator

See how much Claude Code is costing you, and manage every config from one VSCode sidebar.

- **📊 Usage & cost dashboard** — tokens and $ spend by day, project, and model, parsed straight from your own `~/.claude` logs. No account, no API key.
- **🎛 Manage panel** — toggle plugins and MCP servers on/off, see every hook at a glance.
- **🗂 Config navigator** — open any `CLAUDE.md` / `AGENTS.md` / `.claude/` file across your whole machine and every git repo.

## Features

### 📊 Usage Dashboard

Click the **graph icon** in the sidebar header (or run **“Claude: Open Usage Dashboard”**) to see:

- **Today / 7-day / 30-day / all-time** cost and token totals
- A **30-day daily-cost bar chart**
- **Cost by project** and **cost by model** breakdowns
- A live **status-bar item** showing today's spend — click it to open the dashboard

Numbers come from the session logs Claude Code already writes to `~/.claude/projects` (duplicate messages from resumed/forked sessions are de-duplicated, the way `ccusage` does it). Prices are estimates for the Claude 4.x family and are fully adjustable via the `claudeSettings.pricing` setting.

### 🎛 Manage

A single panel to run your setup without hand-editing JSON:

- **Plugins** — enable/disable each entry in `enabledPlugins` with one click
- **MCP Servers** — toggle servers on/off (disabled servers are parked safely and restored on re-enable)
- **Hooks** — a read-only tree of every event → command, so you can see what's wired up

### 🌐 Global

Direct access to your machine-wide Claude Code configuration:

- `~/.claude/CLAUDE.md` — global instructions
- `~/.claude/settings.json` / `settings.local.json`
- `skills/`, `plugins/`, `hooks/`, `backups/`, `projects/` folders

### 📁 Repo

Scans configured root folders for git repositories and lists them like a project manager. Each repo expands to show:

- `CLAUDE.md`, `AGENTS.md`
- `.claude/settings.json`, `settings.local.json`, `mcp.json`
- `.claude/` folder — fully browsable inline (no jumping to Finder)

Repos with any Claude config get a ✓ marker so you can spot them at a glance. Missing files are hidden by default to keep the tree clean.

### 🔌 MCP Servers

Opens `~/.claude/mcp_settings.json` and lists every registered MCP server with its command/URL inline.

### 🗂 Project

Current workspace's Claude config (`CLAUDE.md`, `AGENTS.md`, `.claude/*`).

## Settings

| Setting                                        | Default | Description                                                                                                          |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `claudeSettings.scanRoots`                     | `[]`    | Extra folders to scan for git repos                                                                                  |
| `claudeSettings.autoDetectScanRoots`           | `true`  | Auto-detect `~/workspace`, `~/projects`, `~/code`, `~/dev`, `~/src`, `~/repos`, `~/work`, `~/Documents/GitHub`, etc. |
| `claudeSettings.scanDepth`                     | `3`     | Max directory depth for the scan                                                                                     |
| `claudeSettings.showOnlyReposWithClaudeConfig` | `false` | Hide repos that have no CLAUDE.md / AGENTS.md / .claude/                                                             |
| `claudeSettings.showStatusBar`                 | `true`  | Show today's Claude Code spend in the status bar                                                                     |
| `claudeSettings.pricing`                       | `{}`    | Override per-million-token prices (keyed by `opus` / `sonnet` / `haiku`, with `input` / `output` / `cacheWrite` / `cacheRead`) |

Add scan roots via the **+** button in the Repo view, or edit settings directly.

## Usage

1. Click the Claude shield icon in the Activity Bar
2. Click any file to open it — missing files prompt you to create them
3. Use the **+** in the Repo view header to add a scan root (e.g. your `~/code` folder)
4. Save changes; the tree auto-refreshes

## Requirements

- VSCode ≥ 1.85
- Claude Code installed (optional — the extension just reads/writes the config files)

## Feedback

Issues and PRs welcome at the repository linked on this page.

## License

MIT
