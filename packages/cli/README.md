<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/cli/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/cli/README_ja.md">ja</a></p>

# agent-skill-harbor

CLI package for Agent Skill Harbor.

## What This Package Includes

- The `harbor` / `agent-skill-harbor` executable
- Project scaffolding templates used by `harbor init`
- Command dispatch for the separately published collector, post-collect, and web runtime packages

## Quick Start

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
pnpm install
pnpm collect
pnpm dev
```

`pnpm collect` above is a script in the generated Skill Harbor project. In this repository, build the workspace packages first and then run the wrapper:

```bash
pnpm --dir packages/collector build
pnpm --dir packages/post-collect build
pnpm --dir packages/cli build
node packages/cli/dist/bin/cli.js collect
```

For local web checks in this repository:

```bash
pnpm --dir packages/web build
node packages/cli/dist/bin/cli.js build
node packages/cli/dist/bin/cli.js preview
```

The generated project installs runtime packages separately under `tools/harbor/*` so GitHub collection jobs do not need to install heavier `post-collect` dependencies.

## Runtime Packages

- [`agent-skill-harbor-collector`](https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/collector/README.md)
- [`agent-skill-harbor-post-collect`](https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/post-collect/README.md)
- [`agent-skill-harbor-web`](https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/web/README.md)

To run `post-collect` directly in this repository:

```bash
node packages/cli/dist/bin/cli.js post-collect
```

User-defined plugins are resolved from `plugins/<id>/index.mjs`, then `index.js`, then `index.ts`.
If a plugin needs its own runtime dependencies, add `plugins/<id>/package.json`.
Available scaffolds:

- `harbor gen example-user-defined-plugin`
- `harbor gen notify-slack`

For the full product overview and documentation, see the repository README:

- https://github.com/skill-mill/agent-skill-harbor?tab=readme-ov-file#agent-skill-harbor
