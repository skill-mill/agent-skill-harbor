<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/collector/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/collector/README_ja.md">ja</a></p>

# agent-skill-harbor-collector

Collector and post-collect runtime package for Agent Skill Harbor.

## Purpose

- provide the `collect` runtime module
- provide the `post-collect` runtime module
- keep GitHub collection dependencies separated from optional post-collect plugin dependencies

## Runtime Boundary

Generated projects install this package in `collector/`.

- `pnpm install --dir collector`
- `node collector/node_modules/agent-skill-harbor-collector/dist/src/runtime/collect-command.js`
- `node collector/node_modules/agent-skill-harbor-collector/dist/src/runtime/post-collect-command.js`

Optional plugin manifests live under `collector/plugins/<plugin-id>/`, but they are installed separately from collector core.

## Notes

- This package is published separately from `agent-skill-harbor`
- `builtin.notify-slack` is part of collector core
- heavyweight optional dependencies such as `promptfoo` are intentionally kept out of collector core
