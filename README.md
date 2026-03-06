<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Know what your agents know.

Internal agent skill catalog and governance for organizations.

## Screenshots

| Skill Catalog | Skill Detail |
|:---:|:---:|
| ![Skill Catalog](docs/agent-skill-harbor-screenshot02.jpeg) | ![Skill Detail](docs/agent-skill-harbor-screenshot01.jpeg) |

## Overview

Agent Skill Harbor collects Agent Skills (SKILL.md) from your GitHub Organization's repositories, provides governance controls, and serves a browsable catalog via GitHub Pages.

- No database — Data stored as YAML/JSON in Git
- No backend — Frontend-only web app (SvelteKit, prerendered)
- GitHub-native — GitHub Actions for collection, GitHub Pages for hosting
- Traceable — Track the origin and provenance of every skill, even those installed from external sources

## Quick Start

```bash
pnpm install
pnpm dev
```

See [Local Development](docs/02-local-development.md) for build commands, skill collection, and project structure.

## Organization Setup

1. Clone this repository privately into your organization
2. Configure GitHub repository secrets (`ORG_GITHUB_TOKEN`)
3. Enable GitHub Pages (Settings > Pages > Source: GitHub Actions)
4. Trigger the "Collect Skills" workflow for initial collection

See [Organization Setup Guide](docs/01-organization-setup.md) for detailed instructions.

## Skill Provenance Tracking

Using [agent-command-sync](https://github.com/hatappo/agent-command-sync) (`acs`) to install and manage skills automatically records the `_from` history in SKILL.md frontmatter, enabling your organization to trace the origin of every skill.

## Documentation

- [Organization Setup](docs/01-organization-setup.md)
- [Local Development](docs/02-local-development.md)
- [Governance Guide](docs/03-governance-guide.md)

## License

MIT
