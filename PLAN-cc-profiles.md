# cc-profiles - Implementation Plan

> CLI tool for managing multiple Claude Code profiles with shared configuration and isolated authentication.

## Overview

**Package Name:** `cc-profiles`
**License:** MIT
**Language:** TypeScript (ESM)
**Target:** Node.js v20+

### What it does

1. **Create profiles** - Set up isolated Claude Code profiles with automatic symlinks to shared configuration
2. **List profiles** - Display all profiles with authentication status
3. **Remove profiles** - Clean up profiles and optionally remove shell aliases
4. **Interactive UI** - Beautiful terminal interface using @clack/prompts

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| **@clack/prompts** | ^0.11.0 | Interactive terminal prompts |
| **picocolors** | ^1.1.1 | Terminal colors (faster than chalk) |
| **commander** | ^14.0.2 | CLI argument parsing |
| **typescript** | ^5.7.0 | Type safety |
| **tsup** | ^8.3.0 | Build/bundle tool |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **@types/node** | ^22.0.0 | Node.js types |
| **vitest** | ^2.1.0 | Testing framework |

---

## Project Structure

```
cc-profiles/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── LICENSE
├── src/
│   ├── index.ts              # CLI entry point
│   ├── cli.ts                # Commander setup & command routing
│   ├── commands/
│   │   ├── create.ts         # Create profile command
│   │   ├── list.ts           # List profiles command
│   │   ├── remove.ts         # Remove profile command
│   │   └── interactive.ts    # Interactive menu
│   ├── core/
│   │   ├── profile.ts        # Profile CRUD operations
│   │   ├── symlinks.ts       # Symlink management
│   │   ├── shell.ts          # Shell alias generation
│   │   └── claude.ts         # Claude Code detection
│   ├── utils/
│   │   ├── fs.ts             # File system helpers
│   │   ├── paths.ts          # Path constants & resolution
│   │   └── validation.ts     # Input validation
│   ├── ui/
│   │   ├── prompts.ts        # Clack prompt wrappers
│   │   ├── messages.ts       # Styled messages & notes
│   │   └── colors.ts         # Color scheme constants
│   └── types/
│       └── index.ts          # TypeScript interfaces
└── tests/
    ├── profile.test.ts
    ├── symlinks.test.ts
    └── shell.test.ts
```

---

## Configuration Files

### package.json

```json
{
  "name": "cc-profiles",
  "version": "1.0.0",
  "description": "Manage multiple Claude Code profiles with shared configuration",
  "type": "module",
  "license": "MIT",
  "author": "Pablo Gutierrez",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/cc-profiles"
  },
  "keywords": [
    "claude",
    "claude-code",
    "cli",
    "profiles",
    "multi-account"
  ],
  "bin": {
    "cc-profiles": "./dist/index.js"
  },
  "files": [
    "dist"
  ],
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@clack/prompts": "^0.11.0",
    "commander": "^14.0.2",
    "picocolors": "^1.1.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node20',
  banner: {
    js: '#!/usr/bin/env node',
  },
});
```

---

## Core Implementation

### Types (src/types/index.ts)

```typescript
export interface Profile {
  name: string;
  path: string;
  configPath: string;        // ~/.claude-{name}/
  credentialsPath: string;   // ~/.claude-{name}.json
  isAuthenticated: boolean;
  createdAt: Date;
}

export interface ProfileConfig {
  profiles: Record<string, ProfileMetadata>;
  defaultProfile?: string;
  version: string;
}

export interface ProfileMetadata {
  name: string;
  createdAt: string;
  shellAlias: string;
}

export interface SymlinkTarget {
  source: string;      // ~/.claude/settings.json
  target: string;      // ~/.claude-{name}/settings.json
  type: 'file' | 'directory';
  required: boolean;
}

export interface ShellConfig {
  type: 'zsh' | 'bash' | 'fish' | 'unknown';
  rcFile: string;
  aliasFormat: string;
}

export type CommandAction = 'create' | 'list' | 'remove' | 'discover' | 'exit';
```

