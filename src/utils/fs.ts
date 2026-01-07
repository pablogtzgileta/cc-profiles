import * as fs from 'node:fs/promises';
import { existsSync, lstatSync } from 'node:fs';

/**
 * Check if a path exists.
 * @param path - Path to check
 * @returns True if the path exists
 */
export function pathExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Check if a path is a symbolic link.
 * @param path - Path to check
 * @returns True if the path is a symlink
 */
export function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory.
 * @param path - Path to check
 * @returns True if the path is a directory
 */
export function isDirectory(path: string): boolean {
  try {
    return lstatSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Safely create a directory, creating parent directories if needed.
 * @param path - Directory path to create
 */
export async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

/**
 * Safely remove a file or directory.
 * @param path - Path to remove
 */
export async function safeRemove(path: string): Promise<void> {
  if (existsSync(path)) {
    await fs.rm(path, { recursive: true, force: true });
  }
}

/**
 * Read a JSON file and parse it.
 * @param path - Path to JSON file
 * @returns Parsed JSON content or null if file doesn't exist
 */
export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write an object to a JSON file.
 * @param path - Path to write to
 * @param data - Data to write
 */
export async function writeJson<T>(path: string, data: T): Promise<void> {
  await fs.writeFile(path, JSON.stringify(data, null, 2));
}
