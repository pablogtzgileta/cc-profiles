import * as p from '@clack/prompts';
import { showError, showSuccess, showNoProfiles } from '../ui/messages.js';
import { selectProfile, confirmRemove, createSpinner, showCancel } from '../ui/prompts.js';
import { listProfiles, removeProfile, profileExists } from '../core/profile.js';
import { syncAliases, detectShell } from '../core/shell.js';

/**
 * Run the remove profile command.
 * @param providedName - Optional profile name from CLI argument
 */
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
      showCancel('Profile removal cancelled.');
      return;
    }
    name = selected;
  } else {
    // Validate provided name exists
    if (!profileExists(name)) {
      showError(`Profile "${name}" does not exist.`);
      process.exit(1);
    }
  }

  // Confirm removal
  const confirmed = await confirmRemove(name);
  if (!confirmed) {
    showCancel('Profile removal cancelled.');
    return;
  }

  // Remove profile with spinner
  const s = createSpinner();
  s.start('Removing profile...');

  try {
    await removeProfile(name);
    s.stop('Profile removed!');

    // Sync shell aliases (removes the function from aliases file)
    s.start('Updating shell aliases...');
    await syncAliases();
    s.stop('Shell aliases updated!');

    showSuccess(`Profile "${name}" has been removed.`);

    const shell = detectShell();
    p.note(
      `The shell alias has been removed from ~/.cc-profiles-aliases.sh\n` +
      `Open a new terminal or run 'source ${shell.rcFile}' to apply changes.`,
      'Done'
    );

  } catch (error) {
    s.stop('Failed to remove profile');
    showError(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
