# Changelog

## [Unreleased]

## [cli 0.15.2] / [collector 0.15.2] - 2026-03-26

### Changed

- Simplified generated project execution by treating `collect`, `post-collect`, `dev`, `build`, and `preview` as project-local npm scripts that call packaged runtime entrypoints directly, while narrowing the public CLI surface to `init` and `setup`
- Reworked the collector and web runtime entry layout around `src/runtime/*` modules and shared runtime helpers so internal execution no longer depends on `cli/commands` wrappers
- Updated reusable and generated GitHub workflows to call installed runtime modules directly, and changed the Cloudflare Pages deploy template to run `pnpm build` followed by `wrangler pages deploy`

### Fixed

- Fixed generated projects resolving the wrong project root during collect/post-collect runs, so `config/harbor.yaml` is read from the actual project and missing config now fails fast with a clear error
- Fixed init quick-start guidance and generated workflow/script templates so the documented install, collect, and preview flows match the current package layout

## [cli 0.15.1] / [collector 0.15.1] - 2026-03-25

### Added

- Added Storybook for the web application with light/dark theme switching and initial component stories for skill and config screens

### Changed

- Changed `builtin.notify-slack` to require `HARBOR_SLACK_WEBHOOK_URL` for live sends, updated templates/docs to prefer env-based secret handling, and made `post-collect` load `.env`
- Reorganized Storybook stories under grouped `Components/Skills/*` and `Components/Config/*` sections to make the UI catalog easier to expand

### Fixed

- Fixed the packaged Guide default content so `/guide` no longer falls back to the repository root `README`, and `pnpm build` succeeds again
- Fixed collector runtime settings loading by removing repeated config reads, centralizing defaults, and trimming remaining wrapper/parsing duplication
- Fixed small documentation inconsistencies including the collector README language links

## [cli 0.15.0] / [collector 0.15.0] - 2026-03-25

### Added

- Added richer `builtin.notify-slack` reporting with configurable highlighted intents and clearer debug output for post-collect notification flows
- Added small shared collector/runtime utilities for frontmatter parsing, GitHub origin detection, YAML array loading, and label-intent normalization to reduce duplicated logic

### Changed

- **Starting with 0.15.0, the publishable package layout changed from four packages (`cli`, `collector`, `post-collect`, `web`) to two packages: the root `agent-skill-harbor` package and `collector/`.** The older `packages/*` split was removed, and related templates, workflows, and docs were updated accordingly
- Reorganized root scripts around `dev` / `build` / `preview` for web flows, `cli:build` for the packaged CLI build, and `typecheck` / `verify` / `fix` for repository maintenance
- Updated contributor and release documentation to match the current package layout, command names, and local development flow

### Fixed

- Fixed duplicated parsing and validation logic across collect and post-collect runtimes by moving shared implementations into common modules
- Fixed Slack notification summaries and highlight counting so built-in plugin results are reported more consistently
- Fixed several stale command references in setup and release guidance so they match the current script layout

## [cli 0.14.3] - 2026-03-23

### Fixed

- Fixed CLI package-root resolution to walk up the directory tree instead of checking fixed relative depths, so `init` and `gen` work correctly when tsup inlines `paths.ts` into deeper entry files with `splitting: false`

## [cli 0.14.2] / [collector 0.14.2] / [post-collect 0.14.2] / [web 0.14.2] - 2026-03-23

### Fixed

- Fixed `collector` and `post-collect` packages publishing `workspace:*` dependency on `shared-internal` by bundling it via tsup `noExternal` and moving it to `devDependencies`

## [cli 0.14.1] / [collector 0.14.1] / [post-collect 0.14.1] / [web 0.14.1] - 2026-03-23

### Added

- Added shared view transitions in the web UI for skill titles, cross-page view tabs, and the owner filter so navigation between card/list/stats/graph views keeps more visual context
- Added animated header toggle icons, a shared `ToggleGroup` implementation, and shared `OwnerFilter` / `PillSelectFilter` components to reduce duplicated UI logic in the web app

### Changed

- Moved the monorepo packages under `packages/{cli,collector,post-collect,shared-internal,web}` and updated workspace scripts, repository paths, templates, and docs to match the new layout
- Standardized package scripts around `format`, `format:check`, `lint`, `lint:check`, `check`, `test`, `build`, and `verify` so package-local maintenance flows are consistent across the repository
- Pinned external GitHub Actions in Harbor's reusable workflow and generated deploy workflow templates by commit SHA, moved artifact actions onto their reviewed newer major lines, and introduced an update flow that uses `actions-up` for minor-safe action bumps while keeping `pnpm/action-setup` as an explicit manual review item
- Removed stale CLI runtime wrappers and duplicated runtime code, refactored stats aggregation into shared helpers, and introduced a small persistent-store helper for web state such as theme/background/locale
- Centralized repeated TypeScript ESLint settings in a shared root config helper instead of maintaining identical per-package configs
- Added `packages/shared-internal/` as a private workspace package so `collector` and `post-collect` share `catalog-store` and `resolved-from` from one source instead of keeping duplicate runtime copies
- Updated local development and release docs to cover `packages/shared-internal/`, package-local `verify` flows, and the current monorepo package boundaries more clearly

