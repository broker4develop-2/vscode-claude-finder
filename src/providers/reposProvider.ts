import * as vscode from 'vscode';
import * as path from 'path';
import { findGitRepos, hasClaudeConfig, autoDetectRoots } from '../util/scan';
import { projectFiles } from '../paths';
import { exists } from '../util/fs';
import { FileItem, DirItem, dirChildren } from './items';

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

type Node = RepoItem | DirItem | FileItem | vscode.TreeItem;

export class ReposProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: Node) { return e; }

  getChildren(element?: Node): Node[] {
    if (!element) return this.rootRepos();
    if (element instanceof RepoItem) return this.repoFiles(element.repoPath);
    if (element instanceof DirItem) return dirChildren(element.dirPath);
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
}
