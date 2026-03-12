# Local Development

## For Users (npm package)

If you created your project via `npx agent-skill-harbor init`:

```bash
pnpm install
pnpm dev          # Start development server
pnpm collect      # Collect skills from your org
pnpm build        # Build static site
pnpm preview      # Preview built site
```

These scripts call the `harbor` CLI under the hood.

## For Contributors (from source)

### Prerequisites

- Node.js 24+
- pnpm 10+

### Getting Started

```bash
git clone https://github.com/anthropics/agent-skill-harbor.git
cd agent-skill-harbor
pnpm install
pnpm setup:dev    # Copy templates and fixtures
# Edit .env: uncomment and set GH_TOKEN, GH_ORG
pnpm dev
```

The development server will start at `http://localhost:5173`.

`pnpm setup:dev` copies the following into the project root (all gitignored):

1. `templates/.env.example` → `.env`
2. `templates/config/*` → `config/`
3. `fixtures/config/*` → `config/` (overwrites with sample governance policies)
4. `fixtures/data/*` → `data/` (sample catalog and skill data)

### Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build web app
pnpm preview      # Preview built site
pnpm check        # Type check
pnpm lint         # Lint
pnpm format       # Format all files with Prettier
pnpm collect      # Collect skills (requires GH_TOKEN)
pnpm build:cli    # Build CLI (after modifying bin/ or src/)
pnpm setup:dev    # Re-copy templates and fixtures
```

### Project Structure

```
├── bin/                  # CLI entry point
├── src/cli/              # CLI commands (init, collect, build, dev, preview)
├── scripts/              # Development scripts (setup-dev, collect)
├── web/                  # SvelteKit frontend application
│   ├── src/lib/server/   # Server-side data loading (catalog, docs)
│   ├── src/routes/       # Pages (catalog, skill detail, graph, docs)
│   └── src/lib/i18n/     # Internationalization (en, ja)
├── templates/            # Project scaffold templates (for init command)
│   ├── .env.example      # Environment variable template
│   ├── config/           # Default settings files
│   └── .github/workflows/# GitHub Actions workflows
├── fixtures/             # Sample data for local development
│   ├── config/           # Sample governance policies
│   └── data/             # Sample catalog and skill data
├── config/               # Human-managed settings (gitignored, created by setup:dev)
├── data/                 # Machine-generated skill data (gitignored, created by setup:dev)
└── docs/                 # Documentation
```

### Key Architecture

- **`SKILL_HARBOR_ROOT` environment variable**: Controls where data/config/docs are read from. When using the CLI, this is automatically set to the user's project directory. For development, it falls back to the repository root.
- **`web/vite.config.ts`**: Injects `__PROJECT_ROOT__` as a compile-time constant from `SKILL_HARBOR_ROOT`.
- **`web/src/lib/server/catalog.ts`**: Reads `data/skills.yaml` and `data/skills/` at build time for prerendering.
- **`adapter-static`**: All pages are prerendered to static HTML at build time. No server runtime needed.
