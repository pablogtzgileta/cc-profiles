import color from 'picocolors';

/**
 * Color scheme constants for consistent UI styling.
 */
export const colors = {
  /** Primary accent color for important elements */
  primary: color.cyan,

  /** Success messages and positive states */
  success: color.green,

  /** Warning messages and attention states */
  warning: color.yellow,

  /** Error messages and negative states */
  error: color.red,

  /** Dimmed text for secondary information */
  dim: color.dim,

  /** Bold text for emphasis */
  bold: color.bold,

  /** Inverted text for headers */
  inverse: (text: string) => color.bgCyan(color.black(text)),
} as const;

/**
 * Format a profile name with primary color.
 * @param name - Profile name
 * @returns Colored profile name
 */
export function formatProfileName(name: string): string {
  return colors.primary(name);
}

/**
 * Format a path with dim color.
 * @param path - File path
 * @returns Dimmed path
 */
export function formatPath(path: string): string {
  return colors.dim(path);
}

/**
 * Format an authentication status.
 * @param isAuthenticated - Whether the profile is authenticated
 * @returns Colored status string
 */
export function formatAuthStatus(isAuthenticated: boolean): string {
  return isAuthenticated
    ? colors.success('authenticated')
    : colors.warning('needs /login');
}

/**
 * Format a symlink status.
 * @param isValid - Whether symlinks are valid
 * @returns Colored status string
 */
export function formatSymlinkStatus(isValid: boolean): string {
  return isValid
    ? colors.success('symlinks ok')
    : colors.error('symlinks broken');
}
