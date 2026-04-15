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
