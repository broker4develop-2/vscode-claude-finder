import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GlobalProvider } from './providers/globalProvider';
import { McpProvider } from './providers/mcpProvider';
import { ProjectProvider } from './providers/projectProvider';
import { ReposProvider, RepoItem } from './providers/reposProvider';
import { exists } from './util/fs';

export function activate(ctx: vscode.ExtensionContext) {
  const global = new GlobalProvider();
  const mcp = new McpProvider();
  const project = new ProjectProvider();
  const repos = new ReposProvider();

  ctx.subscriptions.push(
    vscode.window.registerTreeDataProvider('claudeSettings.global', global),
    vscode.window.registerTreeDataProvider('claudeSettings.mcp', mcp),
    vscode.window.registerTreeDataProvider('claudeSettings.project', project),
    vscode.window.registerTreeDataProvider('claudeSettings.repos', repos)
  );

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeSettings')) repos.refresh();
    }),
    vscode.commands.registerCommand('claudeSettings.refresh', () => {
      global.refresh();
      mcp.refresh();
      project.refresh();
      repos.refresh();
    }),
    vscode.commands.registerCommand('claudeSettings.addScanRoot', async () => {
      const picked = await vscode.window.showOpenDialog({
        canSelectFiles: false, canSelectFolders: true, canSelectMany: false,
        openLabel: 'Add as scan root'
      });
      if (!picked?.[0]) return;
      const cfg = vscode.workspace.getConfiguration('claudeSettings');
      const roots = cfg.get<string[]>('scanRoots', []);
      const added = picked[0].fsPath;
      if (!roots.includes(added)) {
        await cfg.update('scanRoots', [...roots, added], vscode.ConfigurationTarget.Global);
      }
      repos.refresh();
    }),
    vscode.commands.registerCommand('claudeSettings.removeScanRoot', async () => {
      const cfg = vscode.workspace.getConfiguration('claudeSettings');
      const roots = cfg.get<string[]>('scanRoots', []);
      if (!roots.length) {
        vscode.window.showInformationMessage('No scan roots configured.');
        return;
      }
      const picked = await vscode.window.showQuickPick(roots, { placeHolder: 'Select root to remove' });
      if (!picked) return;
      await cfg.update('scanRoots', roots.filter((r) => r !== picked), vscode.ConfigurationTarget.Global);
      repos.refresh();
    }),
    vscode.commands.registerCommand('claudeSettings.openRepoFolder', async (item: RepoItem) => {
      if (!item?.repoPath) return;
      await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(item.repoPath), { forceNewWindow: true });
    }),
    vscode.commands.registerCommand('claudeSettings.revealItem', async (item: vscode.TreeItem) => {
      const uri = item?.resourceUri;
      if (uri) await vscode.commands.executeCommand('revealFileInOS', uri);
    }),
    vscode.commands.registerCommand('claudeSettings.copyPath', async (item: vscode.TreeItem) => {
      const uri = item?.resourceUri;
      if (uri) {
        await vscode.env.clipboard.writeText(uri.fsPath);
        vscode.window.setStatusBarMessage(`Copied: ${uri.fsPath}`, 2000);
      }
    }),
    vscode.commands.registerCommand('claudeSettings.copyRelativePath', async (item: vscode.TreeItem) => {
      const uri = item?.resourceUri;
      if (!uri) return;
      const ws = vscode.workspace.getWorkspaceFolder(uri);
      const rel = ws ? path.relative(ws.uri.fsPath, uri.fsPath) : uri.fsPath;
      await vscode.env.clipboard.writeText(rel);
      vscode.window.setStatusBarMessage(`Copied: ${rel}`, 2000);
    }),
    vscode.commands.registerCommand('claudeSettings.openInTerminal', async (item: vscode.TreeItem) => {
      const uri = item?.resourceUri;
      if (!uri) return;
      const term = vscode.window.createTerminal({ cwd: uri.fsPath, name: path.basename(uri.fsPath) });
      term.show();
    }),
    vscode.commands.registerCommand('claudeSettings.renameItem', async (item: vscode.TreeItem) => {
      const uri = item?.resourceUri;
      if (!uri) return;
      const oldName = path.basename(uri.fsPath);
      const input = await vscode.window.showInputBox({ prompt: 'New name', value: oldName });
      if (!input || input === oldName) return;
      const target = path.join(path.dirname(uri.fsPath), input);
      try {
        fs.renameSync(uri.fsPath, target);
        global.refresh(); mcp.refresh(); project.refresh(); repos.refresh();
      } catch (e: any) {
        vscode.window.showErrorMessage(`Rename failed: ${e.message}`);
      }
    }),
    vscode.commands.registerCommand('claudeSettings.deleteItem', async (item: vscode.TreeItem) => {
      const uri = item?.resourceUri;
      if (!uri) return;
      const name = path.basename(uri.fsPath);
      const confirm = await vscode.window.showWarningMessage(
        `Delete "${name}"? This moves it to the Trash.`,
        { modal: true }, 'Delete'
      );
      if (confirm !== 'Delete') return;
      try {
        await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
        global.refresh(); mcp.refresh(); project.refresh(); repos.refresh();
      } catch (e: any) {
        vscode.window.showErrorMessage(`Delete failed: ${e.message}`);
      }
    }),
    vscode.commands.registerCommand('claudeSettings.openFile', async (target: string) => {
      if (!target) return;
      if (!exists(target)) {
        const create = await vscode.window.showInformationMessage(
          `${path.basename(target)} does not exist. Create it?`,
          'Create', 'Cancel'
        );
        if (create !== 'Create') return;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        const isJson = target.endsWith('.json');
        fs.writeFileSync(target, isJson ? '{}\n' : '', 'utf8');
      }
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(target));
      } else {
        const doc = await vscode.workspace.openTextDocument(target);
        await vscode.window.showTextDocument(doc);
      }
    }),
    vscode.commands.registerCommand('claudeSettings.revealInFinder', (target: string) => {
      vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(target));
    })
  );

  vscode.workspace.onDidSaveTextDocument(() => {
    global.refresh();
    mcp.refresh();
    project.refresh();
    repos.refresh();
  });
}

export function deactivate() {}
