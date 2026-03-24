<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Skill Governance for companies.  
> Skill Discovery for teams.

Agent Skill Harbor catalogs Agent Skills (`SKILL.md`) across your GitHub organization and publishes a browsable internal catalog.

## Overview

- Governance: mark skills as recommended, discouraged, or prohibited
- Provenance: track copied or installed skills back to their origin
- Git-native: collected data is stored in `data/` as YAML/JSON and committed back to Git
- Backend-less: the catalog site is a prerendered web app
- Workflow-friendly: collection and post-collection processing run as separate jobs

Demo site:

- https://skill-mill.github.io/agent-skill-harbor-demo/

## Quick Start

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor

pnpm install
pnpm install --dir collector

# edit .env and set GH_TOKEN / GH_ORG if needed
pnpm collect
pnpm dev
```

`pnpm install` installs the root package (`agent-skill-harbor`) for CLI + web.  
`pnpm install --dir collector` installs the collector runtime used by `pnpm collect` and `pnpm post-collect`.

## CLI Commands

When installed, the main CLI is available as `harbor` or `agent-skill-harbor`.

| Command                    | Description                            |
| -------------------------- | -------------------------------------- |
| `harbor init [dir]`        | Scaffold a new project                 |
| `harbor setup <plugin-id>` | Scaffold optional plugin runtime files |
| `harbor build`             | Build the static catalog               |
| `harbor deploy <target>`   | Deploy the catalog                     |
| `harbor dev`               | Start the development server           |
| `harbor preview`           | Preview the built site                 |

Collection commands live in the collector runtime:

```bash
pnpm --dir collector exec harbor-collector collect --project-root .
pnpm --dir collector exec harbor-collector post-collect --project-root .
```

Generated projects already wrap these through root scripts:

- `pnpm collect`
- `pnpm post-collect`

## Organization Setup

1. Create a new project with `npx agent-skill-harbor init`.
2. Push it to a private repository in your organization.
3. Configure `GH_TOKEN` as a GitHub Actions secret.
4. Enable GitHub Pages or Cloudflare Pages.
5. Run the generated `CollectSkills` workflow once.

The generated `CollectSkills` workflow is a thin caller pinned to Harbor's reusable workflow at `wf-v0`.

Inside the reusable workflow:

- `collect` installs only `collector/` core dependencies and runs collection
- `post_collect` restores the collected artifact, installs `collector/` core dependencies again, then installs only enabled optional plugin manifests
- the final `data/` directory is committed back to the repository

This keeps GitHub collection and optional post-collect dependencies structurally separate.

See [Organization Setup](docs/01-organization-setup.md) for details.

## Project Structure

```text
my-skill-harbor/
├── .env
├── config/
│   ├── harbor.yaml
│   └── governance.yaml
├── collector/
│   ├── package.json
│   └── plugins/
│       └── <plugin-id>/
├── data/
│   ├── assets/
│   ├── collects.yaml
│   ├── plugins/
│   ├── skills.yaml
│   └── skills/
├── guide/
├── .github/workflows/
└── package.json
```

Notes:

- root `package.json` depends only on `agent-skill-harbor`
- `collector/package.json` is a Harbor-managed runtime manifest for `agent-skill-harbor-collector`
- optional plugin manifests and example user-defined plugins live under `collector/plugins/<plugin-id>/`

## Post-Collect Plugins

Built-in plugins are enabled from `config/harbor.yaml`.

Examples:

- `builtin.detect-drift`
- `builtin.notify-slack`
- `builtin.audit-promptfoo-security`
- `builtin.audit-skill-scanner`

Optional runtime files are scaffolded with `harbor setup`:

```bash
harbor setup example-user-defined-plugin
harbor setup builtin.audit-promptfoo-security
harbor setup builtin.audit-skill-scanner
```

Generated files go under `collector/plugins/<plugin-id>/`.

See [Post-Collect Plugins](docs/03-post-collect-plugins.md).

## Documentation

- [Organization Setup](docs/01-organization-setup.md)
- [Skill Catalog Guide](docs/02-skill-catalog.md)
- [Post-Collect Plugins](docs/03-post-collect-plugins.md)
- [Governance Guide](docs/04-governance-guide.md)
- [Local Development](docs/91-local-development.md)
- [Release](docs/92-release.md)

## License

MIT
