# Release

This document describes the release workflow for the published packages.

## Packages

- `agent-skill-harbor`: Thin published wrapper package containing the `harbor` executable, templates, and command dispatch
- `agent-skill-harbor-collector`: Published collect runtime package
- `agent-skill-harbor-post-collect`: Published post-collect runtime package
- `agent-skill-harbor-web`: Published web package containing the SvelteKit app source and web build dependencies

## Release Strategy

- Release only the package that changed.
- If multiple packages changed, publish runtime packages before the wrapper package.
- Publish reusable workflow changes through git tags in this repository, not through npm.

Recommended order when several packages changed:

1. `agent-skill-harbor-web`
2. `agent-skill-harbor-collector`
3. `agent-skill-harbor-post-collect`
4. `agent-skill-harbor`

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

### Releasing `agent-skill-harbor-collector`

```bash
pnpm install --no-frozen-lockfile
pnpm --dir collector lint:check
pnpm --dir collector check
pnpm --dir collector test
pnpm --dir collector build
pnpm --filter agent-skill-harbor-collector publish --access public
git tag collector-v<version>
```

### Releasing `agent-skill-harbor-post-collect`

```bash
pnpm install --no-frozen-lockfile
pnpm --dir post-collect lint:check
pnpm --dir post-collect check
pnpm --dir post-collect test
pnpm --dir post-collect build
pnpm --filter agent-skill-harbor-post-collect publish --access public
git tag post-collect-v<version>
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

### Releasing multiple packages

1. Release `agent-skill-harbor-web` first.
2. Release `agent-skill-harbor-collector` and/or `agent-skill-harbor-post-collect`.
3. Release `agent-skill-harbor` last if its metadata or templates changed.
4. Create tags after the published package set is ready to consume.

## Tagging

- Use package-specific git tags instead of a single repository-wide version tag.
- CLI releases use `cli-vX.Y.Z`.
- Web releases use `web-vX.Y.Z`.
- Collector releases use `collector-vX.Y.Z`.
- Post-collect releases use `post-collect-vX.Y.Z`.
- Reusable workflow releases use dedicated tags such as `wf-v0`, `wf-v0.14`, or `wf-v0.14.0`.

## Reusable Workflow Tags

- Generated `CollectSkills` workflows call `skill-mill/agent-skill-harbor/.github/workflows/collect.yml@wf-v0`.
- Updating the reusable workflow does not require an npm publish, but it does require moving or creating the referenced workflow tag.
- Move `wf-v0` only for non-breaking workflow changes.
- Create a new major workflow tag only when caller compatibility expectations change materially.

## Versioning Notes

- `cli/package.json`, `collector/package.json`, `post-collect/package.json`, and `web/package.json` version independently.
- `cli/templates/init/package.template.json` and `cli/templates/init/tools/harbor/*/package.template.json` must stay aligned with the package versions you intend to publish.

## Notes

- Web runtime dependencies belong in `web/package.json`.
- Wrapper-only runtime dependencies belong in `cli/package.json`.
- Collect-only runtime dependencies belong in `collector/package.json`.
- Post-collect-only runtime dependencies belong in `post-collect/package.json`.
- The Vite chunk-size warning is currently expected. A manual chunking experiment showed that most of the remaining weight comes from `three`, so we are not keeping extra chunk-splitting config unless we decide to optimize the graph implementation more deeply.