### Fixed

- Fixed CLI package-root detection so installed `init` / `gen` commands resolve templates correctly from both source execution and built `dist/` output
- Fixed package tarball contents and release docs so package publishes stay clean and current package-specific publish steps are documented accurately
- Fixed the ripple background so ambient ripple generation pauses while the browser tab is hidden instead of bursting on return

## [cli 0.14.0] / [collector 0.14.0] / [post-collect 0.14.0] / [web 0.14.0] - 2026-03-20

### Added

- Added the built-in `builtin.audit-skill-scanner` post-collect plugin for org-owned skills, including local `skill-scanner` CLI execution, HTML/SARIF/JSON secondary artifacts, and skill detail links
- Added top-level `sub_artifacts` support to plugin output so secondary files can be described once per plugin and linked from the web UI without per-skill path duplication
- Added a WebGL water ripple background effect as a switchable alternative to the existing starfield, with a three-way toggle (none / stars / ripples) in the header that persists via localStorage

### Changed

- Replaced the generated `CollectSkills` workflow body with a thin caller that uses Harbor's published reusable workflow pinned to `wf-v0`, and made the reusable workflow auto-install `skill-scanner` only when `builtin.audit-skill-scanner` is enabled
- Moved `builtin.audit-promptfoo-security` secondary report links to the new `sub_artifacts` convention and aligned plugin detail rendering around artifact file names
- Updated built-in plugin docs, init template examples, and package READMEs to document `skill-scanner`, secondary artifact conventions, and Python CLI requirements
- Removed the older `builtin.audit-static` built-in plugin now that `builtin.audit-skill-scanner` covers the security-audit role more clearly
- Changed secondary artifact storage from `data/plugin-reports/` to `data/assets/plugins/`, copied `data/assets/` into the web output during build, and documented the `harbor dev` staging path for source-repo development
- Renamed the example user-defined plugin scaffold to `example-user-defined-plugin`, changed its suggested short label to `Example`, and made its demo labels neutral (`Ex01` / `Ex02`)
- Ordered plugin labels in filters and stats by `label_intents` key order, expanded stats trend charts to support up to 7 labels, and refined marker shapes for higher-cardinality plugins
- Added counts to skill list filter options and included plugin secondary artifact links in generated GitHub issue bodies for skill detail pages

### Fixed

- Excluded `docs/samples/` from workspace Prettier checks so local sample outputs do not fail repository formatting checks
- Fixed implicit `any` types in `web/src/lib/components/StarsBackground.svelte` so `web check` passes again
- Fixed plugin output YAML folding so long `collect_id` values no longer break latest-result resolution in the web UI

## [cli 0.13.0] / [collector 0.13.0] / [post-collect 0.13.0] / [web 0.13.0] - 2026-03-19

### Added

- Added the built-in `builtin.audit-promptfoo-security` post-collect plugin, including HTML report generation, report links in skill detail pages, and docs for built-in plugin behavior
- Added install-surface separation with published `agent-skill-harbor-collector`, `agent-skill-harbor-post-collect`, and `agent-skill-harbor-web` runtime packages alongside the thin `agent-skill-harbor` wrapper
- Added `collect --force` to refresh repositories and skill files even when catalog SHAs are unchanged

### Changed

- Reworked init templates and GitHub workflows to install role-specific Harbor packages from `tools/harbor/{collector,post-collect,web}`
- Made collect prune stale repository data when repositories fall out of scope due to excludes or origin resolution changes
- Improved local development and release docs to reflect the split runtime packages and wrapper-based source-repo workflows

### Fixed

- Fixed project-root resolution across collect and post-collect so source-repo execution reads and writes the intended `config/` and `data/` directories
- Fixed wrapper command argument forwarding so delegated commands receive their own flags correctly
- Disabled `promptfoo` telemetry and update checks during Harbor-driven security audits

## [cli 0.12.0] / [web 0.11.0] - 2026-03-16

### Added

- Added normalized `resolved_from` provenance tracking so collected skills can trace copied origins from `_from` frontmatter or GitHub-based `skills-lock.json`
- Added a Skill Catalog guide that documents the catalog pages and provenance tracking behavior

### Changed

- Reduced `data/skills.yaml` to catalog metadata only and stopped copying each skill frontmatter into the YAML snapshot
- Updated fixture catalog snapshots to match the slimmer `skills.yaml` format and include `resolved_from` where available

## [cli 0.11.1] / [web 0.10.0] - 2026-03-15

### Changed

- Renamed the init workflow template from `CollectAndAuditSkills` to `CollectSkills` so collection remains the stable entry point as post-collect processing grows
- Changed the default `audit.engines` scaffold to `[]` and kept `builtin.static` commented out because it is still alpha and should stay opt-in by default

## [cli 0.11.0] / [web 0.10.0] - 2026-03-15

### Added

