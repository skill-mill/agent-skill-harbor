# Local Development

## For Generated Projects

After `harbor init`:

```bash
pnpm install
pnpm install --dir collector

pnpm collect
pnpm post-collect
pnpm dev
pnpm build
pnpm preview
```

These scripts expand to:

- `pnpm collect` → `pnpm --dir collector exec harbor-collector collect --project-root .`
- `pnpm post-collect` → `pnpm --dir collector exec harbor-collector post-collect --project-root .`
- `pnpm dev` / `pnpm build` / `pnpm preview` → root `harbor` commands

## For Contributors

### Prerequisites

- Node.js 24+
- pnpm 10+

### Getting Started

```bash
git clone https://github.com/skill-mill/agent-skill-harbor.git
cd agent-skill-harbor

pnpm install
pnpm --dir collector install
pnpm setup:dev

pnpm cli:build
pnpm --dir collector build
node dist/bin/cli.js dev
```

The development server starts at `http://localhost:5173`.

`pnpm setup:dev` prepares the repository root as a demo project by:

1. copying `templates/init/.env.example` to `.env.example` and `.env`
2. downloading demo `config/`, `data/`, and `guide/`

### Useful Commands

```bash
pnpm verify
pnpm --dir collector verify

pnpm build
pnpm cli:build
pnpm --dir collector build
pnpm storybook
pnpm storybook:build

node dist/bin/cli.js dev
node dist/bin/cli.js build
node dist/bin/cli.js preview

GH_TOKEN=$(gh auth token) pnpm --dir collector exec harbor-collector collect --project-root .
pnpm --dir collector exec harbor-collector post-collect --project-root . --collect-id <collect_id>
```

### Layout

```text
agent-skill-harbor/
├── bin/                  # harbor CLI entrypoint
├── src/                  # CLI + web sources
├── collector/            # collector + post-collect package
│   ├── bin/
│   ├── src/
│   └── plugins/
├── templates/            # init/setup templates
├── static/
├── guide/
├── docs/
├── config/
└── data/
```

### Architecture Notes

- root package (`agent-skill-harbor`) owns CLI + web
- `collector/` package (`agent-skill-harbor-collector`) owns collect + post-collect
- optional plugin manifests live under `collector/plugins/<plugin-id>/`
- collector core and optional plugin dependencies remain separate install surfaces
- built-in `notify-slack` is part of collector core

### Why `collect` and `post_collect` stay separate in workflows

The reusable workflow still uses two jobs:

- `collect`
- `post_collect`

This is intentional for:

- artifact boundary
- easier reruns of post-collect only
- clearer security separation between GitHub collection and optional plugin dependencies
