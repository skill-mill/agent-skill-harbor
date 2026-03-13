# Changelog

## [0.8.1] - 2026-03-13

### Fixed

- GitHub Pages init workflow now installs `pnpm` via major-version pinning (`version: 10`) instead of requiring a stale exact version
- GitHub Pages init workflow now opts JavaScript actions into Node.js 24 to avoid the Node.js 20 deprecation path
- Init template now installs the current `agent-skill-harbor` release line instead of the stale `^0.1.0`

## [0.8.0] - 2026-03-12

### Added

- **Config page** with Harbor settings and Governance tabs, powered by Zod schemas
- README (EN/JA) displayed at `/docs/` as the first sidebar entry
- `manage-governance` and `manage-harbor-config` CLI skills with Zod schema references

### Changed

- Renamed `settings.yaml` to `harbor.yaml` for clarity
- Replaced monolithic `manage-skill` skill with focused `manage-governance` and `manage-harbor-config`
- Renumbered docs: governance guide → `02`, local development → `03`
- Removed trailing slashes from all routes (`trailingSlash: 'never'`)
- Improved README overview and simplified Organization Setup guide
- Updated agent-command-sync references to agent-skill-porter

### Removed

- Old screenshot files from `docs/`
- `manage-skill` skill (skills are managed by collect phase, not manually)

## [0.7.1] - 2026-03-12

### Fixed

- Stats page date formatting now respects the selected locale (EN/JA)

### Changed

- README screenshots updated to `docs/img/`, added Stats view, Stats and Graph displayed vertically

## [0.7.0] - 2026-03-12

### Added

- "By Origin" grouping in List view — resolves true origin by recursively following `_from` chains
- Origin table with tree-structured display (origin skill + derivative copies)
- `originTable` i18n keys (EN/JA)

### Changed

- Grouping toggle refactored from single boolean to exclusive mode (`repo` / `origin` / flat)
- Collect cron schedule changed from every 6 hours to weekly (Sunday 12:00 UTC)
- Japanese `repoTable.skills` label changed to "スキル数"
- `prepack` script added to auto-build CLI before publish/pack

## [0.6.0] - 2026-03-12

### Added

- **Stats view** with KPI cards, skill trend chart, and collection history table
- Dual-axis trend chart overlaying skill count and repo skill adoption rate
- `repos_with_skills` metric for tracking skill adoption across repositories
- Hover tooltips on trend chart data points with vertical guide line
- Owner filter on Graph view with URL parameter sync
- Retry with exponential backoff (up to 3 attempts) for GitHub API calls (500/502/503)
- Randomized footer taglines (5 candidates)
- Repository grouping in skills list page
- Separate `collect-history.yaml` for collection history tracking

### Changed

- Restructured `collect-history.yaml` to `collecting` + `statistics` (org/community breakdown) format
- Renamed `admin.yaml` to `settings.yaml`, added `included_extra_repos` config
- Stats tab moved to leftmost position in tab bar
- Repo KPI shows adoption rate format (`repos_with_skills / total (pct%)`)
- Graph force layout tuned: link distance scales with node degree, stronger charge repulsion
- Improved error messages in collector: shows HTTP status instead of raw HTML
- `checkRateLimit` wrapped in try-catch to avoid blocking on 503

### Fixed

- Owner filter now preserved when navigating to Graph view via tabs
- List view defaults to group-by-repo; tab toggle no longer requires double click

## [0.5.2] - 2026-03-12

### Fixed

- Restore trailing spaces in README taglines for Markdown line breaks

## [0.5.1] - 2026-03-12

### Changed

- Updated tagline and package description

## [0.5.0] - 2026-03-12

### Added

- FileTree component for skill detail page file browser
- Tooltip for truncated descriptions in list view
- Collection summary output with repo/skill/file counts and elapsed time
- Collection metadata (`meta` block) saved to skills.yaml

### Changed

- Renamed `catalog.yaml` to `skills.yaml`
- Renamed detail field "Origin" to "Owner", merged Source History into Details section
- `_from` frontmatter standardized as scalar (`owner/repo@sha`), with array backward compatibility
- Removed redundant `files` field from skills.yaml (derived from filesystem cache)
- Truncate long skill names in list view with max width

## [0.4.0] - 2026-03-12

### Added

- Tab-based view switching (Card / List / Graph)
- List (table) view with sortable columns and Repository column
- `reroute` hook to serve catalog on both `/` and `/skills/`
- Cloudflare Pages deploy command and workflow

### Changed

- Catalog URL restructured from `/` to `/skills/`
- Renamed "Origin" filter/column to "Owner"
- Removed platform display from Card and detail views
- Removed Graph link from header navigation
- Replaced page title with inline skill count in filter row
- Split templates into `init/` and `deploy/` subdirectories
- Moved collect runtime into dist entrypoint

## [0.3.1] - 2026-03-10

### Fixed

- Markdown links in skill detail pages

## [0.3.0] - 2026-03-10

### Added

- Public origin repository collection

## [0.2.0] - 2026-03-10

### Added

- CLI commands (`init`, `collect`, `build`, `dev`, `preview`)
- Interactive 3D knowledge graph view
- Dark mode with light/dark/system toggle
- i18n support (EN/JA)
- Skill detail pages with governance badges and provenance tracking
- Dynamic docs routing
- 404 error page
- Graph print/export feature
- `excluded_repos` setting in settings.yaml
- ESLint flat config

### Changed

- Renamed product from Skill Warehouse to Agent Skill Harbor
- CLI command renamed to `harbor`
- Replaced build:catalog with SvelteKit server-side catalog loading
- Various data model improvements (tree_sha, \_from tracking, timestamps)

## [0.1.0] - 2026-03-09

### Added

- Initial MVP implementation
