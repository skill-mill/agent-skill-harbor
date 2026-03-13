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
tsx cli/bin/cli.ts dev
```

The development server will start at `http://localhost:5173`.

`pnpm setup:dev` copies the following into the project root (all gitignored):

1. `cli/templates/init/.env.example` → `.env`
2. `cli/templates/init/config/*` → `config/`
3. `fixtures/config/*` → `config/` (overwrites with sample governance policies)
4. `fixtures/data/*` → `data/` (sample catalog and skill data)

### Commands

```bash
tsx cli/bin/cli.ts dev        # Start development server
tsx cli/bin/cli.ts build      # Build the catalog site via CLI
tsx cli/bin/cli.ts preview    # Preview built site
cd web && pnpm check          # Type check web package
cd web && pnpm lint           # Lint web package
pnpm format       # Format all files with Prettier
tsx cli/bin/cli.ts collect    # Collect skills (requires GH_TOKEN)
cd cli && pnpm build          # Build CLI package (after modifying bin/ or src/)
pnpm setup:dev                # Re-copy templates and fixtures
pnpm versions:check           # Validate cli/web/template version sync
```

### Project Structure

```
├── cli/
│   ├── bin/              # CLI entry point
│   ├── src/cli/          # CLI commands (init, collect, build, dev, preview)
│   └── templates/        # Project scaffold templates bundled into the CLI package
├── scripts/              # Development scripts (setup-dev, collect)
├── web/                  # SvelteKit frontend application
│   ├── src/lib/server/   # Server-side data loading (catalog, docs)
│   ├── src/routes/       # Pages (catalog, skill detail, graph, docs)
│   └── src/lib/i18n/     # Internationalization (en, ja)
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

### Package Layout

- **`agent-skill-harbor`**: The published CLI package rooted at `cli/`. It contains the `harbor` executable, project templates, and collector runtime.
- **`agent-skill-harbor-web`**: The published SvelteKit web package. It contains the frontend source, SvelteKit config, and web build dependencies.
- **Runtime dependency direction**: The CLI package depends on `agent-skill-harbor-web` and resolves the web build toolchain from the installed web package instead of bundling `web/` into the CLI tarball.
- **Dependency ownership**: Web UI and SvelteKit dependencies should be managed in `web/package.json`. CLI/runtime dependencies belong in `cli/package.json`, while the root `package.json` is workspace-only.

### Release Notes

- Publish order matters: release `agent-skill-harbor-web` first, then `agent-skill-harbor`.
- For the detailed release workflow, see [04-release.md](docs/04-release.md).
