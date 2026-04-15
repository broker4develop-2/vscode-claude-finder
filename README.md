# Claude Settings Manager

One sidebar to browse and edit every Claude Code setting on your machine — your **global** `~/.claude` config, **MCP servers**, the **current project**, and every **git repo's** `CLAUDE.md` / `AGENTS.md` / `.claude/` files.

Stop hunting for config files across a dozen repos. Open them all from one place.

## Features

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

| Setting | Default | Description |
|---------|---------|-------------|
| `claudeSettings.scanRoots` | `~/workspace-personal`, `~/workspace` | Folders to scan for git repos |
| `claudeSettings.scanDepth` | `3` | Max directory depth for the scan |
| `claudeSettings.showOnlyReposWithClaudeConfig` | `false` | Hide repos that have no CLAUDE.md / AGENTS.md / .claude/ |

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