### Path Constants (src/utils/paths.ts)

```typescript
import { homedir } from 'node:os';
import { join } from 'node:path';

export const HOME = homedir();

export const CLAUDE_PATHS = {
  // Main Claude Code directory
  mainConfig: join(HOME, '.claude'),
  mainCredentials: join(HOME, '.claude.json'),

  // Files/directories to symlink (shared)
  sharedItems: [
    { name: 'settings.json', type: 'file' as const, required: true },
    { name: 'CLAUDE.md', type: 'file' as const, required: false },
    { name: 'agents', type: 'directory' as const, required: false },
    { name: 'commands', type: 'directory' as const, required: false },
    { name: 'plugins', type: 'directory' as const, required: false },
  ],

  // cc-profiles config file
  profilesConfig: join(HOME, '.cc-profiles.json'),
} as const;

export function getProfilePath(name: string): string {
  return join(HOME, `.claude-${name}`);
}

export function getProfileCredentialsPath(name: string): string {
  return join(HOME, `.claude-${name}.json`);
}
```

### Profile Operations (src/core/profile.ts)

```typescript
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { CLAUDE_PATHS, getProfilePath, getProfileCredentialsPath } from '../utils/paths.js';
import { createSymlinks, removeSymlinks } from './symlinks.js';
import type { Profile, ProfileConfig, ProfileMetadata } from '../types/index.js';

export async function createProfile(name: string): Promise<Profile> {
  const profilePath = getProfilePath(name);
  const credentialsPath = getProfileCredentialsPath(name);

  // Validate name
  if (!isValidProfileName(name)) {
    throw new Error('Invalid profile name. Use only lowercase letters, numbers, and hyphens.');
  }

  // Check if profile already exists
  if (existsSync(profilePath)) {
    throw new Error(`Profile "${name}" already exists.`);
  }

  // Check if main Claude config exists
  if (!existsSync(CLAUDE_PATHS.mainConfig)) {
    throw new Error('Claude Code is not configured. Please run "claude" first.');
  }

  // Create profile directory
  await fs.mkdir(profilePath, { recursive: true });

  // Create symlinks to shared configuration
  await createSymlinks(name);

  // Save profile metadata
  await saveProfileMetadata(name);

  return {
    name,
    path: profilePath,
    configPath: profilePath,
    credentialsPath,
    isAuthenticated: existsSync(credentialsPath),
    createdAt: new Date(),
  };
}

export async function listProfiles(): Promise<Profile[]> {
  const config = await loadProfilesConfig();
  const profiles: Profile[] = [];

  for (const [name, metadata] of Object.entries(config.profiles)) {
    const profilePath = getProfilePath(name);
    const credentialsPath = getProfileCredentialsPath(name);

    if (existsSync(profilePath)) {
      profiles.push({
        name,
        path: profilePath,
        configPath: profilePath,
        credentialsPath,
        isAuthenticated: existsSync(credentialsPath),
        createdAt: new Date(metadata.createdAt),
      });
    }
  }

  return profiles;
}

export async function removeProfile(name: string): Promise<void> {
  const profilePath = getProfilePath(name);
  const credentialsPath = getProfileCredentialsPath(name);

  if (!existsSync(profilePath)) {
    throw new Error(`Profile "${name}" does not exist.`);
  }

  // Remove symlinks first (to avoid removing shared content)
  await removeSymlinks(name);

  // Remove profile directory
  await fs.rm(profilePath, { recursive: true, force: true });

  // Remove credentials file if exists
  if (existsSync(credentialsPath)) {
    await fs.rm(credentialsPath);
  }

  // Update config
  await removeProfileMetadata(name);
}

export function isValidProfileName(name: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(name) && name.length <= 32;
}

async function loadProfilesConfig(): Promise<ProfileConfig> {
  try {
    const content = await fs.readFile(CLAUDE_PATHS.profilesConfig, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { profiles: {}, version: '1.0.0' };
  }
}

async function saveProfileMetadata(name: string): Promise<void> {
  const config = await loadProfilesConfig();
  config.profiles[name] = {
    name,
    createdAt: new Date().toISOString(),
    shellAlias: name,
  };
  await fs.writeFile(CLAUDE_PATHS.profilesConfig, JSON.stringify(config, null, 2));
}

async function removeProfileMetadata(name: string): Promise<void> {
  const config = await loadProfilesConfig();
  delete config.profiles[name];
  await fs.writeFile(CLAUDE_PATHS.profilesConfig, JSON.stringify(config, null, 2));
}
```

