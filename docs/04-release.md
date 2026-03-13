# Release

This document describes the release workflow for the published packages.

## Packages

- `agent-skill-harbor-web`: Published web package containing the SvelteKit app source and web build dependencies
- `agent-skill-harbor`: Published CLI package containing the `harbor` executable, templates, and collector runtime

## Release Order

Always publish in this order:

1. `agent-skill-harbor-web`
2. `agent-skill-harbor`

The CLI package depends on the published `agent-skill-harbor-web` version, so releasing the CLI first can create a broken install window.

## Release Checklist

1. Update versions consistently in `cli/package.json` and `web/package.json`.
2. Update changelog entries as needed.
3. Run:

```bash
pnpm install --no-frozen-lockfile
pnpm --dir cli build
pnpm --dir web lint
pnpm --dir web check
node cli/dist/bin/cli.js build
pnpm --filter agent-skill-harbor pack
pnpm --filter agent-skill-harbor-web pack
```

4. Publish `agent-skill-harbor-web`.
5. Publish `agent-skill-harbor`.
6. Create the git tag after both packages are ready to consume.

## Version Scripts And Hooks

- `pnpm versions:sync`: Syncs the `cli/package.json` version into `web/package.json` and updates the CLI workspace dependency on `agent-skill-harbor-web`.
- `pnpm versions:check`: Verifies that `cli/web/template` version references are aligned.
- `preversion`: Runs `pnpm --dir .. versions:check` before `pnpm --filter agent-skill-harbor version ...` mutates package versions.
- `version`: Runs `pnpm --dir .. versions:sync`, runs `pnpm --dir .. versions:check` again, and stages `cli/package.json`, `web/package.json`, and `pnpm-lock.yaml` so the generated updates are included in the version commit.
- `prepack`: Runs `pnpm --dir .. versions:check` before packing/publishing.

In other words, `pnpm --filter agent-skill-harbor version patch|minor|major` still uses pnpm's built-in version command. The `preversion` and `version` scripts are lifecycle hooks that add synchronization and validation around that command.

## Notes

- The CLI tarball should depend on `agent-skill-harbor-web` with the same release line.
- Web runtime dependencies belong in `web/package.json`.
- CLI-only runtime dependencies belong in `cli/package.json`.
