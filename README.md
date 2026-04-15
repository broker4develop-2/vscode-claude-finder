# Claude Settings Manager

Manage your Claude Code **global**, **MCP**, and **project** settings from a single VSCode sidebar.

## Features
- 🌐 Global view — `~/.claude/CLAUDE.md`, `settings.json`, `settings.local.json`, skills/plugins/hooks folders
- 🔌 MCP view — browse `mcp_settings.json` and list registered MCP servers
- 📁 Project view — current workspace's `CLAUDE.md`, `AGENTS.md`, and `.claude/` files
- One-click open / create-if-missing
- Auto-refresh on save

## Development
```bash
npm install
npm run watch        # in one terminal
# press F5 in VSCode → Extension Development Host
```

## Package / Publish
```bash
npm run package               # produces .vsix
npx vsce publish              # VS Marketplace (needs PAT)
npm publish                   # npm (optional)
```

## Requirements
- VSCode ≥ 1.85
- Node ≥ 18
- A `publisher` ID in `package.json` before publishing

## License
MIT
