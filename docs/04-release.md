# Release

This document describes the release workflow for the published packages.

## Packages

- `agent-skill-harbor-web`: Published web package containing the SvelteKit app source and web build dependencies
- `agent-skill-harbor`: Published CLI package containing the `harbor` executable, templates, and collector runtime

## Release Strategy

- Release only the package that changed.
- If both packages changed, or if the CLI now requires a newer minimum web version, publish `agent-skill-harbor-web` first and `agent-skill-harbor` second.

The CLI package depends on `agent-skill-harbor-web`, but it now uses a broad semver range. You only need a coordinated two-package release when the CLI starts depending on a newer web capability that has not been published yet.

## Release Checklist

### Shared

1. Decide which package is being released.
2. Bump only that package version in its own `package.json`.
3. Update changelog entries as needed.

### Releasing `agent-skill-harbor-web`

```bash
pnpm install --no-frozen-lockfile
pnpm --dir web verify
pnpm --dir web build
# pnpm --filter agent-skill-harbor-web pack  # Only when changing files/README/package contents
pnpm --filter agent-skill-harbor-web publish --access public
git tag web-v<version>
```

### Releasing `agent-skill-harbor`

```bash
pnpm install --no-frozen-lockfile
pnpm --dir cli verify
pnpm --dir cli build
node cli/dist/bin/cli.js build
# pnpm --filter agent-skill-harbor pack  # Only when changing files/bin/templates/README
pnpm --filter agent-skill-harbor publish --access public
git tag cli-v<version>
```

### Releasing both packages

1. Release `agent-skill-harbor-web` first.
2. Release `agent-skill-harbor` second.
3. Create both tags after the published package set is ready to consume.

## Tagging

- Use package-specific git tags instead of a single repository-wide version tag.
- CLI releases use `cli-vX.Y.Z`.
- Web releases use `web-vX.Y.Z`.
- If both packages are released together, create both tags.

## Versioning Notes

- `cli/package.json` and `web/package.json` now version independently.
- `cli/templates/init/package.template.json` still uses `^{{PACKAGE_VERSION}}`, so generated projects always install the current CLI release line.
- The CLI depends on `agent-skill-harbor-web` with a broad `<1` range. Minor and patch web releases do not require a CLI release unless the CLI needs a newer minimum web version.

## Notes

- Web runtime dependencies belong in `web/package.json`.
- CLI-only runtime dependencies belong in `cli/package.json`.
