import * as fs from 'fs';
import * as path from 'path';
import { GLOBAL_FILES } from '../paths';
import { costOf, UsageTokens } from './pricing';

export interface Totals extends UsageTokens {
  cost: number;
}

export interface Bucket extends Totals {
  key: string;
}

export interface UsageReport {
  total: Totals;
  byDay: Bucket[];      // ascending by date (YYYY-MM-DD)
  byProject: Bucket[];  // descending by cost
  byModel: Bucket[];    // descending by cost
  sessions: number;
  messages: number;
  generatedAt: number;
}

interface FileCache {
  mtimeMs: number;
  size: number;
  records: Record_[];
}

interface Record_ {
  ts: number;        // epoch ms
  day: string;       // local YYYY-MM-DD
  model: string;
  project: string;   // friendly label
  session: string;
  id: string;        // message id (or requestId) for dedup
  cost: number;
  tok: UsageTokens;
}

const fileCache = new Map<string, FileCache>();
const seenMessageIds = new Set<string>();

function emptyTotals(): Totals {
  return { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, cost: 0 };
}

function add(into: Totals, r: { tok: UsageTokens; cost: number }) {
  into.input += r.tok.input;
  into.output += r.tok.output;
  into.cacheWrite += r.tok.cacheWrite;
  into.cacheRead += r.tok.cacheRead;
  into.cost += r.cost;
}

function localDay(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Turn an encoded project-dir name into a readable label when cwd is missing. */
function labelFromDir(dirName: string): string {
  const parts = dirName.replace(/^-/, '').split('-').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : dirName;
}

function parseFile(filePath: string, dirLabel: string): Record_[] {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  const out: Record_[] = [];
  for (const line of raw.split('\n')) {
    if (!line.includes('"usage"')) continue;
    let obj: any;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const msg = obj?.message;
    const usage = msg?.usage;
    if (!usage) continue;
    const model: string = msg?.model ?? 'unknown';
    if (model === '<synthetic>') continue;

    const tok: UsageTokens = {
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      cacheWrite: usage.cache_creation_input_tokens ?? 0,
      cacheRead: usage.cache_read_input_tokens ?? 0
    };
    const ts = obj?.timestamp ? Date.parse(obj.timestamp) : NaN;
    if (!Number.isFinite(ts)) continue;

    const cwd: string | undefined = obj?.cwd;
    const project = cwd ? path.basename(cwd) : labelFromDir(dirLabel);

    out.push({
      ts,
      day: localDay(ts),
      model,
      project,
      session: obj?.sessionId ?? '',
      id: msg?.id ?? obj?.requestId ?? '',
      cost: costOf(model, tok),
      tok
    });
  }
  return out;
}

function loadRecords(): Record_[] {
  const projectsRoot = GLOBAL_FILES.projects;
  let projectDirs: fs.Dirent[];
  try {
    projectDirs = fs.readdirSync(projectsRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const all: Record_[] = [];
  for (const pd of projectDirs) {
    if (!pd.isDirectory()) continue;
    const dir = path.join(projectsRoot, pd.name);
    let files: string[];
    try {
      files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
    } catch {
      continue;
    }
    for (const f of files) {
      const full = path.join(dir, f);
      let st: fs.Stats;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      const cached = fileCache.get(full);
      if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) {
        all.push(...cached.records);
        continue;
      }
      const records = parseFile(full, pd.name);
      fileCache.set(full, { mtimeMs: st.mtimeMs, size: st.size, records });
      all.push(...records);
    }
  }
  return all;
}

/**
 * Build a usage report. Cheap on repeat calls: only changed jsonl files are re-read
 * (cached by mtime+size). Runs on a worker tick via setImmediate-free sync reads kept
 * small; callers should invoke from an async command.
 */
export async function buildReport(): Promise<UsageReport> {
  // Yield to the event loop so the first call doesn't block activation.
  await Promise.resolve();

  const records = loadRecords();
  seenMessageIds.clear();

  const total = emptyTotals();
  const byDay = new Map<string, Bucket>();
  const byProject = new Map<string, Bucket>();
  const byModel = new Map<string, Bucket>();
  const sessions = new Set<string>();
  let messages = 0;

  const bump = (map: Map<string, Bucket>, key: string, r: Record_) => {
    let b = map.get(key);
    if (!b) {
      b = { key, ...emptyTotals() };
      map.set(key, b);
    }
    add(b, r);
  };

  for (const r of records) {
    if (r.id) {
      if (seenMessageIds.has(r.id)) continue; // dedup retried/duplicated log lines
      seenMessageIds.add(r.id);
    }
    messages++;
    if (r.session) sessions.add(r.session);
    add(total, r);
    bump(byDay, r.day, r);
    bump(byProject, r.project, r);
    bump(byModel, r.model, r);
  }

  return {
    total,
    byDay: [...byDay.values()].sort((a, b) => a.key.localeCompare(b.key)),
    byProject: [...byProject.values()].sort((a, b) => b.cost - a.cost),
    byModel: [...byModel.values()].sort((a, b) => b.cost - a.cost),
    sessions: sessions.size,
    messages,
    generatedAt: Date.now()
  };
}

/** Sum cost for a single local day (used by the status bar). */
export function costForDay(report: UsageReport, day: string): number {
  return report.byDay.find((b) => b.key === day)?.cost ?? 0;
}

export function todayKey(): string {
  return localDay(Date.now());
}
