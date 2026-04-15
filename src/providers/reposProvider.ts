import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findGitRepos, hasClaudeConfig, autoDetectRoots } from '../util/scan';
import { projectFiles } from '../paths';
import { exists } from '../util/fs';
import { FileItem } from './globalProvider';

export class RepoItem extends vscode.TreeItem {
  constructor(public readonly repoPath: string) {
    super(path.basename(repoPath), vscode.TreeItemCollapsibleState.Collapsed);
    const has = hasClaudeConfig(repoPath);
    this.iconPath = new vscode.ThemeIcon(has ? 'repo' : 'repo-clone');
    this.description = has ? '✓' : '';
    this.tooltip = repoPath;
    this.resourceUri = vscode.Uri.file(repoPath);
    this.contextValue = 'repo';
  }
}

export class DirItem extends vscode.TreeItem {
  constructor(label: string, public readonly dirPath: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.resourceUri = vscode.Uri.file(dirPath);
    this.iconPath = new vscode.ThemeIcon('folder');
    this.contextValue = 'dir';
  }
}

type Node = RepoItem | DirItem | FileItem | vscode.TreeItem;

export class ReposProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: Node) { return e; }

  getChildren(element?: Node): Node[] {
    if (!element) return this.rootRepos();
    if (element instanceof RepoItem) return this.repoFiles(element.repoPath);
    if (element instanceof DirItem) return this.dirChildren(element.dirPath);
    return [];
  }

  private rootRepos(): Node[] {
    const cfg = vscode.workspace.getConfiguration('claudeSettings');
    const userRoots = cfg.get<string[]>('scanRoots', []);
    const autoDetect = cfg.get<boolean>('autoDetectScanRoots', true);
    const depth = cfg.get<number>('scanDepth', 3);
    const onlyWithConfig = cfg.get<boolean>('showOnlyReposWithClaudeConfig', false);

    const rootSet = new Set<string>(userRoots);
    if (autoDetect) autoDetectRoots().forEach((r) => rootSet.add(r));
    const roots = [...rootSet];

    if (!roots.length) {
      const empty = new vscode.TreeItem('No dev folders detected — click + to add a scan root');
      empty.iconPath = new vscode.ThemeIcon('info');
      empty.command = { command: 'claudeSettings.addScanRoot', title: 'Add' };
      return [empty];
    }

    const all = new Set<string>();
    for (const r of roots) findGitRepos(r, depth).forEach((p) => all.add(p));
    let repos = [...all];
    if (onlyWithConfig) repos = repos.filter(hasClaudeConfig);
    if (!repos.length) {
      const empty = new vscode.TreeItem('No git repos found in scan roots');
      empty.iconPath = new vscode.ThemeIcon('info');
      return [empty];
    }
    return repos.map((p) => new RepoItem(p));
  }

  private repoFiles(repoPath: string): Node[] {
    const p = projectFiles(repoPath);
    const out: Node[] = [];
    const maybe = (label: string, fsPath: string, icon: string) => {
      if (exists(fsPath)) out.push(new FileItem(label, fsPath, icon));
    };
    maybe('CLAUDE.md', p.claudeMd, 'book');
    maybe('AGENTS.md', p.agentsMd, 'book');
    maybe('.claude/settings.json', p.settings, 'gear');
    maybe('.claude/settings.local.json', p.settingsLocal, 'gear');
    maybe('.claude/mcp.json', p.mcp, 'plug');
    if (exists(p.dotClaudeDir)) out.push(new DirItem('.claude/', p.dotClaudeDir));
    if (!out.length) {
      const empty = new vscode.TreeItem('No Claude config files');
      empty.iconPath = new vscode.ThemeIcon('info');
      out.push(empty);
    }
    return out;
  }

  private dirChildren(dirPath: string): Node[] {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return [];
    }
    entries.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    const items: Node[] = [];
    for (const e of entries) {
      const full = path.join(dirPath, e.name);
      if (e.isDirectory()) {
        items.push(new DirItem(e.name, full));
      } else {
        const icon = e.name.endsWith('.json') ? 'json'
          : e.name.endsWith('.md') ? 'book'
          : 'file';
        items.push(new FileItem(e.name, full, icon));
      }
    }
    return items;
  }
}
