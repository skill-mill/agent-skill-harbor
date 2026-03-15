<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# agent-skill-harbor

CLI package for Agent Skill Harbor.

## What This Package Includes

- The `harbor` / `agent-skill-harbor` executable
- Project scaffolding templates used by `harbor init`
- Collector and build runtime for Skill Harbor projects

## Quick Start

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
pnpm install
pnpm collect
pnpm dev
```

`pnpm collect` above is a script in the generated Skill Harbor project. In this CLI package repository itself, run the collector with either:

```bash
pnpm --dir cli build
node cli/dist/bin/cli.js collect
```

or, for local development without a build:

```bash
node --import tsx cli/bin/cli.ts collect
```

For the full product overview and documentation, see the repository README:

- https://github.com/skill-mill/agent-skill-harbor?tab=readme-ov-file#agent-skill-harbor
