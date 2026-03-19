<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor?tab=readme-ov-file#agent-skill-harbor">project</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/92-release.md">release</a></p>

# agent-skill-harbor-collector

Collector runtime package for Agent Skill Harbor.

This package contains the `collect` command implementation used by Skill Harbor projects. It is published separately so environments that collect data from GitHub organizations do not need to install `post-collect` dependencies such as `promptfoo`.

## Purpose

- Provide the runtime behind `harbor collect`
- Keep GitHub collection dependencies separate from `post-collect` and web dependencies
- Support workflow-level install surface separation in generated Skill Harbor projects

## Notes

- This package is primarily an internal runtime dependency of `agent-skill-harbor`
- Publish `agent-skill-harbor-collector` before `agent-skill-harbor` when the wrapper depends on a newer collector version
- For repository-level release steps, see [`docs/92-release.md`](https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/92-release.md)
