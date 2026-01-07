import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { CLAUDE_PATHS } from '../utils/paths.js';

/**
 * Status information about the Claude Code installation.
 */
export interface ClaudeStatus {
  /** Whether Claude Code CLI is installed and accessible */
  isInstalled: boolean;
  /** Whether Claude Code has been configured (has config directory) */
  isConfigured: boolean;
  /** Claude Code version if available */
  version?: string;
  /** Path to the main Claude config directory */
  configPath: string;
}

/**
 * Check if Claude Code is installed and configured.
 * @returns Status object with installation details
 */
export function checkClaudeInstallation(): ClaudeStatus {
  let isInstalled = false;
  let version: string | undefined;

  // Try to get Claude version from PATH
  try {
    const output = execSync('claude --version', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    isInstalled = true;
    version = output.trim();
  } catch {
    // Claude not in PATH, try common locations
    try {
      const output = execSync('~/.local/bin/claude --version', {
        encoding: 'utf-8',
        shell: '/bin/sh',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      isInstalled = true;
      version = output.trim();
    } catch {
      // Also try npm global installation
      try {
        const output = execSync('npx @anthropic-ai/claude-code --version', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 5000,
        });
        isInstalled = true;
        version = output.trim();
      } catch {
        isInstalled = false;
      }
    }
  }

  // Check if Claude has been configured (has config directory)
  const hasConfigDir = existsSync(CLAUDE_PATHS.mainConfig);
  const hasCredentials = existsSync(CLAUDE_PATHS.mainCredentials);
  const isConfigured = hasConfigDir && hasCredentials;

  return {
    isInstalled,
    isConfigured,
    version,
    configPath: CLAUDE_PATHS.mainConfig,
  };
}

/**
 * Check if the main Claude configuration exists.
 * @returns True if Claude is configured
 */
export function isClaudeConfigured(): boolean {
  return existsSync(CLAUDE_PATHS.mainConfig);
}
