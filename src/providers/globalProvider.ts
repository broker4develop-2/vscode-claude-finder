import * as vscode from 'vscode';
import { GLOBAL_FILES } from '../paths';
import { exists } from '../util/fs';

export class FileItem extends vscode.TreeItem {
  constructor(label: string, public readonly fsPath: string, icon: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.resourceUri = vscode.Uri.file(fsPath);
    this.iconPath = new vscode.ThemeIcon(icon);
    this.description = exists(fsPath) ? '' : '(missing)';
    this.contextValue = exists(fsPath) ? 'file' : 'missingFile';
    this.command = {
      command: 'claudeSettings.openFile',
      title: 'Open',
      arguments: [fsPath]
    };
  }
}

export class GlobalProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: FileItem) { return e; }
  getChildren(): FileItem[] {
    return [
      new FileItem('CLAUDE.md (global instructions)', GLOBAL_FILES.claudeMd, 'book'),
      new FileItem('settings.json', GLOBAL_FILES.settings, 'gear'),
      new FileItem('settings.local.json', GLOBAL_FILES.settingsLocal, 'gear'),
      new FileItem('skills/', GLOBAL_FILES.skills, 'folder'),
      new FileItem('plugins/', GLOBAL_FILES.plugins, 'folder'),
      new FileItem('hooks/', GLOBAL_FILES.hooks, 'folder'),
      new FileItem('backups/', GLOBAL_FILES.backups, 'archive'),
      new FileItem('projects/', GLOBAL_FILES.projects, 'folder-library')
    ];
  }
}
