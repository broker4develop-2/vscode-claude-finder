import * as vscode from 'vscode';

/**
 * Per-million-token prices (USD). Claude Code logs cache tokens separately, so we
 * price them separately too. These are sensible defaults for the Claude 4.x family;
 * users can override any of them via the `claudeSettings.pricing` setting, which keeps
 * us off the maintenance treadmill when Anthropic changes rates.
 */
export interface Rate {
  /** $ / 1M input (uncached) tokens */
  input: number;
  /** $ / 1M output tokens */
  output: number;
  /** $ / 1M cache-write (ephemeral) tokens. Claude Code does not split 5m/1h in the log total, so we use one write rate. */
  cacheWrite: number;
  /** $ / 1M cache-read tokens */
  cacheRead: number;
}

/** Default rate table keyed by a model-id substring (longest match wins). */
const DEFAULT_RATES: Record<string, Rate> = {
  'opus': { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  'sonnet': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  'haiku': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 }
};

/** Tokens as logged in a single `message.usage` block. */
export interface UsageTokens {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

function ratesFromConfig(): Record<string, Rate> {
  const override = vscode.workspace
    .getConfiguration('claudeSettings')
    .get<Record<string, Partial<Rate>>>('pricing', {});
  const merged: Record<string, Rate> = { ...DEFAULT_RATES };
  for (const [key, val] of Object.entries(override ?? {})) {
    const base = merged[key] ?? { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
    merged[key] = { ...base, ...val };
  }
  return merged;
}

/** Resolve the rate for a model id, matching the longest configured key it contains. */
export function rateFor(model: string, rates = ratesFromConfig()): Rate | null {
  const id = (model || '').toLowerCase();
  let best: { key: string; rate: Rate } | null = null;
  for (const [key, rate] of Object.entries(rates)) {
    if (id.includes(key) && (!best || key.length > best.key.length)) {
      best = { key, rate };
    }
  }
  return best?.rate ?? null;
}

/** Cost in USD for one usage block of a given model. Unknown/synthetic models cost 0. */
export function costOf(model: string, t: UsageTokens, rates = ratesFromConfig()): number {
  const r = rateFor(model, rates);
  if (!r) return 0;
  return (
    (t.input * r.input +
      t.output * r.output +
      t.cacheWrite * r.cacheWrite +
      t.cacheRead * r.cacheRead) /
    1_000_000
  );
}
