# cc-profiles

CLI tool for managing multiple Claude Code profiles with shared configuration and isolated authentication.

## Features

- **Create profiles** - Set up isolated Claude Code profiles with automatic symlinks to shared configuration
- **Managed shell aliases** - Automatically generates and updates shell functions for each profile
- **List profiles** - Display all profiles with authentication status
- **Remove profiles** - Clean up profiles and automatically remove shell aliases
- **Interactive UI** - Beautiful terminal interface using @clack/prompts
- **Multi-shell support** - Works with zsh, bash, and fish

## Installation

```bash
npm install -g cc-profiles
```

Or use directly with npx:

```bash
npx cc-profiles
```

## Prerequisites

Claude Code must be installed and configured before using cc-profiles:

```bash
npm install -g @anthropic-ai/claude-code
claude  # Run once to set up configuration
```

## Usage

### Interactive Mode

Run without arguments to open the interactive menu:

```bash
cc-profiles
```

### Commands

```bash
# Create a new profile
cc-profiles create work
cc-profiles create personal

# List all profiles
cc-profiles list
cc-profiles ls

# Remove a profile
cc-profiles remove work
cc-profiles rm personal
```

## How It Works

### Profile Creation

When you create a profile, cc-profiles:

1. Creates a new directory `~/.claude-{name}/`
2. Creates symlinks to shared configuration files:
   - `settings.json` - Your Claude Code settings
   - `stats-cache.json` - Usage statistics (unified across profiles)
   - `CLAUDE.md` - Your custom instructions
   - `agents/` - Custom agents
   - `commands/` - Custom commands
   - `plugins/` - Installed plugins
3. Automatically updates the shell aliases file
4. (First time) Offers to set up shell integration

### Managed Shell Aliases

cc-profiles uses a **managed aliases file** approach:

```
~/.zshrc (modified once)
├── ... your existing config ...
└── # cc-profiles shell integration
    [ -f ~/.cc-profiles-aliases.sh ] && source ~/.cc-profiles-aliases.sh

~/.cc-profiles-aliases.sh (auto-generated)
├── work() { ... }
├── personal() { ... }
└── cc-list() { ... }
```

**How it works:**

| Action | What happens |
|--------|--------------|
| First `cc-profiles create` | Adds source line to `.zshrc` (once) |
| `cc-profiles create foo` | Regenerates aliases file with new function |
| `cc-profiles remove foo` | Regenerates aliases file without that function |
| Open new terminal | All aliases are available automatically |

### Shell Support

| Shell | Config File | Aliases File | Integration |
|-------|-------------|--------------|-------------|
| zsh | `~/.zshrc` | `~/.cc-profiles-aliases.sh` | Adds source line |
| bash (macOS) | `~/.bash_profile` | `~/.cc-profiles-aliases.sh` | Adds source line |
| bash (Linux) | `~/.bashrc` | `~/.cc-profiles-aliases.sh` | Adds source line |
| fish | Auto-loads | `~/.config/fish/functions/cc-profiles.fish` | No config needed |

### Using Profiles

After creating a profile:

```bash
# Open a new terminal, or reload your shell config
source ~/.zshrc

# Start Claude with your profile
work

# First time? Authenticate inside Claude
/login

# List all available profiles
cc-list
```

### Configuration Sharing

All profiles share:
- Settings (`settings.json`)
- Usage statistics (`stats-cache.json`) - all profiles contribute to unified stats
- Custom instructions (`CLAUDE.md`)
- Agents, commands, and plugins

Each profile has isolated:
- Authentication credentials (`~/.claude-{name}.json`)
- Session history
- Conversation context

## File Locations

| File | Purpose |
|------|---------|
| `~/.cc-profiles.json` | Profile metadata |
| `~/.cc-profiles-aliases.sh` | Shell functions (auto-managed) |
| `~/.claude-{name}/` | Profile config directory |
| `~/.claude-{name}.json` | Profile credentials |

## Requirements

- Node.js 20.0.0 or higher
- Claude Code installed and configured

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js

# Watch mode
npm run dev

# Lint
npm run lint

# Test
npm test
```

## License

MIT
