import * as vscode from 'vscode';
import { GLOBAL_FILES } from '../paths';
import { FileItem, DirItem, dirChildren } from './items';

export { FileItem } from './items';

type Node = FileItem | DirItem;

export class GlobalProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: Node) { return e; }

  getChildren(element?: Node): Node[] {
    if (!element) {
      return [
        new FileItem('CLAUDE.md (global instructions)', GLOBAL_FILES.claudeMd, 'book'),
        new FileItem('settings.json', GLOBAL_FILES.settings, 'gear'),
        new FileItem('settings.local.json', GLOBAL_FILES.settingsLocal, 'gear'),
        new DirItem('skills/', GLOBAL_FILES.skills),
        new DirItem('plugins/', GLOBAL_FILES.plugins),
        new DirItem('hooks/', GLOBAL_FILES.hooks),
        new DirItem('backups/', GLOBAL_FILES.backups, 'archive'),
        new DirItem('projects/', GLOBAL_FILES.projects, 'folder-library')
      ];
    }
    if (element instanceof DirItem) return dirChildren(element.dirPath);
    return [];
  }
}
