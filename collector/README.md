<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor?tab=readme-ov-file#agent-skill-harbor">project</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/92-release.md">release</a></p>

# agent-skill-harbor-collector

Collector and post-collect runtime package for Agent Skill Harbor.

## Purpose

- provide the `harbor-collector collect` runtime
- provide the `harbor-collector post-collect` runtime
- keep GitHub collection dependencies separated from optional post-collect plugin dependencies

## Runtime Boundary

Generated projects install this package in `collector/`.

- `pnpm install --dir collector`
- `pnpm --dir collector exec harbor-collector collect --project-root .`
- `pnpm --dir collector exec harbor-collector post-collect --project-root .`

Optional plugin manifests live under `collector/plugins/<plugin-id>/`, but they are installed separately from collector core.

## Notes

- This package is published separately from `agent-skill-harbor`
- `builtin.notify-slack` is part of collector core
- heavyweight optional dependencies such as `promptfoo` are intentionally kept out of collector core
