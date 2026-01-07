import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { CLAUDE_PATHS, getProfilePath, getProfileCredentialsPath } from '../utils/paths.js';
import { createSymlinks, removeSymlinks } from './symlinks.js';
import { isValidProfileName } from '../utils/validation.js';
import { readJson, writeJson } from '../utils/fs.js';
import type { Profile, ProfileConfig } from '../types/index.js';

/**
 * Create a new Claude Code profile.
 * @param name - Name for the new profile
 * @returns The created profile object
 * @throws Error if profile name is invalid or profile already exists
 */
export async function createProfile(name: string): Promise<Profile> {
  const profilePath = getProfilePath(name);
  const credentialsPath = getProfileCredentialsPath(name);

  // Validate name
  if (!isValidProfileName(name)) {
    throw new Error('Invalid profile name. Use only lowercase letters, numbers, and hyphens (must start with a letter).');
  }

  // Check if profile already exists
  if (existsSync(profilePath)) {
    throw new Error(`Profile "${name}" already exists.`);
  }

  // Check if main Claude config exists
  if (!existsSync(CLAUDE_PATHS.mainConfig)) {
    throw new Error('Claude Code is not configured. Please run "claude" first to set up your main configuration.');
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

/**
 * List all existing profiles.
 * @returns Array of profile objects
 */
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

  // Sort by creation date (newest first)
  profiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return profiles;
}

/**
 * Get a single profile by name.
 * @param name - Profile name to look up
 * @returns Profile object or null if not found
 */
export async function getProfile(name: string): Promise<Profile | null> {
  const profiles = await listProfiles();
  return profiles.find(p => p.name === name) || null;
}

/**
 * Remove an existing profile.
 * @param name - Name of the profile to remove
 * @throws Error if profile doesn't exist
 */
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

/**
 * Check if a profile exists.
 * @param name - Profile name to check
 * @returns True if profile exists
 */
export function profileExists(name: string): boolean {
  return existsSync(getProfilePath(name));
}

/**
 * Get existing profile names.
 * @returns Array of profile names
 */
export async function getProfileNames(): Promise<string[]> {
  const profiles = await listProfiles();
  return profiles.map(p => p.name);
}

/**
 * Load the cc-profiles configuration file.
 * @returns ProfileConfig object
 */
async function loadProfilesConfig(): Promise<ProfileConfig> {
  const config = await readJson<ProfileConfig>(CLAUDE_PATHS.profilesConfig);
  return config || { profiles: {}, version: '1.0.0' };
}

/**
 * Save profile metadata to the configuration file.
 * @param name - Profile name
 */
async function saveProfileMetadata(name: string): Promise<void> {
  const config = await loadProfilesConfig();
  config.profiles[name] = {
    name,
    createdAt: new Date().toISOString(),
    shellAlias: name,
  };
  await writeJson(CLAUDE_PATHS.profilesConfig, config);
}

/**
 * Remove profile metadata from the configuration file.
 * @param name - Profile name
 */
async function removeProfileMetadata(name: string): Promise<void> {
  const config = await loadProfilesConfig();
  delete config.profiles[name];
  await writeJson(CLAUDE_PATHS.profilesConfig, config);
}
