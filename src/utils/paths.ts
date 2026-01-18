import { homedir } from 'node:os';
import { join } from 'node:path';
import type { SharedItem } from '../types/index.js';

/** User's home directory */
export const HOME = homedir();

/**
 * Claude Code path constants and shared items configuration.
 */
export const CLAUDE_PATHS = {
  /** Main Claude Code configuration directory */
  mainConfig: join(HOME, '.claude'),

  /** Main Claude Code credentials file */
  mainCredentials: join(HOME, '.claude.json'),

  /** Files and directories to symlink (shared across profiles) */
  sharedItems: [
    { name: 'settings.json', type: 'file' as const, required: true },
    { name: 'stats-cache.json', type: 'file' as const, required: false },
    { name: 'CLAUDE.md', type: 'file' as const, required: false },
    { name: 'agents', type: 'directory' as const, required: false },
    { name: 'commands', type: 'directory' as const, required: false },
    { name: 'plugins', type: 'directory' as const, required: false },
    { name: 'skills', type: 'directory' as const, required: false },
  ] satisfies SharedItem[],

  /** cc-profiles configuration file */
  profilesConfig: join(HOME, '.cc-profiles.json'),
} as const;

/**
 * Get the path to a profile's configuration directory.
 * @param name - Profile name
 * @returns Full path to ~/.claude-{name}/
 */
export function getProfilePath(name: string): string {
  return join(HOME, `.claude-${name}`);
}

/**
 * Get the path to a profile's credentials file.
 * @param name - Profile name
 * @returns Full path to ~/.claude-{name}.json
 */
export function getProfileCredentialsPath(name: string): string {
  return join(HOME, `.claude-${name}.json`);
}