### Symlink Management (src/core/symlinks.ts)

```typescript
import * as fs from 'node:fs/promises';
import { existsSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { CLAUDE_PATHS, getProfilePath } from '../utils/paths.js';
import type { SymlinkTarget } from '../types/index.js';

export async function createSymlinks(profileName: string): Promise<SymlinkTarget[]> {
  const profilePath = getProfilePath(profileName);
  const created: SymlinkTarget[] = [];

  for (const item of CLAUDE_PATHS.sharedItems) {
    const source = join(CLAUDE_PATHS.mainConfig, item.name);
    const target = join(profilePath, item.name);

    // Skip if source doesn't exist and not required
    if (!existsSync(source)) {
      if (item.required) {
        throw new Error(`Required file not found: ${source}`);
      }
      continue;
    }

    // Remove existing target if it's not a symlink
    if (existsSync(target)) {
      const stat = lstatSync(target);
      if (!stat.isSymbolicLink()) {
        await fs.rm(target, { recursive: true, force: true });
      } else {
        // Already a symlink, skip
        continue;
      }
    }

    // Create symlink
    await fs.symlink(source, target);

    created.push({
      source,
      target,
      type: item.type,
      required: item.required,
    });
  }

  return created;
}

export async function removeSymlinks(profileName: string): Promise<void> {
  const profilePath = getProfilePath(profileName);

  for (const item of CLAUDE_PATHS.sharedItems) {
    const target = join(profilePath, item.name);

    if (existsSync(target)) {
      const stat = lstatSync(target);
      if (stat.isSymbolicLink()) {
        await fs.unlink(target);
      }
    }
  }
}

export async function verifySymlinks(profileName: string): Promise<boolean> {
  const profilePath = getProfilePath(profileName);

  for (const item of CLAUDE_PATHS.sharedItems) {
    if (!item.required) continue;

    const target = join(profilePath, item.name);

    if (!existsSync(target)) {
      return false;
    }

    const stat = lstatSync(target);
    if (!stat.isSymbolicLink()) {
      return false;
    }
  }

  return true;
}
```

### Shell Integration (src/core/shell.ts)

