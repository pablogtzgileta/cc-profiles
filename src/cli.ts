import { Command } from 'commander';
import { runInteractive } from './commands/interactive.js';
import { runCreate } from './commands/create.js';
import { runList } from './commands/list.js';
import { runRemove } from './commands/remove.js';

export const cli = new Command();

cli
  .name('cc-profiles')
  .description('Manage multiple Claude Code profiles with shared configuration')
  .version('1.0.0');

cli
  .command('interactive', { isDefault: true })
  .description('Open interactive menu')
  .action(runInteractive);

cli
  .command('create [name]')
  .description('Create a new profile')
  .action(runCreate);

cli
  .command('list')
  .alias('ls')
  .description('List all profiles')
  .action(runList);

cli
  .command('remove [name]')
  .alias('rm')
  .description('Remove a profile')
  .action(runRemove);
