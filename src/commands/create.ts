import * as p from '@clack/prompts';
import color from 'picocolors';
import { showError, showClaudeNotConfigured, showStep } from '../ui/messages.js';
import { promptProfileName, createSpinner, showCancel } from '../ui/prompts.js';
import { createProfile, getProfileNames } from '../core/profile.js';
import { syncAliases, isShellIntegrated, setupShellIntegration, detectShell } from '../core/shell.js';
import { checkClaudeInstallation } from '../core/claude.js';
import { CLAUDE_PATHS } from '../utils/paths.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Run the create profile command.
 * @param providedName - Optional profile name from CLI argument
 */
export async function runCreate(providedName?: string): Promise<void> {
  // Check Claude installation
  const claude = checkClaudeInstallation();
  if (!claude.isConfigured) {
    showClaudeNotConfigured();
    process.exit(1);
  }

  // Get existing profile names
  const existingNames = await getProfileNames();

  // Get profile name
  let name = providedName;
  if (!name) {
    const prompted = await promptProfileName(existingNames);
    if (!prompted) {
      showCancel('Profile creation cancelled.');
      return;
    }
    name = prompted;
  } else {
    // Validate provided name doesn't conflict
    if (existingNames.includes(name)) {
      showError(`Profile "${name}" already exists.`);
      process.exit(1);
    }
  }

  // Create profile with spinner
  const s = createSpinner();
  s.start('Creating profile...');

  try {
    await createProfile(name);
    s.stop('Profile created!');

    // Show symlink status for items that exist
    const sharedItems = CLAUDE_PATHS.sharedItems;
    for (const item of sharedItems) {
      const sourcePath = join(CLAUDE_PATHS.mainConfig, item.name);
      if (existsSync(sourcePath)) {
        showStep(`Symlinked ${item.name}`);
      }
    }

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