```typescript
import * as fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOME } from '../utils/paths.js';
import type { ShellConfig } from '../types/index.js';

// Path to the managed aliases file
export const ALIASES_FILE = join(HOME, '.cc-profiles-aliases.sh');

// Marker to identify our integration line
const INTEGRATION_MARKER = '# cc-profiles shell integration';
const INTEGRATION_LINE = `${INTEGRATION_MARKER}\n[ -f ~/.cc-profiles-aliases.sh ] && source ~/.cc-profiles-aliases.sh`;

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

  return {
    type: 'unknown',
    rcFile: join(HOME, '.bashrc'),
    aliasFormat: 'function',
  };
}

/**
 * Check if shell integration is already set up
 */
export function isShellIntegrated(): boolean {
  const shell = detectShell();

  if (!existsSync(shell.rcFile)) return false;

  const content = readFileSync(shell.rcFile, 'utf-8');
  return content.includes(INTEGRATION_MARKER);
}

/**
 * Add the source line to user's shell config (one-time setup)
 */
export async function setupShellIntegration(): Promise<{ success: boolean; rcFile: string }> {
  const shell = detectShell();

  if (isShellIntegrated()) {
    return { success: true, rcFile: shell.rcFile };
  }

  // Read existing content
  let content = '';
  if (existsSync(shell.rcFile)) {
    content = await fs.readFile(shell.rcFile, 'utf-8');
  }

  // Append our integration line
  const newContent = content.trimEnd() + '\n\n' + INTEGRATION_LINE + '\n';
  await fs.writeFile(shell.rcFile, newContent);

  return { success: true, rcFile: shell.rcFile };
}

/**
 * Remove shell integration from user's config
 */
export async function removeShellIntegration(): Promise<void> {
  const shell = detectShell();

  if (!existsSync(shell.rcFile)) return;

  const content = await fs.readFile(shell.rcFile, 'utf-8');

  // Remove our integration lines
  const lines = content.split('\n');
  const filtered = lines.filter(line =>
    !line.includes(INTEGRATION_MARKER) &&
    !line.includes('.cc-profiles-aliases.sh')
  );

  await fs.writeFile(shell.rcFile, filtered.join('\n'));

  // Also remove aliases file
  if (existsSync(ALIASES_FILE)) {
    await fs.rm(ALIASES_FILE);
  }
}

/**
 * Generate a single profile alias/function
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
 * Get the appropriate aliases file path for the current shell
 */
export function getAliasesFilePath(): string {
  const shell = detectShell();

  if (shell.type === 'fish') {
    return join(HOME, '.config/fish/functions/cc-profiles.fish');
  }

  return join(HOME, '.cc-profiles-aliases.sh');
}

/**
 * Get the integration line for the current shell
 */
function getIntegrationLine(): { marker: string; line: string } {
  const shell = detectShell();

  if (shell.type === 'fish') {
    // Fish auto-loads functions from ~/.config/fish/functions/
    // No need to add anything to config.fish
    return {
      marker: '# cc-profiles (fish functions auto-loaded)',
      line: '# cc-profiles functions are auto-loaded from ~/.config/fish/functions/',
    };
  }

  return {
    marker: '# cc-profiles shell integration',
    line: '# cc-profiles shell integration\n[ -f ~/.cc-profiles-aliases.sh ] && source ~/.cc-profiles-aliases.sh',
  };
}

/**
 * Regenerate the aliases file with all current profiles
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
 * Get list of profile names from config
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
 * Sync aliases file with current profiles
 */
export async function syncAliases(): Promise<void> {
  const profileNames = await getProfileNamesFromConfig();
  await regenerateAliasesFile(profileNames);
}
```

### Claude Detection (src/core/claude.ts)

```typescript
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { CLAUDE_PATHS } from '../utils/paths.js';

export interface ClaudeStatus {
  isInstalled: boolean;
  isConfigured: boolean;
  version?: string;
  configPath: string;
}

export function checkClaudeInstallation(): ClaudeStatus {
  let isInstalled = false;
  let version: string | undefined;

  try {
    const output = execSync('claude --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    isInstalled = true;
    version = output.trim();
  } catch {
    // Claude not in PATH, try common locations
    try {
      const output = execSync('~/.local/bin/claude --version', { encoding: 'utf-8', shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
      isInstalled = true;
      version = output.trim();
    } catch {
      isInstalled = false;
    }
  }

  const isConfigured = existsSync(CLAUDE_PATHS.mainConfig) && existsSync(CLAUDE_PATHS.mainCredentials);

  return {
    isInstalled,
    isConfigured,
    version,
    configPath: CLAUDE_PATHS.mainConfig,
  };
}
```

---

## UI Implementation

### Prompts (src/ui/prompts.ts)

