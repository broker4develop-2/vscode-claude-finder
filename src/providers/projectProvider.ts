import * as vscode from 'vscode';
import { projectFiles } from '../paths';
import { exists } from '../util/fs';
import { FileItem, DirItem, dirChildren } from './items';

type Node = FileItem | DirItem | vscode.TreeItem;

export class ProjectProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: Node) { return e; }

  getChildren(element?: Node): Node[] {
    if (!element) {
      const ws = vscode.workspace.workspaceFolders?.[0];
      if (!ws) {
        const empty = new vscode.TreeItem('No workspace folder open');
        empty.iconPath = new vscode.ThemeIcon('info');
        return [empty];
      }
      const p = projectFiles(ws.uri.fsPath);
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
    if (element instanceof DirItem) return dirChildren(element.dirPath);
    return [];
  }
}
