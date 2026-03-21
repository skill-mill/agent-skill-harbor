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
git clone https://github.com/skill-mill/agent-skill-harbor.git
cd agent-skill-harbor
pnpm install
pnpm setup:dev    # Create .env and pull demo config/data/guide
# Edit .env: uncomment and set GH_TOKEN, GH_ORG
pnpm --dir packages/collector build
pnpm --dir packages/post-collect build
pnpm --dir packages/cli build
pnpm --dir packages/web build
node packages/cli/dist/bin/cli.js dev
```

The development server will start at `http://localhost:5173`.

`pnpm setup:dev` prepares the project root as follows (all generated folders are gitignored):

1. `packages/cli/templates/init/.env.example` → `.env`
2. Download the `skill-mill/agent-skill-harbor-demo` archive from GitHub
3. Copy `config/` from the demo repo → `config/`
4. Copy `data/` from the demo repo → `data/`
5. Copy `guide/` from the demo repo → `guide/`

This command requires network access.

### Commands

```bash
node packages/cli/dist/bin/cli.js dev       # Start development server
node packages/cli/dist/bin/cli.js build     # Build the catalog site via CLI
node packages/cli/dist/bin/cli.js preview   # Preview built site
cd packages/web && pnpm check          # Type check web package
cd packages/web && pnpm lint           # Lint web package
pnpm format       # Format all files with Prettier
pnpm --dir packages/collector build    # Rebuild collect package after changing packages/collector/
pnpm --dir packages/post-collect build # Rebuild post-collect package after changing packages/post-collect/
pnpm --dir packages/cli build          # Rebuild wrapper CLI after changing packages/cli/
pnpm --dir packages/web build          # Rebuild web package after changing packages/web/
GH_TOKEN=$(gh auth token) node packages/cli/dist/bin/cli.js collect
node packages/cli/dist/bin/cli.js post-collect --collect-id <collect_id>
pnpm setup:dev                # Refresh local demo config/data/guide
```

The demo data includes `data/collects.yaml`, `data/skills.yaml`, and sample plugin outputs from the demo repository.

When running the built CLI from the source repository, execute it from the repository root so `config/`, `data/`, and `guide/` resolve correctly.

### Typical Verification Flow

```bash
cd /Users/fumi/ws/hobby/agent-skill-harbor
pnpm install
pnpm setup:dev
pnpm --dir packages/collector build
pnpm --dir packages/post-collect build
pnpm --dir packages/cli build
pnpm --dir packages/web build

GH_TOKEN=$(gh auth token) node packages/cli/dist/bin/cli.js collect --force
grep -m1 '^  collect_id:' data/collects.yaml
node packages/cli/dist/bin/cli.js post-collect --collect-id <collect_id>
node packages/cli/dist/bin/cli.js build
node packages/cli/dist/bin/cli.js dev
node packages/cli/dist/bin/cli.js preview
```

Use this flow when you want to validate the full collector -> post-collect -> web pipeline from the source repository. Use `dev` when you want to inspect the live development server, and `preview` when you want to inspect the built output.

### Note: `harbor dev` vs `pnpm --dir packages/web dev`

When developing from the source repository, prefer:

```bash
node packages/cli/dist/bin/cli.js dev
```

instead of:

```bash
pnpm --dir packages/web dev
```

The wrapper-based `harbor dev` path stages `data/assets/` into `packages/web/static/assets/` before starting Vite so plugin secondary artifacts are available during development and prerendering. Running Vite directly from `packages/web/` skips that staging step and can lead to missing or stale asset links.

Current limitation:

- `pnpm --dir packages/web dev` is still not a supported development path because asset staging currently lives in the Harbor wrapper entrypoint. Moving that staging into the web package itself remains a future improvement.

### Project Structure

```
├── packages/collector/             # Published collect runtime package
├── packages/cli/
│   ├── bin/              # Thin harbor wrapper
│   ├── src/cli/          # init/gen and command dispatch
│   └── templates/        # Project scaffold templates bundled into the wrapper package
├── packages/post-collect/         # Published post-collect runtime package
├── scripts/              # Development scripts (setup-dev, collect)
├── packages/web/         # SvelteKit frontend application
│   ├── src/cli/          # build/dev/preview/deploy command entrypoints
│   ├── src/lib/server/   # Server-side data loading (catalog, docs)
│   ├── src/routes/       # Pages (catalog, skill detail, graph, docs)
│   └── src/lib/i18n/     # Internationalization (en, ja)
├── guide/                # Demo guide content pulled by setup:dev
├── config/               # Human-managed settings (gitignored, created by setup:dev)
├── data/                 # Machine-generated skill data (gitignored, created by setup:dev)
└── docs/                 # Documentation
```

### Key Architecture

- **`SKILL_HARBOR_ROOT` environment variable**: Controls where data/config/docs are read from. When using the CLI, this is automatically set to the user's project directory. For development, it falls back to the repository root.
- **`packages/web/vite.config.ts`**: Injects `__PROJECT_ROOT__` as a compile-time constant from `SKILL_HARBOR_ROOT`.
- **`packages/web/src/lib/server/catalog.ts`**: Reads `data/skills.yaml` and `data/skills/` at build time for prerendering.
- **`adapter-static`**: All pages are prerendered to static HTML at build time. No server runtime needed.

### Package Layout

- **`agent-skill-harbor`**: Thin published wrapper package rooted at `packages/cli/`. It provides the `harbor` executable, `init`, `gen`, templates, and command dispatch.
- **`agent-skill-harbor-collector`**: Published collect runtime package rooted at `packages/collector/`.
- **`agent-skill-harbor-post-collect`**: Published post-collect runtime package rooted at `packages/post-collect/`. Heavy dependencies such as `promptfoo` live here.
- **`agent-skill-harbor-web`**: Published SvelteKit web package rooted at `packages/web/`. It also owns `build`, `dev`, `preview`, and `deploy`.
- **Install surface split**: Generated projects keep `tools/harbor/collector`, `tools/harbor/post-collect`, and `tools/harbor/web` so workflows can install only the dependencies they need.
- **Dependency ownership**: Web UI and SvelteKit dependencies belong in `packages/web/package.json`. Collect-only runtime dependencies belong in `packages/collector/package.json`. Post-collect-only runtime dependencies belong in `packages/post-collect/package.json`. Wrapper-only runtime dependencies belong in `packages/cli/package.json`. The root `package.json` is workspace-only.

### Release Notes

- Release only the package that changed.
- If both packages are released together, publish `agent-skill-harbor-web` first and `agent-skill-harbor` second.
- For the detailed release workflow, see [92-release.md](92-release.md).
