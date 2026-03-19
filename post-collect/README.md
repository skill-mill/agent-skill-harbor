<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor?tab=readme-ov-file#agent-skill-harbor">project</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/03-post-collect-plugins.md">plugins</a></p>

# agent-skill-harbor-post-collect

Post-collect runtime package for Agent Skill Harbor.

This package contains the `post-collect` command implementation and built-in plugins such as `builtin.detect-drift`, `builtin.audit-promptfoo-security`, and `builtin.audit-skill-scanner`.

## Purpose

- Provide the runtime behind `harbor post-collect`
- Keep built-in plugin dependencies separate from `collect`
- Isolate heavier optional dependencies such as `promptfoo` from GitHub collection environments

## Notes

- This package is primarily an internal runtime dependency of `agent-skill-harbor`
- `builtin.audit-promptfoo-security` depends on `promptfoo` and may still perform network access required by promptfoo red-team execution
- `builtin.audit-skill-scanner` requires Python 3.10+ and a preinstalled `skill-scanner` CLI
- Publish `agent-skill-harbor-post-collect` before `agent-skill-harbor` when the wrapper depends on a newer post-collect version
- For plugin behavior and output conventions, see [`docs/03-post-collect-plugins.md`](https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/03-post-collect-plugins.md)
