import * as p from '@clack/prompts';
import { formatAuthStatus } from './colors.js';
import { getProfileNameError } from '../utils/validation.js';
import type { CommandAction } from '../types/index.js';

/**
 * Show the main interactive menu.
 * @returns Selected action
 */
export async function showMainMenu(): Promise<CommandAction> {
  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'create', label: 'Create new profile', hint: 'Set up a new Claude Code profile' },
      { value: 'list', label: 'List profiles', hint: 'View all configured profiles' },
      { value: 'remove', label: 'Remove profile', hint: 'Delete an existing profile' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (p.isCancel(action)) {
    return 'exit';
  }

  return action as CommandAction;
}

/**
 * Prompt for a profile name.
 * @param existing - Array of existing profile names to check for conflicts
 * @returns The entered profile name or null if cancelled
 */
export async function promptProfileName(existing: string[] = []): Promise<string | null> {
  const name = await p.text({
    message: 'Profile name (will be used as shell alias):',
    placeholder: 'work',
    validate: (value) => {
      const error = getProfileNameError(value);
      if (error) return error;
      if (existing.includes(value)) return `Profile "${value}" already exists`;
      return undefined;
    },
  });

  if (p.isCancel(name)) return null;
  return name;
}

/**
 * Select a profile from a list.
 * @param profiles - Array of profiles with name and auth status
 * @returns Selected profile name or null if cancelled
 */
export async function selectProfile(profiles: { name: string; isAuthenticated: boolean }[]): Promise<string | null> {
  const selected = await p.select({
    message: 'Select a profile:',
    options: profiles.map(profile => ({
      value: profile.name,
      label: profile.name,
      hint: formatAuthStatus(profile.isAuthenticated),
    })),
  });

  if (p.isCancel(selected)) return null;
  return selected as string;
}

/**
 * Confirm profile removal.
 * @param profileName - Name of the profile to remove
 * @returns True if confirmed
 */
export async function confirmRemove(profileName: string): Promise<boolean> {
  const confirmed = await p.confirm({
    message: `Are you sure you want to remove profile "${profileName}"?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed)) return false;
  return confirmed;
}

/**
 * Create a spinner for async operations.
 * @returns Clack spinner instance
 */
export function createSpinner(): ReturnType<typeof p.spinner> {
  return p.spinner();
}

/**
 * Show a cancellation message.
 * @param message - Cancellation reason
 */
export function showCancel(message: string): void {
  p.cancel(message);
}
