# Release

This document describes the release flow for the published packages.

## Published Packages

- `agent-skill-harbor`
  - CLI + web package
- `agent-skill-harbor-collector`
  - collect + post-collect runtime package

## Release Order

If both packages changed:

1. release `agent-skill-harbor-collector`
2. release `agent-skill-harbor`

`agent-skill-harbor` should be published after the collector version it expects is already available.

## Releasing `agent-skill-harbor-collector`

```bash
pnpm install --no-frozen-lockfile
pnpm --dir collector verify
pnpm --dir collector build

cd collector
npm publish --access public
cd ..

git tag collector-v<version>
```

## Releasing `agent-skill-harbor`

```bash
pnpm install --no-frozen-lockfile
pnpm verify
pnpm cli:build

npm publish --access public

git tag cli-v<version>
```

## Versioning

- `agent-skill-harbor` and `agent-skill-harbor-collector` version independently
- root `package.json` carries `harborCollectorRange`
- `templates/init/collector/package.template.json` must stay aligned with the collector range you want generated projects to use

## Reusable Workflow Tags

- generated caller workflows reference `skill-mill/agent-skill-harbor/.github/workflows/collect.yml@wf-v0`
- reusable workflow releases are managed by git tags, not npm publishes
- move `wf-v0` only for non-breaking workflow changes

## Workflow Action Pins

Harbor keeps external GitHub Actions pinned by commit SHA in:

- `.github/workflows/collect.yml`
- generated deploy workflow templates

Before updating them:

```bash
pnpm actions:check
```

Then apply reviewed updates:

```bash
pnpm actions:pin
```

Notes:

- the generated `CollectSkills` caller intentionally stays on `@wf-v0`
- `actions-up` handles most action updates
- `pnpm/action-setup` is still checked manually and reported separately

## Notes

- root package owns CLI + web runtime dependencies
- collector-only runtime dependencies belong in `collector/package.json`
- heavyweight optional plugin dependencies such as `promptfoo` do not belong in collector core; they belong in plugin manifests under `collector/plugins/<plugin-id>/`
