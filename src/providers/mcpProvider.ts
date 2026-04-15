import * as vscode from 'vscode';
import { GLOBAL_FILES } from '../paths';
import { readJsonSafe, exists } from '../util/fs';

type Node = ServerNode | FileNode;

class FileNode extends vscode.TreeItem {
  constructor(label: string, fsPath: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('json');
    this.description = exists(fsPath) ? '' : '(missing)';
    this.command = { command: 'claudeSettings.openFile', title: 'Open', arguments: [fsPath] };
  }
}

class ServerNode extends vscode.TreeItem {
  constructor(name: string, cfg: any) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('plug');
    const cmd = cfg?.command ?? cfg?.url ?? '';
    this.description = typeof cmd === 'string' ? cmd : JSON.stringify(cmd);
    this.tooltip = JSON.stringify(cfg, null, 2);
  }
}

export class McpProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() { this._onDidChange.fire(); }

  getTreeItem(e: Node) { return e; }
  getChildren(): Node[] {
    const items: Node[] = [
      new FileNode('mcp_settings.json', GLOBAL_FILES.mcp),
      new FileNode('mcp-needs-auth-cache.json', GLOBAL_FILES.mcpAuth)
    ];
    const data = readJsonSafe<any>(GLOBAL_FILES.mcp);
    const servers = data?.mcpServers ?? data?.servers ?? {};
    for (const [name, cfg] of Object.entries(servers)) {
      items.push(new ServerNode(name, cfg));
    }
    return items;
  }
}
