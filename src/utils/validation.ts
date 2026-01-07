/** Maximum allowed length for a profile name */
const MAX_PROFILE_NAME_LENGTH = 32;

/** Regex pattern for valid profile names */
const PROFILE_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/** Reserved names that cannot be used as profile names */
const RESERVED_NAMES = ['claude', 'default', 'main', 'primary'];

/**
 * Validate a profile name.
 * @param name - Profile name to validate
 * @returns True if the name is valid
 */
export function isValidProfileName(name: string): boolean {
  if (!name || name.length === 0) {
    return false;
  }

  if (name.length > MAX_PROFILE_NAME_LENGTH) {
    return false;
  }

  if (!PROFILE_NAME_PATTERN.test(name)) {
    return false;
  }

  if (RESERVED_NAMES.includes(name.toLowerCase())) {
    return false;
  }

  return true;
}

/**
 * Get a descriptive error message for an invalid profile name.
 * @param name - Profile name that failed validation
 * @returns Error message explaining why the name is invalid
 */
export function getProfileNameError(name: string): string | null {
  if (!name || name.length === 0) {
    return 'Profile name is required';
  }

  if (name.length > MAX_PROFILE_NAME_LENGTH) {
    return `Name must be ${MAX_PROFILE_NAME_LENGTH} characters or less`;
  }

  if (!/^[a-z]/.test(name)) {
    return 'Name must start with a lowercase letter';
  }

  if (!PROFILE_NAME_PATTERN.test(name)) {
    return 'Use only lowercase letters, numbers, and hyphens';
  }

  if (RESERVED_NAMES.includes(name.toLowerCase())) {
    return `"${name}" is a reserved name`;
  }

  return null;
}
