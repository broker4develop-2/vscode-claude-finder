import * as vscode from 'vscode';
import { projectFiles } from '../paths';
import { exists } from '../util/fs';
import { FileItem } from './globalProvider';

export class ProjectProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: vscode.TreeItem) { return e; }
  getChildren(): vscode.TreeItem[] {
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) {
      const empty = new vscode.TreeItem('No workspace folder open');
      empty.iconPath = new vscode.ThemeIcon('info');
      return [empty];
    }
    const p = projectFiles(ws.uri.fsPath);
    return [
      new FileItem('CLAUDE.md', p.claudeMd, 'book'),
      new FileItem('AGENTS.md', p.agentsMd, 'book'),
      new FileItem('.claude/settings.json', p.settings, 'gear'),
      new FileItem('.claude/settings.local.json', p.settingsLocal, 'gear'),
      new FileItem('.claude/mcp.json', p.mcp, 'plug'),
      new FileItem('.claude/', p.dotClaudeDir, 'folder')
    ];
  }
}

