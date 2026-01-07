import { showIntro, showOutro, showClaudeNotConfigured } from '../ui/messages.js';
import { showMainMenu } from '../ui/prompts.js';
import { checkClaudeInstallation } from '../core/claude.js';
import { runCreate } from './create.js';
import { runList } from './list.js';
import { runRemove } from './remove.js';

/**
 * Run the interactive menu mode.
 */
export async function runInteractive(): Promise<void> {
  showIntro();

  // Check Claude installation
  const claude = checkClaudeInstallation();
  if (!claude.isConfigured) {
    showClaudeNotConfigured();
    process.exit(1);
  }

  let running = true;

  while (running) {
    const action = await showMainMenu();

    switch (action) {
      case 'create':
        await runCreate();
        break;
      case 'list':
        await runList();
        break;
      case 'remove':
        await runRemove();
        break;
      case 'exit':
        running = false;
        break;
    }

    if (running && action !== 'exit') {
      console.log(''); // Add spacing between actions
    }
  }

  showOutro('Goodbye!');
}
