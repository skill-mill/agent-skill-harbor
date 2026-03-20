<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Skill Governance for companies.  
> Skill Discovery for teams.

Agent skill catalog and governance tool for organizations.

## Screenshots

|                                                             Card View                                                              |                                                             List View                                                              |
| :--------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------: |
| ![Card View](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-card.png) | ![List View](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-list.png) |

### Stats View

![Stats View](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-stats.png)

### Graph View

![Graph View](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-graph.gif)

## Overview

Agent Skill Harbor catalogs every Agent Skill (SKILL.md) across your GitHub Organization and serves a browsable catalog within your organization via GitHub Pages or Cloudflare Pages.

- Governance — Flag prohibited skills and promote recommended ones to your team
- Skill Traceability — Track the origin and provenance of every skill, including externally installed ones
- No database — Data stored as YAML/JSON in Git
- No backend — Frontend-only web app (SvelteKit, prerendered)
- GitHub-native — GitHub Actions for collection, GitHub Pages or Cloudflare Pages for hosting

Demo site:

- https://skill-mill.github.io/agent-skill-harbor-demo/

## Quick Start

### Using npm package (Recommended)

```bash
# Scaffold a new project
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor

# Edit .env: uncomment and set GH_TOKEN and GH_ORG
# Or use gh CLI: GH_TOKEN=$(gh auth token) pnpm collect

# Install dependencies
pnpm install

# Collect skills from your organization
pnpm collect

# Start development server
pnpm dev
```

## CLI Commands

The application is managed via a CLI that supports scaffolding, data collection, building, and deployment. In production, all CLI commands are executed via GitHub Actions.

When installed as a dependency, the CLI is available as `harbor` or `agent-skill-harbor`:

| Command                                  | Description                                           |
| ---------------------------------------- | ----------------------------------------------------- |
| `harbor init [dir]`                      | Scaffold a new project                                |
| `harbor gen example-user-defined-plugin` | Generate the example user-defined post-collect plugin |
| `harbor collect`                         | Collect skills from GitHub organization               |
| `harbor post-collect`                    | Run post-collect plugins                              |
| `harbor build`                           | Build the static site                                 |
| `harbor deploy <target>`                 | Deploy the built catalog                              |
| `harbor dev`                             | Start development server                              |
| `harbor preview`                         | Preview the built site                                |

### Build options

```bash
# Set base path for GitHub Pages deployment
harbor build --base=/my-repo-name
```

## Organization Setup

1. Create a new project with `npx agent-skill-harbor init`
2. Configure GitHub repository secrets (`GH_TOKEN`)
3. Enable GitHub Pages (Settings > Pages > Source: GitHub Actions)
4. **Important:** Set Pages visibility to **Private** to restrict access to organization members only (requires GitHub Enterprise Cloud)
5. Trigger the `CollectSkills` workflow for initial collection
6. The generated `CollectSkills` workflow is a thin caller pinned to Harbor's published reusable workflow at `wf-v0`
7. The reusable workflow runs `collect`, `post-collect`, and commit/push as separate jobs internally
8. The deploy workflow installs only `tools/harbor/web` and runs automatically after `CollectSkills` succeeds

See [Organization Setup Guide](docs/01-organization-setup.md) for detailed instructions.

## Project Structure (User Project)

```
my-skill-harbor/
├── .env                    # GitHub token and org config
├── config/
│   ├── harbor.yaml         # Collector and catalog settings
│   └── governance.yaml     # Skill usage policies
├── plugins/                # Optional user-defined post-collect plugins
├── tools/
│   └── harbor/
│       ├── collector/      # Scoped install surface for collect workflow
│       ├── post-collect/   # Scoped install surface for post-collect workflow
│       └── web/            # Scoped install surface for build/deploy workflow
├── data/                   # Generated by collect (Git-managed)
│   ├── assets/             # Static files copied into the web build output
│   ├── collects.yaml       # Collection history
│   ├── plugins/            # Generated post-collect plugin outputs
│   ├── skills.yaml         # Skill metadata
│   └── skills/             # Cached SKILL.md files
├── .github/workflows/      # GitHub Actions (collect + deploy)
└── package.json            # local-dev convenience install (all Harbor packages)
```

## Skill Provenance Tracking

Harbor can trace skill provenance when the downloaded skill includes copy-source metadata.

The primary integration is [agent-skill-porter](https://github.com/skill-mill/agent-skill-porter), which records `_from` in skill frontmatter. Harbor also supports GitHub-based `skills-lock.json` metadata written by [agent-skills](https://github.com/vercel-labs/skills) / `vercel-labs/agent-skills`.

See [Skill Catalog Guide](docs/02-skill-catalog.md) for catalog pages and provenance behavior.

## Documentation

- [Organization Setup](docs/01-organization-setup.md)
- [Skill Catalog Guide](docs/02-skill-catalog.md)
- [Post-Collect Plugins](docs/03-post-collect-plugins.md)
- [Governance Guide](docs/04-governance-guide.md)
- [Local Development](docs/91-local-development.md)
- [Release](docs/92-release.md)

## License

MIT
