import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GlobalProvider } from './providers/globalProvider';
import { McpProvider } from './providers/mcpProvider';
import { ProjectProvider } from './providers/projectProvider';
import { exists } from './util/fs';

export function activate(ctx: vscode.ExtensionContext) {
  const global = new GlobalProvider();
  const mcp = new McpProvider();
  const project = new ProjectProvider();

  ctx.subscriptions.push(
    vscode.window.registerTreeDataProvider('claudeSettings.global', global),
    vscode.window.registerTreeDataProvider('claudeSettings.mcp', mcp),
    vscode.window.registerTreeDataProvider('claudeSettings.project', project)
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand('claudeSettings.refresh', () => {
      global.refresh();
      mcp.refresh();
      project.refresh();
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
  });
}

export function deactivate() {}