```typescript
import * as p from '@clack/prompts';
import color from 'picocolors';
import type { CommandAction } from '../types/index.js';

export async function showMainMenu(): Promise<CommandAction> {
  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'create', label: 'Create new profile', hint: 'Set up a new Claude Code profile' },
      { value: 'list', label: 'List profiles', hint: 'View all configured profiles' },
      { value: 'remove', label: 'Remove profile', hint: 'Delete an existing profile' },
      { value: 'discover', label: 'Discover profiles', hint: 'Scan for existing ~/.claude-* profiles' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (p.isCancel(action)) {
    return 'exit';
  }

  return action as CommandAction;
}

export async function promptProfileName(existing: string[] = []): Promise<string | null> {
  const name = await p.text({
    message: 'Profile name (will be used as shell alias):',
    placeholder: 'work',
    validate: (value) => {
      if (!value) return 'Profile name is required';
      if (!/^[a-z][a-z0-9-]*$/.test(value)) {
        return 'Use lowercase letters, numbers, and hyphens (must start with letter)';
      }
      if (value.length > 32) return 'Name must be 32 characters or less';
      if (existing.includes(value)) return `Profile "${value}" already exists`;
      if (value === 'claude') return 'Cannot use "claude" as profile name';
    },
  });

  if (p.isCancel(name)) return null;
  return name;
}

export async function selectProfile(profiles: { name: string; isAuthenticated: boolean }[]): Promise<string | null> {
  const selected = await p.select({
    message: 'Select a profile:',
    options: profiles.map(p => ({
      value: p.name,
      label: p.name,
      hint: p.isAuthenticated ? color.green('authenticated') : color.yellow('needs login'),
    })),
  });

  if (p.isCancel(selected)) return null;
  return selected as string;
}

export async function confirmRemove(profileName: string): Promise<boolean> {
  const confirmed = await p.confirm({
    message: `Are you sure you want to remove profile "${profileName}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed)) return false;
  return confirmed;
}
```

### Messages (src/ui/messages.ts)

```typescript
import * as p from '@clack/prompts';
import color from 'picocolors';

export function showIntro(): void {
  console.clear();
  p.intro(color.bgCyan(color.black(' cc-profiles ')));
}

export function showOutro(message?: string): void {
  p.outro(message || 'Done!');
}

export function showError(message: string): void {
  p.log.error(color.red(message));
}

export function showSuccess(message: string): void {
  p.log.success(color.green(message));
}

export function showWarning(message: string): void {
  p.log.warn(color.yellow(message));
}

export function showInfo(message: string): void {
  p.log.info(message);
}

export function showStep(message: string): void {
  p.log.step(message);
}

export function showNote(message: string, title?: string): void {
  p.note(message, title);
}

export function showProfileCreated(name: string, shellInstructions: string): void {
  const message = `Profile ${color.cyan(name)} created successfully!

${color.dim('Add this to your shell config:')}

${color.green(shellInstructions.split('\n').slice(2).join('\n'))}

${color.dim('Then run:')} ${color.cyan(`source ~/.zshrc`)}
${color.dim('And authenticate:')} ${color.cyan(`${name}`)} ${color.dim('then')} ${color.cyan('/login')}`;

  p.note(message, 'Next Steps');
}

export function showNoProfiles(): void {
  p.log.warn('No profiles found. Create one with: cc-profiles create');
}

export function showClaudeNotConfigured(): void {
  p.log.error(`Claude Code is not configured.

Run ${color.cyan('claude')} first to set up your main configuration.`);
}
```

---

## CLI Entry Points

### Main Entry (src/index.ts)

```typescript
#!/usr/bin/env node
import { cli } from './cli.js';

cli.parse();
```

### Commander Setup (src/cli.ts)

```typescript
import { Command } from 'commander';
import { runInteractive } from './commands/interactive.js';
import { runCreate } from './commands/create.js';
import { runList } from './commands/list.js';
import { runRemove } from './commands/remove.js';

export const cli = new Command();

cli
  .name('cc-profiles')
  .description('Manage multiple Claude Code profiles with shared configuration')
  .version('1.0.0');

cli
  .command('interactive', { isDefault: true })
  .description('Open interactive menu')
  .action(runInteractive);

cli
  .command('create [name]')
  .description('Create a new profile')
  .action(runCreate);

cli
  .command('list')
  .alias('ls')
  .description('List all profiles')
  .action(runList);

