/**
 * Represents a Claude Code profile with its configuration and authentication state.
 */
export interface Profile {
  /** Unique name of the profile */
  name: string;
  /** Full path to the profile directory */
  path: string;
  /** Path to the profile's config directory (~/.claude-{name}/) */
  configPath: string;
  /** Path to the credentials file (~/.claude-{name}.json) */
  credentialsPath: string;
  /** Whether the profile has been authenticated */
  isAuthenticated: boolean;
  /** When the profile was created */
  createdAt: Date;
}

/**
 * Configuration file structure for cc-profiles.
 */
export interface ProfileConfig {
  /** Map of profile names to their metadata */
  profiles: Record<string, ProfileMetadata>;
  /** Name of the default profile (optional) */
  defaultProfile?: string;
  /** Configuration file version */
  version: string;
}

/**
 * Metadata stored for each profile in the config file.
 */
export interface ProfileMetadata {
  /** Profile name */
  name: string;
  /** ISO timestamp of when the profile was created */
  createdAt: string;
  /** Shell alias for this profile */
  shellAlias: string;
}

/**
 * Represents a symlink between shared configuration and profile directory.
 */
export interface SymlinkTarget {
  /** Source path (e.g., ~/.claude/settings.json) */
  source: string;
  /** Target path in profile (e.g., ~/.claude-{name}/settings.json) */
  target: string;
  /** Whether the target is a file or directory */
  type: 'file' | 'directory';
  /** Whether this symlink is required for the profile to function */
  required: boolean;
}

/**
 * Shell configuration for generating aliases.
 */
export interface ShellConfig {
  /** Type of shell detected */
  type: 'zsh' | 'bash' | 'fish' | 'unknown';
  /** Path to the shell's rc file */
  rcFile: string;
  /** Format for alias generation */
  aliasFormat: string;
}

/**
 * Item to be symlinked from main Claude config to profile.
 */
export interface SharedItem {
  /** Name of the file or directory */
  name: string;
  /** Whether it's a file or directory */
  type: 'file' | 'directory';
  /** Whether this item is required */
  required: boolean;
}

/**
 * Available actions in the interactive menu.
 */
export type CommandAction = 'create' | 'list' | 'remove' | 'exit';
