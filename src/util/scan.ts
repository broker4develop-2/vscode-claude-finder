import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function expandHome(p: string): string {
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

const SKIP = new Set([
  'node_modules', 'dist', 'build', '.next', '.turbo', '.cache',
  'target', 'venv', '.venv', '__pycache__', '.idea', '.vscode-test',
  'coverage', 'out', 'tmp', '.DS_Store'
]);

export function findGitRepos(root: string, maxDepth: number): string[] {
  const results: string[] = [];
  const expanded = expandHome(root);
  if (!fs.existsSync(expanded)) return results;

  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    // A dir containing .git is a repo — stop descending.
    if (entries.some((e) => e.name === '.git')) {
      results.push(dir);
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
      walk(path.join(dir, e.name), depth + 1);
    }
  }

  walk(expanded, 0);
  return results.sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

export function hasClaudeConfig(repoPath: string): boolean {
  return (
    fs.existsSync(path.join(repoPath, 'CLAUDE.md')) ||
    fs.existsSync(path.join(repoPath, 'AGENTS.md')) ||
    fs.existsSync(path.join(repoPath, '.claude'))
  );
}
