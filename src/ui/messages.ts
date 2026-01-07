import * as p from '@clack/prompts';
import { colors, formatProfileName } from './colors.js';
import { getShellRcFile } from '../core/shell.js';

/**
 * Show the intro banner.
 */
export function showIntro(): void {
  console.clear();
  p.intro(colors.inverse(' cc-profiles '));
}

/**
 * Show the outro message.
 * @param message - Optional custom message
 */
export function showOutro(message?: string): void {
  p.outro(message || 'Done!');
}

/**
 * Show an error message.
 * @param message - Error message
 */
export function showError(message: string): void {
  p.log.error(colors.error(message));
}

/**
 * Show a success message.
 * @param message - Success message
 */
export function showSuccess(message: string): void {
  p.log.success(colors.success(message));
}

/**
 * Show a warning message.
 * @param message - Warning message
 */
export function showWarning(message: string): void {
  p.log.warn(colors.warning(message));
}

/**
 * Show an info message.
 * @param message - Info message
 */
export function showInfo(message: string): void {
  p.log.info(message);
}

/**
 * Show a step message.
 * @param message - Step description
 */
export function showStep(message: string): void {
  p.log.step(message);
}

/**
 * Show a note with optional title.
 * @param message - Note content
 * @param title - Optional title
 */
export function showNote(message: string, title?: string): void {
  p.note(message, title);
}

/**
 * Show profile created success message with next steps.
 * @param name - Profile name
 * @param shellAlias - The shell alias code
 */
export function showProfileCreated(name: string, shellAlias: string): void {
  const rcFile = getShellRcFile();
  const message = `Profile ${formatProfileName(name)} created successfully!

${colors.dim('Add this to your shell config:')}

${colors.success(shellAlias)}

${colors.dim('Then run:')} ${colors.primary(`source ${rcFile}`)}
${colors.dim('And authenticate:')} ${colors.primary(name)} ${colors.dim('then')} ${colors.primary('/login')}`;

  p.note(message, 'Next Steps');
}

/**
 * Show message when no profiles exist.
 */
export function showNoProfiles(): void {
  p.log.warn('No profiles found. Create one with: cc-profiles create');
}

/**
 * Show message when Claude Code is not configured.
 */
export function showClaudeNotConfigured(): void {
  p.log.error(`Claude Code is not configured.

Run ${colors.primary('claude')} first to set up your main configuration.`);
}

/**
 * Show message when Claude Code is not installed.
 */
export function showClaudeNotInstalled(): void {
  p.log.error(`Claude Code is not installed.

Install it with: ${colors.primary('npm install -g @anthropic-ai/claude-code')}`);
}
