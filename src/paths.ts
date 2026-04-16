import * as os from 'os';
import * as path from 'path';

export const HOME = os.homedir();
export const CLAUDE_DIR = path.join(HOME, '.claude');

export const GLOBAL_FILES = {
  claudeMd: path.join(CLAUDE_DIR, 'CLAUDE.md'),
  settings: path.join(CLAUDE_DIR, 'settings.json'),
  settingsLocal: path.join(CLAUDE_DIR, 'settings.local.json'),
  mcp: path.join(CLAUDE_DIR, 'mcp_settings.json'),
  mcpAuth: path.join(CLAUDE_DIR, 'mcp-needs-auth-cache.json'),
  backups: path.join(CLAUDE_DIR, 'backups'),
  skills: path.join(CLAUDE_DIR, 'skills'),
  plugins: path.join(CLAUDE_DIR, 'plugins'),
  hooks: path.join(CLAUDE_DIR, 'hooks'),
  projects: path.join(CLAUDE_DIR, 'projects'),
  rules: path.join(CLAUDE_DIR, 'rules'),
  plans: path.join(CLAUDE_DIR, 'plans'),
  todos: path.join(CLAUDE_DIR, 'todos'),
  config: path.join(CLAUDE_DIR, 'config'),
  local: path.join(CLAUDE_DIR, 'local')
};

export function projectFiles(workspaceRoot: string) {
  const dotClaude = path.join(workspaceRoot, '.claude');
  return {
    claudeMd: path.join(workspaceRoot, 'CLAUDE.md'),
    agentsMd: path.join(workspaceRoot, 'AGENTS.md'),
    dotClaudeDir: dotClaude,
    settings: path.join(dotClaude, 'settings.json'),
    settingsLocal: path.join(dotClaude, 'settings.local.json'),
    mcp: path.join(dotClaude, 'mcp.json')
  };
}
