import * as vscode from 'vscode';
import { buildReport, UsageReport, Bucket, Totals } from '../util/usage';

function money(n: number): string {
  if (n >= 100) return '$' + n.toFixed(0);
  if (n >= 1) return '$' + n.toFixed(2);
  return '$' + n.toFixed(3);
}

function compact(n: number): string {
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(2) + 'T';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'G';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function totalTokens(t: Totals): number {
  return t.input + t.output + t.cacheWrite + t.cacheRead;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

/** Sum cost over the most recent `days` calendar days, ending today (inclusive). */
function rollingCost(report: UsageReport, days: number): { cost: number; tokens: number } {
  const cut = new Date();
  cut.setHours(0, 0, 0, 0);
  cut.setDate(cut.getDate() - (days - 1));
  const cutKey = `${cut.getFullYear()}-${String(cut.getMonth() + 1).padStart(2, '0')}-${String(
    cut.getDate()
  ).padStart(2, '0')}`;
  let cost = 0;
  let tokens = 0;
  for (const b of report.byDay) {
    if (b.key >= cutKey) {
      cost += b.cost;
      tokens += totalTokens(b);
    }
  }
  return { cost, tokens };
}

function card(label: string, value: string, sub: string): string {
  return `<div class="card">
    <div class="card-label">${esc(label)}</div>
    <div class="card-value">${esc(value)}</div>
    <div class="card-sub">${esc(sub)}</div>
  </div>`;
}

/** Last `n` days as a bar chart, filling gaps with zero. */
function barChart(report: UsageReport, n = 30): string {
  const byKey = new Map(report.byDay.map((b) => [b.key, b]));
  const days: { key: string; cost: number }[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    const key = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(
      dd.getDate()
    ).padStart(2, '0')}`;
    days.push({ key, cost: byKey.get(key)?.cost ?? 0 });
  }
  const max = Math.max(0.0001, ...days.map((x) => x.cost));
  const bars = days
    .map((x) => {
      const h = Math.round((x.cost / max) * 100);
      const md = x.key.slice(5);
      return `<div class="bar-col" data-day="${x.key}" data-cost="${money(x.cost)}" title="${x.key}: ${money(x.cost)}">
        <div class="bar" style="height:${h}%"></div>
        <div class="bar-x">${md.endsWith('-01') || md === days[0].key.slice(5) ? esc(md) : ''}</div>
      </div>`;
    })
    .join('');
  return `<div class="chart">${bars}</div>`;
}

function table(title: string, rows: Bucket[], limit = 12): string {
  const body = rows
    .map(
      (b, i) => `<tr${i >= limit ? ' class="extra"' : ''}>
      <td class="t-key">${esc(b.key)}</td>
      <td class="t-num">${money(b.cost)}</td>
      <td class="t-num t-dim">${compact(totalTokens(b))}</td>
    </tr>`
    )
    .join('');
  const hidden = rows.length - limit;
  const more =
    hidden > 0
      ? `<button class="more" type="button" data-count="${hidden}">+${hidden} more…</button>`
      : '';
  return `<div class="panel">
    <h2>${esc(title)}</h2>
    <table>
      <thead><tr><th>${esc(title.split(' ')[2] ?? '')}</th><th class="t-num">Cost</th><th class="t-num">Tokens</th></tr></thead>
      <tbody>${body || '<tr><td colspan="3" class="t-dim">No data</td></tr>'}</tbody>
    </table>
    ${more}
  </div>`;
}

function makeNonce(): string {
  let s = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function render(report: UsageReport): string {
  const nonce = makeNonce();
  const updatedAt = new Date(report.generatedAt).toLocaleTimeString();
  const today = rollingCost(report, 1);
  const week = rollingCost(report, 7);
  const month = rollingCost(report, 30);
  const all = report.total;

  const tokenSplit = `${compact(all.input)} in · ${compact(all.output)} out · ${compact(
    all.cacheRead
  )} cache-read`;

  return /* html */ `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family); color: var(--vscode-foreground);
    padding: 16px 20px; margin: 0;
  }
  .head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .head h1 { font-size: 16px; margin: 0; font-weight: 600; }
  .head .gen { font-size: 11px; opacity: .6; }
  button {
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
  }
  button:hover { background: var(--vscode-button-hoverBackground); }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 10px; margin-bottom: 18px; }
  .card {
    background: var(--vscode-editorWidget-background, rgba(127,127,127,.08));
    border: 1px solid var(--vscode-widget-border, rgba(127,127,127,.2));
    border-radius: 8px; padding: 12px 14px;
  }
  .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; opacity: .65; }
  .card-value { font-size: 24px; font-weight: 650; margin: 4px 0 2px; }
  .card-sub { font-size: 11px; opacity: .6; }
  .chart-wrap { margin-bottom: 20px; }
  .chart-head { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px; }
  .chart-wrap h2, .panel h2 { font-size: 13px; font-weight: 600; margin: 0; opacity:.85; }
  .panel h2 { margin: 0 0 8px; }
  .readout { font-size: 12px; font-variant-numeric: tabular-nums; opacity:.8; }
  .chart { display:flex; align-items:flex-end; gap:2px; height: 120px;
    border-bottom: 1px solid var(--vscode-widget-border, rgba(127,127,127,.25)); padding-bottom: 16px; position:relative; }
  .bar-col { flex:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; height:100%; position:relative; }
  .bar { width: 70%; min-height: 1px; background: var(--vscode-charts-blue, #4eaaff); border-radius: 2px 2px 0 0; }
  .bar-col:hover .bar { background: var(--vscode-charts-purple, #b180ff); }
  .bar-x { position:absolute; bottom:-15px; font-size:9px; opacity:.5; white-space:nowrap; }
  .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  @media (max-width: 620px){ .grid2 { grid-template-columns: 1fr; } }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align:left; padding: 5px 6px; border-bottom: 1px solid var(--vscode-widget-border, rgba(127,127,127,.15)); }
  th { font-weight:600; opacity:.6; font-size: 11px; }
  .t-num { text-align:right; font-variant-numeric: tabular-nums; }
  .t-dim { opacity:.55; }
  .t-key { word-break: break-all; }
  tr.extra { display: none; }
  .panel.expanded tr.extra { display: table-row; }
  .more {
    font-size: 11px; margin-top: 6px; padding: 3px 8px; cursor: pointer;
    background: transparent; color: var(--vscode-textLink-foreground);
    border: 1px solid var(--vscode-widget-border, rgba(127,127,127,.3)); border-radius: 4px;
  }
  .more:hover { background: var(--vscode-list-hoverBackground, rgba(127,127,127,.1)); }
  .foot { margin-top: 20px; font-size: 11px; opacity:.5; }
</style></head>
<body>
  <div class="head">
    <h1>📊 Claude Code Usage</h1>
    <div style="display:flex; align-items:center; gap:10px;">
      <span class="gen">${report.messages.toLocaleString()} msgs · ${report.sessions.toLocaleString()} sessions · updated ${updatedAt}</span>
      <button id="refreshBtn">↻ Refresh</button>
    </div>
  </div>

  <div class="cards">
    ${card('Today', money(today.cost), compact(today.tokens) + ' tokens')}
    ${card('Last 7 days', money(week.cost), compact(week.tokens) + ' tokens')}
    ${card('Last 30 days', money(month.cost), compact(month.tokens) + ' tokens')}
    ${card('All time', money(all.cost), compact(totalTokens(all)) + ' tokens')}
  </div>

  <div class="chart-wrap">
    <div class="chart-head">
      <h2>Daily cost — last 30 days</h2>
      <span id="readout" class="readout">Hover a bar to inspect a day</span>
    </div>
    ${barChart(report, 30)}
  </div>

  <div class="grid2">
    ${table('Cost by project', report.byProject)}
    ${table('Cost by model', report.byModel)}
  </div>

  <div class="foot">
    All-time tokens: ${tokenSplit}. Prices are estimates — adjust via the
    <code>claudeSettings.pricing</code> setting. Data parsed from <code>~/.claude/projects</code>.
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.addEventListener('click', () => {
      btn.textContent = '⟳ Refreshing…';
      btn.disabled = true;
      vscode.postMessage({ type: 'refresh' });
    });
    const readout = document.getElementById('readout');
    const defaultReadout = 'Hover a bar to inspect a day';
    document.querySelectorAll('.bar-col').forEach((col) => {
      col.addEventListener('mouseenter', () => {
        if (readout) readout.textContent = col.dataset.day + ' · ' + col.dataset.cost;
      });
    });
    const chart = document.querySelector('.chart');
    if (chart) chart.addEventListener('mouseleave', () => {
      if (readout) readout.textContent = defaultReadout;
    });
    document.querySelectorAll('.more').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.closest('.panel');
        if (!panel) return;
        const expanded = panel.classList.toggle('expanded');
        btn.textContent = expanded ? 'Show less' : ('+' + btn.dataset.count + ' more…');
      });
    });
  </script>
</body></html>`;
}

export class DashboardPanel {
  private static current: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposed = false;

  static async show(ctx: vscode.ExtensionContext) {
    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal();
      await DashboardPanel.current.update();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'claudeUsageDashboard',
      'Claude Usage',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    DashboardPanel.current = new DashboardPanel(panel);
    ctx.subscriptions.push(panel);
    await DashboardPanel.current.update();
  }

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.iconPath = new vscode.ThemeIcon('graph');
    this.panel.onDidDispose(() => {
      this.disposed = true;
      DashboardPanel.current = undefined;
    });
    this.panel.webview.onDidReceiveMessage((m) => {
      if (m?.type === 'refresh') void this.update();
    });
  }

  private async update() {
    this.panel.webview.html = `<!DOCTYPE html><body style="font-family:var(--vscode-font-family);padding:24px;color:var(--vscode-foreground)">Loading usage…</body>`;
    const report = await buildReport();
    if (this.disposed) return;
    this.panel.webview.html = render(report);
  }
}
