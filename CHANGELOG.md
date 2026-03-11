# Changelog

## [Unreleased]

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
- `exclude_repos` setting in admin.yaml
- ESLint flat config

### Changed
- Renamed product from Skill Warehouse to Agent Skill Harbor
- CLI command renamed to `harbor`
- Replaced build:catalog with SvelteKit server-side catalog loading
- Various data model improvements (tree_sha, \_from tracking, timestamps)

## [0.1.0] - 2026-03-09

### Added
- Initial MVP implementation
