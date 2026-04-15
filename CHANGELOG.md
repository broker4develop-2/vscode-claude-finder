# Changelog

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
