import * as p from '@clack/prompts';
import { showNoProfiles } from '../ui/messages.js';
import { colors, formatProfileName, formatPath, formatAuthStatus, formatSymlinkStatus } from '../ui/colors.js';
import { listProfiles } from '../core/profile.js';
import { verifySymlinks } from '../core/symlinks.js';

/**
 * Run the list profiles command.
 */
export async function runList(): Promise<void> {
  const profiles = await listProfiles();

  if (profiles.length === 0) {
    showNoProfiles();
    return;
  }

  console.log('');
  p.log.info(`Found ${colors.primary(profiles.length.toString())} profile(s):\n`);

  for (const profile of profiles) {
    const symlinksOk = await verifySymlinks(profile.name);

    console.log(`  ${formatProfileName(profile.name)}`);
    console.log(`    Status: ${formatAuthStatus(profile.isAuthenticated)}`);
    console.log(`    Config: ${formatSymlinkStatus(symlinksOk)}`);
    console.log(`    Path:   ${formatPath(profile.path)}`);
    console.log('');
  }
}
