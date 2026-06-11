import * as vscode from 'vscode';
import { buildReport, costForDay, todayKey } from './util/usage';

function money(n: number): string {
  if (n >= 100) return '$' + n.toFixed(0);
  if (n >= 1) return '$' + n.toFixed(2);
  return '$' + n.toFixed(3);
}

/** Status-bar item that shows today's Claude Code spend and opens the dashboard on click. */
export class UsageStatusBar {
  private readonly item: vscode.StatusBarItem;
  private timer: NodeJS.Timeout | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
    this.item.command = 'claudeSettings.openDashboard';
    this.item.tooltip = 'Claude Code spend today — click for the usage dashboard';
  }

  start(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(this.item);
    void this.refresh();
    // Refresh every 2 minutes; jsonl files only change while Claude Code runs.
    this.timer = setInterval(() => void this.refresh(), 120_000);
    ctx.subscriptions.push({ dispose: () => this.timer && clearInterval(this.timer) });
  }

  async refresh() {
    const enabled = vscode.workspace
      .getConfiguration('claudeSettings')
      .get<boolean>('showStatusBar', true);
    if (!enabled) {
      this.item.hide();
      return;
    }
    try {
      const report = await buildReport();
      const today = costForDay(report, todayKey());
      this.item.text = `$(graph) ${money(today)}`;
      this.item.show();
    } catch {
      this.item.hide();
    }
  }
}