- Added a new `audit` pipeline to the CLI, including static and user-defined engines, audit reports, history linking, and workflow templates
- Added audit reporting to the web UI, including audit summaries in Stats and audit settings in the Config > Harbor tab
- Added optional raw config file panels to the Config tabs so `harbor.yaml` and `governance.yaml` can be inspected in-place

### Changed

- Refined the built-in static audit engine to use `pass / info / warn / fail`, reduced false-positive severity, and renamed the built-in engine id to `builtin.static`
- Improved the Harbor config tab with YAML-key help popovers, derived label/help key conventions, and a configurable UI title
- Improved mobile responsiveness for the header, tab bar, card list, and graph detail panel

## [cli 0.10.4] / [web 0.9.3] - 2026-03-14

### Fixed

- GitHub Pages deploy workflow template now creates the Pages artifact manually instead of using `upload-pages-artifact`, which excludes `.github` (all versions) and other dotfiles (`v4`) from the tar archive

### Changed

- List view default grouping changed from Repository to Origin

## [web 0.9.2] - 2026-03-14

### Fixed

- Broadened the Vite dev server filesystem allow list so `pnpm dev` works again when the installed web package is resolved from pnpm's nested store paths

### Changed

- Tightened the root workspace formatter to repository-level shared files only, leaving package-local formatting to `packages/cli/` and `packages/web/`

## [cli 0.10.1] / [web 0.9.1] - 2026-03-14

### Changed

- Added package-local `format`, `format:check`, `lint`, `lint:check`, and `verify` workflows so `packages/cli/` and `packages/web/` can be checked and fixed independently from the workspace root
- Updated release docs to use package-specific `verify` steps, optional `pack` guidance, and package-specific git tags (`cli-vX.Y.Z`, `web-vX.Y.Z`)
- Refined package-local formatting targets and fixed small CLI/web source issues uncovered by the new static checks
- Updated contributor docs and README notes to match the independent-package release workflow

## [0.10.0] - 2026-03-14

### Changed

- Simplified releases by versioning `agent-skill-harbor` and `agent-skill-harbor-web` independently instead of forcing lockstep bumps
- Removed repository-wide version sync scripts and package lifecycle hooks tied to cross-package version alignment
- Relaxed the CLI dependency on `agent-skill-harbor-web` to a broad `<1` range so minor and patch web releases do not require a CLI release
- Updated contributor and release docs to describe package-specific releases instead of synchronized dual-package releases

## [0.9.0] - 2026-03-14

### Added

- Added Japanese README support for the published `agent-skill-harbor` CLI package

### Changed

- Moved the published CLI package into `packages/cli/` so the repository now has symmetric `packages/cli/` and `packages/web/` package roots
- Reduced the root workspace scripts to repository-level maintenance tasks and updated contributor docs to run package-local commands from `packages/cli/` and `packages/web/`
- Renamed the CLI package build script to `build` and simplified version hooks so the init template stays a checked placeholder instead of a synced output

## [0.8.7] - 2026-03-14

### Fixed

- Guide markdown links now preserve `paths.base` during rendering so GitHub Pages prerender does not fail on `/guide` links

## [0.8.6] - 2026-03-14

### Added

- Bundled default Guide pages in `agent-skill-harbor-web`, with project-level `guide/` overrides and `guide/.gitkeep` scaffolding

### Changed

- Renamed the in-app Docs section to Guide and moved its routes from `/docs` to `/guide`
- Simplified the init template README to a minimal Quick Start link so copied docs stay lightweight

## [0.8.5] - 2026-03-14

### Fixed

- Docs dynamic routes now use `prerender = 'auto'` so `/docs/[slug]` no longer fails builds as an unseen prerenderable route

## [0.8.4] - 2026-03-14

### Changed

- Skill detail heading IDs now use `github-slugger` with plain-text heading extraction to better match GitHub anchor generation
- Prerender missing-id handling is now downgraded to warnings instead of build-stopping errors

### Fixed

- External `SKILL.md` files with GitHub-style self-fragment links no longer fail static builds when their anchors differ slightly from local rendering

## [0.8.3] - 2026-03-13

### Changed

- Init workflow templates now keep explicit `pnpm` major-version pinning without the temporary Node 24 migration env flag
- Published `agent-skill-harbor-web` metadata now includes npm description, keywords, and license fields

### Fixed

- Skill detail heading IDs now match GitHub-style anchor links for headings containing symbols such as `&`

## [0.8.2] - 2026-03-13

### Added

- Release documentation split into dedicated `04-release` docs (EN/JA)
- Internal npm README files for the published `agent-skill-harbor-web` package
- `versions:sync` and `versions:check` scripts to keep root, web, and init template versions aligned

### Changed

- Split the published web runtime into `agent-skill-harbor-web` and made the CLI depend on it
- Updated local development docs to explain package ownership and publish order
- Added version lifecycle hooks around `pnpm version` and `prepack`

### Fixed

- `harbor build`, `harbor dev`, and `harbor preview` now resolve Vite from the installed web package instead of a missing bundled path
- Skill detail prerendering now works when building without crawled skill entries present in the source repository

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
