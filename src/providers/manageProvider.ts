import * as vscode from 'vscode';
import * as fs from 'fs';
import { GLOBAL_FILES } from '../paths';
import { readJsonSafe, exists } from '../util/fs';

type Node = SectionItem | PluginItem | McpServerItem | HookEventItem | HookCmdItem | InfoItem;

const SECTION = { plugins: 'plugins', hooks: 'hooks', mcp: 'mcp' } as const;

class SectionItem extends vscode.TreeItem {
  constructor(label: string, public readonly section: string, icon: string, count: number) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon(icon);
    this.description = count ? String(count) : '';
    this.contextValue = 'section';
  }
}

class InfoItem extends vscode.TreeItem {
  constructor(label: string, openTarget?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('info');
    if (openTarget) {
      this.command = { command: 'claudeSettings.openFile', title: 'Open', arguments: [openTarget] };
    }
  }
}

export class PluginItem extends vscode.TreeItem {
  constructor(public readonly pluginKey: string, public readonly enabled: boolean) {
    super(pluginKey, vscode.TreeItemCollapsibleState.None);
    this.description = enabled ? 'enabled' : 'disabled';
    this.iconPath = new vscode.ThemeIcon(
      enabled ? 'pass-filled' : 'circle-slash',
      enabled ? new vscode.ThemeColor('charts.green') : new vscode.ThemeColor('disabledForeground')
    );
    this.contextValue = enabled ? 'pluginOn' : 'pluginOff';
    this.tooltip = `${pluginKey} — click to ${enabled ? 'disable' : 'enable'}`;
    this.command = {
      command: 'claudeSettings.togglePlugin',
      title: 'Toggle',
      arguments: [this]
    };
  }
}

export class McpServerItem extends vscode.TreeItem {
  constructor(public readonly serverName: string, public readonly enabled: boolean, detail: string) {
    super(serverName, vscode.TreeItemCollapsibleState.None);
    this.description = enabled ? detail : 'disabled';
    this.iconPath = new vscode.ThemeIcon(
      enabled ? 'plug' : 'circle-slash',
      enabled ? undefined : new vscode.ThemeColor('disabledForeground')
    );
    this.contextValue = enabled ? 'mcpOn' : 'mcpOff';
    this.tooltip = `${serverName} — click to ${enabled ? 'disable' : 'enable'}`;
    this.command = {
      command: 'claudeSettings.toggleMcp',
      title: 'Toggle',
      arguments: [this]
    };
  }
}

class HookEventItem extends vscode.TreeItem {
  constructor(public readonly event: string, public readonly commands: string[]) {
    super(event, vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon('symbol-event');
    this.description = `${commands.length} hook${commands.length === 1 ? '' : 's'}`;
  }
}

class HookCmdItem extends vscode.TreeItem {
  constructor(cmd: string) {
    super(cmd.split('/').pop() || cmd, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('terminal');
    this.tooltip = cmd;
    this.description = cmd;
    this.command = {
      command: 'claudeSettings.openFile',
      title: 'Open settings.json',
      arguments: [GLOBAL_FILES.settings]
    };
  }
}

function writeJsonPretty(file: string, data: any): boolean {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  } catch (e: any) {
    vscode.window.showErrorMessage(`Write failed: ${e.message}`);
    return false;
  }
}

export class ManageProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChange.event;
  refresh() {
    this._onDidChange.fire();
  }

  getTreeItem(e: Node) {
    return e;
  }

  getChildren(element?: Node): Node[] {
    if (!element) {
      const plugins = this.readPlugins();
      const hooks = this.readHookEvents();
      const mcp = this.readMcp();
      return [
        new SectionItem('Plugins', SECTION.plugins, 'plug', plugins.length),
        new SectionItem('Hooks', SECTION.hooks, 'symbol-event', hooks.length),
        new SectionItem('MCP Servers', SECTION.mcp, 'server', mcp.length)
      ];
    }
    if (element instanceof SectionItem) {
      if (element.section === SECTION.plugins) {
        const items = this.readPlugins();
        return items.length ? items : [new InfoItem('No plugins in settings.json', GLOBAL_FILES.settings)];
      }
      if (element.section === SECTION.hooks) {
        const items = this.readHookEvents();
        return items.length ? items : [new InfoItem('No hooks configured', GLOBAL_FILES.settings)];
      }
      if (element.section === SECTION.mcp) {
        const items = this.readMcp();
        return items.length ? items : [new InfoItem('No MCP servers', GLOBAL_FILES.mcp)];
      }
    }
    if (element instanceof HookEventItem) {
      return element.commands.map((c) => new HookCmdItem(c));
    }
    return [];
  }

