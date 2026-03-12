# Changelog

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
