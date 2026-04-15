import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exists } from '../util/fs';

export class FileItem extends vscode.TreeItem {
  constructor(label: string, public readonly fsPath: string, icon?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.resourceUri = vscode.Uri.file(fsPath);
    if (icon) this.iconPath = new vscode.ThemeIcon(icon);
    this.description = exists(fsPath) ? '' : '(missing)';
    this.contextValue = exists(fsPath) ? 'file' : 'missingFile';
    this.tooltip = fsPath;
    this.command = {
      command: 'claudeSettings.openFile',
      title: 'Open',
      arguments: [fsPath]
    };
  }
}

export class DirItem extends vscode.TreeItem {
  constructor(label: string, public readonly dirPath: string, icon?: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.resourceUri = vscode.Uri.file(dirPath);
    this.iconPath = new vscode.ThemeIcon(icon ?? 'folder');
    this.description = exists(dirPath) ? '' : '(missing)';
    this.contextValue = 'dir';
    this.tooltip = dirPath;
  }
}

export function dirChildren(dirPath: string): (FileItem | DirItem)[] {
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
  const out: (FileItem | DirItem)[] = [];
  for (const e of entries) {
    const full = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      out.push(new DirItem(e.name, full));
    } else {
      const icon = e.name.endsWith('.json') ? 'json'
        : e.name.endsWith('.md') ? 'book'
        : 'file';
      out.push(new FileItem(e.name, full, icon));
    }
  }
  return out;
}