  // ---- readers ----

  private readPlugins(): PluginItem[] {
    const settings = readJsonSafe<any>(GLOBAL_FILES.settings);
    const map = settings?.enabledPlugins;
    if (!map || typeof map !== 'object') return [];
    return Object.entries(map)
      .map(([key, val]) => new PluginItem(key, val !== false))
      .sort((a, b) => a.pluginKey.localeCompare(b.pluginKey));
  }

  private readHookEvents(): HookEventItem[] {
    const settings = readJsonSafe<any>(GLOBAL_FILES.settings);
    const hooks = settings?.hooks;
    if (!hooks || typeof hooks !== 'object') return [];
    const out: HookEventItem[] = [];
    for (const [event, defs] of Object.entries<any>(hooks)) {
      const cmds: string[] = [];
      for (const def of Array.isArray(defs) ? defs : []) {
        for (const h of def?.hooks ?? []) {
          if (h?.command) cmds.push(String(h.command));
        }
      }
      out.push(new HookEventItem(event, cmds));
    }
    return out.sort((a, b) => a.event.localeCompare(b.event));
  }

  private readMcp(): McpServerItem[] {
    const data = readJsonSafe<any>(GLOBAL_FILES.mcp);
    if (!data) return [];
    const active = data.mcpServers ?? data.servers ?? {};
    const disabled = data._disabledMcpServers ?? {};
    const items: McpServerItem[] = [];
    for (const [name, cfg] of Object.entries<any>(active)) {
      const detail = typeof (cfg?.command ?? cfg?.url) === 'string' ? cfg.command ?? cfg.url : '';
      items.push(new McpServerItem(name, true, detail));
    }
    for (const name of Object.keys(disabled)) {
      items.push(new McpServerItem(name, false, ''));
    }
    return items.sort((a, b) => a.serverName.localeCompare(b.serverName));
  }

  // ---- mutations ----

  togglePlugin(item: PluginItem) {
    if (!exists(GLOBAL_FILES.settings)) return;
    const settings = readJsonSafe<any>(GLOBAL_FILES.settings);
    if (!settings?.enabledPlugins) return;
    settings.enabledPlugins[item.pluginKey] = !item.enabled;
    if (writeJsonPretty(GLOBAL_FILES.settings, settings)) {
      vscode.window.setStatusBarMessage(
        `Plugin ${item.pluginKey} ${!item.enabled ? 'enabled' : 'disabled'}`,
        2500
      );
      this.refresh();
    }
  }

  toggleMcp(item: McpServerItem) {
    const data = readJsonSafe<any>(GLOBAL_FILES.mcp);
    if (!data) return;
    const activeKey = data.mcpServers ? 'mcpServers' : data.servers ? 'servers' : 'mcpServers';
    data[activeKey] = data[activeKey] ?? {};
    data._disabledMcpServers = data._disabledMcpServers ?? {};

    if (item.enabled) {
      // move active -> disabled
      const cfg = data[activeKey][item.serverName];
      if (cfg === undefined) return;
      data._disabledMcpServers[item.serverName] = cfg;
      delete data[activeKey][item.serverName];
    } else {
      // move disabled -> active
      const cfg = data._disabledMcpServers[item.serverName];
      if (cfg === undefined) return;
      data[activeKey][item.serverName] = cfg;
      delete data._disabledMcpServers[item.serverName];
    }
    if (Object.keys(data._disabledMcpServers).length === 0) delete data._disabledMcpServers;

    if (writeJsonPretty(GLOBAL_FILES.mcp, data)) {
      vscode.window.setStatusBarMessage(
        `MCP ${item.serverName} ${item.enabled ? 'disabled' : 'enabled'} (restart Claude Code to apply)`,
        3000
      );
      this.refresh();
    }
  }
}
