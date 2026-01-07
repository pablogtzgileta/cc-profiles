import * as fs from 'node:fs/promises';
import { existsSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { CLAUDE_PATHS, getProfilePath } from '../utils/paths.js';
import type { SymlinkTarget } from '../types/index.js';

/**
 * Create symlinks from main Claude config to a profile directory.
 * @param profileName - Name of the profile to create symlinks for
 * @returns Array of created symlink targets
 * @throws Error if required source files don't exist
 */
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

/**
 * Remove all symlinks from a profile directory.
 * Only removes items that are actually symlinks to preserve any local files.
 * @param profileName - Name of the profile to remove symlinks from
 */
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

/**
 * Verify that all required symlinks exist and are valid for a profile.
 * @param profileName - Name of the profile to verify
 * @returns True if all required symlinks are valid
 */
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

    // Verify the symlink target exists
    try {
      await fs.stat(target);
    } catch {
      // Broken symlink
      return false;
    }
  }

  return true;
}

/**
 * Get list of symlinked items for a profile.
 * @param profileName - Name of the profile
 * @returns Array of symlink details
 */
export async function getSymlinkStatus(profileName: string): Promise<{
  name: string;
  exists: boolean;
  isSymlink: boolean;
  targetExists: boolean;
}[]> {
  const profilePath = getProfilePath(profileName);
  const status: {
    name: string;
    exists: boolean;
    isSymlink: boolean;
    targetExists: boolean;
  }[] = [];

  for (const item of CLAUDE_PATHS.sharedItems) {
    const target = join(profilePath, item.name);
    const exists = existsSync(target);
    let isSymlinkFlag = false;
    let targetExists = false;

    if (exists) {
      isSymlinkFlag = lstatSync(target).isSymbolicLink();
      if (isSymlinkFlag) {
        try {
          await fs.stat(target);
          targetExists = true;
        } catch {
          targetExists = false;
        }
      }
    }

    status.push({
      name: item.name,
      exists,
      isSymlink: isSymlinkFlag,
      targetExists,
    });
  }

  return status;
}
