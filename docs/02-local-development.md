# Local Development

## Prerequisites

- Node.js 22+
- pnpm 10+

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The development server will start at `http://localhost:5173`.

## Build

```bash
# Build everything (web)
pnpm run build
```

## Skill Collection

To collect skills from your organization's repositories locally:

```bash
# Set required environment variables
export GITHUB_TOKEN=your_token
export GH_ORG=your_org

# Run skill collection
pnpm run collect
```

## Project Structure

```
├── config/               # Human-managed configuration
│   ├── admin.yaml        # Application settings
│   └── governance.yaml   # Governance policy definitions
├── data/                 # Machine-generated skill data
│   ├── catalog.yaml      # Skill catalog metadata
│   └── skills/           # Collected SKILL.md files
├── scripts/              # Collection and build scripts
├── web/                  # SvelteKit frontend application
└── .github/workflows/    # GitHub Actions (collect + deploy)
```

### Key Directories

- **config/**: Human-edited configuration files. `admin.yaml` controls application settings (e.g., fresh period, fork exclusion). `governance.yaml` defines per-skill governance policies.
- **data/**: Machine-generated data. `catalog.yaml` holds the metadata for all collected skills. `skills/` contains cached SKILL.md files organized by platform/owner/repo.
- **scripts/**: The `collect-org-skills.ts` script uses the GitHub API to scan all org repositories for SKILL.md files.
- **web/**: SvelteKit application using adapter-static for prerendering. All pages are generated at build time and served as static HTML.
