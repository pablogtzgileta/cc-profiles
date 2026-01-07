import * as fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOME } from '../utils/paths.js';
import type { ShellConfig } from '../types/index.js';

/** Path to the managed aliases file (for bash/zsh) */
export const ALIASES_FILE = join(HOME, '.cc-profiles-aliases.sh');

/** Marker to identify our integration line in shell config */
const INTEGRATION_MARKER = '# cc-profiles shell integration';

/**
 * Detect the user's shell type and configuration.
 * @returns Shell configuration object
 */
export function detectShell(): ShellConfig {
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    return {
      type: 'zsh',
      rcFile: join(HOME, '.zshrc'),
      aliasFormat: 'function',
    };
  }

  if (shell.includes('bash')) {
    // Check for .bash_profile on macOS, .bashrc on Linux
    const bashProfile = join(HOME, '.bash_profile');
    const bashrc = join(HOME, '.bashrc');
    return {
      type: 'bash',
      rcFile: existsSync(bashProfile) ? bashProfile : bashrc,
      aliasFormat: 'function',
    };
  }

  if (shell.includes('fish')) {
    return {
      type: 'fish',
      rcFile: join(HOME, '.config/fish/config.fish'),
      aliasFormat: 'function',
    };
  }

  // Default to bash if unknown
  return {
    type: 'unknown',
    rcFile: join(HOME, '.bashrc'),
    aliasFormat: 'function',
  };
}

/**
 * Get the appropriate aliases file path for the current shell.
 * @returns Path to the aliases file
 */
export function getAliasesFilePath(): string {
  const shell = detectShell();

  if (shell.type === 'fish') {
    return join(HOME, '.config/fish/functions/cc-profiles.fish');
  }

  return join(HOME, '.cc-profiles-aliases.sh');
}

/**
 * Check if shell integration is already set up.
 * @returns True if integration line exists in shell config
 */
export function isShellIntegrated(): boolean {
  const shell = detectShell();

  // Fish auto-loads from functions directory, no integration needed
  if (shell.type === 'fish') {
    return true;
  }

  if (!existsSync(shell.rcFile)) return false;

  const content = readFileSync(shell.rcFile, 'utf-8');
  return content.includes(INTEGRATION_MARKER);
}

/**
 * Add the source line to user's shell config (one-time setup).
 * @returns Object with success status and rc file path
 */
export async function setupShellIntegration(): Promise<{ success: boolean; rcFile: string }> {
  const shell = detectShell();

  // Fish doesn't need integration - it auto-loads from functions directory
  if (shell.type === 'fish') {
    return { success: true, rcFile: shell.rcFile };
  }

  if (isShellIntegrated()) {
    return { success: true, rcFile: shell.rcFile };
  }

  // Read existing content
  let content = '';
  if (existsSync(shell.rcFile)) {
    content = await fs.readFile(shell.rcFile, 'utf-8');
  }

  // Build integration line
  const integrationLine = `${INTEGRATION_MARKER}\n[ -f ~/.cc-profiles-aliases.sh ] && source ~/.cc-profiles-aliases.sh`;

  // Append our integration line
  const newContent = content.trimEnd() + '\n\n' + integrationLine + '\n';
  await fs.writeFile(shell.rcFile, newContent);

  return { success: true, rcFile: shell.rcFile };
}

/**
 * Remove shell integration from user's config.
 */
export async function removeShellIntegration(): Promise<void> {
  const shell = detectShell();

  if (existsSync(shell.rcFile) && shell.type !== 'fish') {
    const content = await fs.readFile(shell.rcFile, 'utf-8');

    // Remove our integration lines
    const lines = content.split('\n');
    const filtered = lines.filter(line =>
      !line.includes(INTEGRATION_MARKER) &&
      !line.includes('.cc-profiles-aliases.sh')
    );

    await fs.writeFile(shell.rcFile, filtered.join('\n'));
  }

  // Also remove aliases file
  const aliasesFile = getAliasesFilePath();
  if (existsSync(aliasesFile)) {
    await fs.rm(aliasesFile);
  }
}

/**
 * Generate a single profile function for the current shell.
 * @param profileName - Name of the profile
 * @returns Shell function code
 */
export function generateProfileFunction(profileName: string): string {
  const shell = detectShell();

  if (shell.type === 'fish') {
    return `function ${profileName}
    set -x CLAUDE_CONFIG_DIR "$HOME/.claude-${profileName}"
    command claude $argv
end`;
  }

  // Bash/Zsh function syntax
  return `${profileName}() {
    CLAUDE_CONFIG_DIR="$HOME/.claude-${profileName}" command claude "$@"
}`;
}

/**
 * Regenerate the aliases file with all current profiles.
 * @param profileNames - Array of profile names
 */
export async function regenerateAliasesFile(profileNames: string[]): Promise<void> {
  const shell = detectShell();
  const aliasesFile = getAliasesFilePath();

  if (profileNames.length === 0) {
    // Remove file if no profiles
    if (existsSync(aliasesFile)) {
      await fs.rm(aliasesFile);
    }
    return;
  }

  // Ensure directory exists for fish
  if (shell.type === 'fish') {
    const fishFunctionsDir = join(HOME, '.config/fish/functions');
    await fs.mkdir(fishFunctionsDir, { recursive: true });
  }

  let content: string;

  if (shell.type === 'fish') {
    // Fish shell format
    const header = `# Auto-generated by cc-profiles - DO NOT EDIT MANUALLY
# This file is regenerated when profiles are created/removed
# Generated: ${new Date().toISOString()}

`;

    const functions = profileNames.map(name => `function ${name}
    set -x CLAUDE_CONFIG_DIR "$HOME/.claude-${name}"
    command claude $argv
end`).join('\n\n');

    const listFunction = `
function cc-list
    echo "Available Claude Code profiles:"
${profileNames.map(name => `    echo "  ${name}"`).join('\n')}
    echo ""
    echo "Run any profile name as a command to start Claude with that profile."
end`;

    content = header + functions + '\n' + listFunction + '\n';

  } else {
    // Bash/Zsh format
    const header = `#!/bin/bash
# Auto-generated by cc-profiles - DO NOT EDIT MANUALLY
# This file is regenerated when profiles are created/removed
# Generated: ${new Date().toISOString()}

`;

    const functions = profileNames.map(name => `${name}() {
    CLAUDE_CONFIG_DIR="$HOME/.claude-${name}" command claude "$@"
}`).join('\n\n');

    const listFunction = `
# List all available profiles
cc-list() {
    echo "Available Claude Code profiles:"
${profileNames.map(name => `    echo "  ${name}"`).join('\n')}
    echo ""
    echo "Run any profile name as a command to start Claude with that profile."
}`;

    content = header + functions + '\n' + listFunction + '\n';
  }

  await fs.writeFile(aliasesFile, content, { mode: 0o644 });
}

/**
 * Get list of profile names from config file.
 * @returns Array of profile names
 */
export async function getProfileNamesFromConfig(): Promise<string[]> {
  const configPath = join(HOME, '.cc-profiles.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return Object.keys(config.profiles || {});
  } catch {
    return [];
  }
}

/**
 * Sync aliases file with current profiles.
 * Call this after creating or removing a profile.
 */
export async function syncAliases(): Promise<void> {
  const profileNames = await getProfileNamesFromConfig();
  await regenerateAliasesFile(profileNames);
}

/**
 * Get the shell's rc file path.
 * @returns Path to the shell configuration file
 */
export function getShellRcFile(): string {
  return detectShell().rcFile;
}