cli
  .command('remove [name]')
  .alias('rm')
  .description('Remove a profile')
  .action(runRemove);

cli
  .command('discover')
  .description('Scan and import existing ~/.claude-* profiles')
  .action(runDiscover);
```

### Interactive Command (src/commands/interactive.ts)

```typescript
import * as p from '@clack/prompts';
import { showIntro, showOutro, showClaudeNotConfigured } from '../ui/messages.js';
import { showMainMenu } from '../ui/prompts.js';
import { checkClaudeInstallation } from '../core/claude.js';
import { runCreate } from './create.js';
import { runList } from './list.js';
import { runRemove } from './remove.js';
import { runDiscover } from './discover.js';

export async function runInteractive(): Promise<void> {
  showIntro();

  // Check Claude installation
  const claude = checkClaudeInstallation();
  if (!claude.isConfigured) {
    showClaudeNotConfigured();
    process.exit(1);
  }

  let running = true;

  while (running) {
    const action = await showMainMenu();

    switch (action) {
      case 'create':
        await runCreate();
        break;
      case 'list':
        await runList();
        break;
      case 'remove':
        await runRemove();
        break;
      case 'discover':
        await runDiscover();
        break;
      case 'exit':
        running = false;
        break;
    }

    if (running && action !== 'exit') {
      console.log(''); // Add spacing
    }
  }

  showOutro('Goodbye!');
}
```

### Create Command (src/commands/create.ts)

```typescript
import * as p from '@clack/prompts';
import color from 'picocolors';
import { showError, showClaudeNotConfigured, showStep } from '../ui/messages.js';
import { promptProfileName } from '../ui/prompts.js';
import { createProfile, listProfiles } from '../core/profile.js';
import { syncAliases, isShellIntegrated, setupShellIntegration, detectShell } from '../core/shell.js';
import { checkClaudeInstallation } from '../core/claude.js';

export async function runCreate(providedName?: string): Promise<void> {
  // Check Claude installation
  const claude = checkClaudeInstallation();
  if (!claude.isConfigured) {
    showClaudeNotConfigured();
    process.exit(1);
  }

  // Get existing profile names
  const existing = await listProfiles();
  const existingNames = existing.map(p => p.name);

  // Get profile name
  let name = providedName;
  if (!name) {
    const prompted = await promptProfileName(existingNames);
    if (!prompted) {
      p.cancel('Profile creation cancelled.');
      return;
    }
    name = prompted;
  }

  // Create profile with spinner
  const s = p.spinner();
  s.start('Creating profile...');

  try {
    const profile = await createProfile(name);
    s.stop('Profile created!');

    // Show symlink status
    showStep('Symlinked settings.json');
    showStep('Symlinked CLAUDE.md');
    showStep('Symlinked agents/');
    showStep('Symlinked commands/');
    showStep('Symlinked plugins/');

    // Sync shell aliases
    s.start('Updating shell aliases...');
    await syncAliases();
    s.stop('Shell aliases updated!');

    // Check if shell integration is set up
    if (!isShellIntegrated()) {
      const shouldSetup = await p.confirm({
        message: 'Shell integration not found. Set it up now?',
        initialValue: true,
      });

      if (shouldSetup && !p.isCancel(shouldSetup)) {
        const result = await setupShellIntegration();
        p.log.success(`Added shell integration to ${result.rcFile}`);
      }
    }

    // Show next steps
    const shell = detectShell();
    p.note(
      `Profile ${color.cyan(name)} is ready!\n\n` +
      `To use it, ${isShellIntegrated() ? 'open a new terminal or run' : 'run'}:\n` +
      `  ${color.green(`source ${shell.rcFile}`)}\n\n` +
      `Then start Claude with:\n` +
      `  ${color.green(name)}\n\n` +
      `First time? Run ${color.cyan('/login')} inside Claude to authenticate.`,
      'Next Steps'
    );

  } catch (error) {
    s.stop('Failed to create profile');
    showError(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
```

### List Command (src/commands/list.ts)

```typescript
import * as p from '@clack/prompts';
import color from 'picocolors';
import { showNoProfiles, showInfo } from '../ui/messages.js';
import { listProfiles } from '../core/profile.js';
import { verifySymlinks } from '../core/symlinks.js';

export async function runList(): Promise<void> {
  const profiles = await listProfiles();

  if (profiles.length === 0) {
    showNoProfiles();
    return;
  }

  console.log('');
  p.log.info(`Found ${color.cyan(profiles.length.toString())} profile(s):\n`);

  for (const profile of profiles) {
    const authStatus = profile.isAuthenticated
      ? color.green('authenticated')
      : color.yellow('needs /login');

    const symlinksOk = await verifySymlinks(profile.name);
    const symlinkStatus = symlinksOk
      ? color.green('symlinks ok')
      : color.red('symlinks broken');

    console.log(`  ${color.cyan(profile.name)}`);
    console.log(`    Status: ${authStatus}`);
    console.log(`    Config: ${symlinkStatus}`);
    console.log(`    Path:   ${color.dim(profile.path)}`);
    console.log('');
  }
}
```

### Discover Command (src/commands/discover.ts)

```typescript
import * as p from '@clack/prompts';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import color from 'picocolors';
import { HOME, CLAUDE_PATHS, getProfileCredentialsPath } from '../utils/paths.js';
import { showInfo, showSuccess } from '../ui/messages.js';
import { verifySymlinks } from '../core/symlinks.js';

interface DiscoveredProfile {
  name: string;
  path: string;
  isAuthenticated: boolean;
  hasSymlinks: boolean;
}

export async function runDiscover(): Promise<void> {
  const s = p.spinner();
  s.start('Scanning for existing profiles...');

  const discovered = await scanForProfiles();
  s.stop(`Found ${discovered.length} profile(s)`);

  if (discovered.length === 0) {
    p.log.info('No existing profiles found.');
    return;
  }

  console.log('');
  p.log.info(`Discovered profiles:\n`);

  for (const profile of discovered) {
    const authStatus = profile.isAuthenticated
      ? color.green('authenticated')
      : color.yellow('needs /login');
    const symlinkStatus = profile.hasSymlinks
      ? color.green('symlinks ok')
      : color.yellow('no symlinks');

    console.log(`  ${color.cyan(profile.name)}`);
    console.log(`    Auth: ${authStatus} | Config: ${symlinkStatus}`);
    console.log('');
  }

  // Ask to import
  const shouldImport = await p.confirm({
    message: 'Import these profiles into cc-profiles?',
    initialValue: true,
  });

  if (p.isCancel(shouldImport) || !shouldImport) {
    p.cancel('Import cancelled.');
    return;
  }

  // Import profiles
  await importProfiles(discovered);
  showSuccess('Profiles imported successfully!');
}

async function scanForProfiles(): Promise<DiscoveredProfile[]> {
  const profiles: DiscoveredProfile[] = [];

  try {
    const homeContents = await fs.readdir(HOME);

    for (const item of homeContents) {
      // Match .claude-* directories (but not .claude itself)
      if (item.startsWith('.claude-') && item !== '.claude') {
        const name = item.replace('.claude-', '');
        const path = `${HOME}/${item}`;
        const credPath = getProfileCredentialsPath(name);

        // Check if it's a directory
        const stat = await fs.stat(path);
        if (!stat.isDirectory()) continue;

        const isAuthenticated = existsSync(credPath);
        const hasSymlinks = await verifySymlinks(name);

        profiles.push({
          name,
          path,
          isAuthenticated,
          hasSymlinks,
        });
      }
    }
  } catch (error) {
    // Ignore errors during scan
  }

  return profiles;
}

async function importProfiles(profiles: DiscoveredProfile[]): Promise<void> {
  const config = await loadOrCreateConfig();

  for (const profile of profiles) {
    config.profiles[profile.name] = {
      name: profile.name,
      createdAt: new Date().toISOString(),
      shellAlias: profile.name,
      imported: true,
    };
  }

  await fs.writeFile(CLAUDE_PATHS.profilesConfig, JSON.stringify(config, null, 2));
}

async function loadOrCreateConfig() {
  try {
    const content = await fs.readFile(CLAUDE_PATHS.profilesConfig, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { profiles: {}, version: '1.0.0' };
  }
}
```

### Remove Command (src/commands/remove.ts)

```typescript
import * as p from '@clack/prompts';
import { showError, showSuccess, showNoProfiles } from '../ui/messages.js';
import { selectProfile, confirmRemove } from '../ui/prompts.js';
import { listProfiles, removeProfile } from '../core/profile.js';
import { syncAliases } from '../core/shell.js';

export async function runRemove(providedName?: string): Promise<void> {
  const profiles = await listProfiles();

  if (profiles.length === 0) {
    showNoProfiles();
    return;
  }

  // Get profile name
  let name = providedName;
  if (!name) {
    const selected = await selectProfile(profiles);
    if (!selected) {
      p.cancel('Profile removal cancelled.');
      return;
    }
    name = selected;
  }

  // Confirm removal
  const confirmed = await confirmRemove(name);
  if (!confirmed) {
    p.cancel('Profile removal cancelled.');
    return;
  }

  // Remove profile with spinner
  const s = p.spinner();
  s.start('Removing profile...');

  try {
    await removeProfile(name);
    s.stop('Profile removed!');

    // Sync shell aliases (removes the function from aliases file)
    s.start('Updating shell aliases...');
    await syncAliases();
    s.stop('Shell aliases updated!');

    showSuccess(`Profile "${name}" has been removed.`);
    p.note(
      `The shell alias has been removed from ~/.cc-profiles-aliases.sh\n` +
      `Open a new terminal or run 'source ~/.zshrc' to apply changes.`,
      'Done'
    );

  } catch (error) {
    s.stop('Failed to remove profile');
    showError(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
```

---

## Implementation Phases

### Phase 1: Project Setup
- [ ] Initialize npm project with package.json
- [ ] Configure TypeScript with tsconfig.json
- [ ] Set up tsup for building
- [ ] Create directory structure

### Phase 2: Core Logic
- [ ] Implement path utilities
- [ ] Implement profile CRUD operations
- [ ] Implement symlink management
- [ ] Implement shell detection and alias generation
- [ ] Implement Claude installation detection

### Phase 3: UI Layer
- [ ] Implement Clack prompt wrappers
- [ ] Implement styled messages
- [ ] Create interactive menu

### Phase 4: CLI Commands
- [ ] Set up Commander with subcommands
- [ ] Implement create command
- [ ] Implement list command
- [ ] Implement remove command
- [ ] Implement interactive mode

### Phase 5: Testing & Polish
- [ ] Write unit tests for core functions
- [ ] Test on macOS, Linux
- [ ] Add error handling edge cases
- [ ] Write README documentation

### Phase 6: Publishing
- [ ] Create GitHub repository
- [ ] Add LICENSE file
- [ ] Publish to npm

---

## Usage Examples

```bash
# Interactive mode (default)
npx cc-profiles

# Direct commands
npx cc-profiles create work
npx cc-profiles create personal
npx cc-profiles list
npx cc-profiles remove work

# After setup
work      # Opens Claude with work profile
personal  # Opens Claude with personal profile
```

---

## Future Enhancements (v2.0)

- [ ] Auto-inject aliases into shell rc file
- [ ] Profile import/export
- [ ] Profile switching indicator in prompt
- [ ] Fish shell completions
- [ ] Bash/Zsh completions
- [ ] Profile templates
- [ ] Backup/restore profiles

---

## Resources

- [@clack/prompts Documentation](https://www.clack.cc/)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [picocolors Documentation](https://github.com/alexeyraspopov/picocolors)
- [Node.js ESM Best Practices](https://2ality.com/2025/02/typescript-esm-packages.html)
- [tsup Documentation](https://tsup.egoist.dev/)
