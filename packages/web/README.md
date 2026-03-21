<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/web/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/web/README_ja.md">ja</a></p>

# agent-skill-harbor-web

Web package for Agent Skill Harbor.

This package contains the SvelteKit frontend source, configuration, and runtime dependencies used by `agent-skill-harbor`. It also exposes the runtime entry points behind `harbor build`, `harbor dev`, `harbor preview`, and `harbor deploy`.

## Purpose

- Provide the web application source consumed by the `harbor build`, `harbor dev`, and `harbor preview` commands
- Keep web-specific dependencies separate from the CLI package
- Serve as the published web runtime dependency of `agent-skill-harbor`

## Notes

- This package is primarily an internal runtime package for `agent-skill-harbor`
- The package is published as source, and the installed project builds the SvelteKit app locally when `harbor build` or `harbor dev` runs
- Release `agent-skill-harbor-web` first only when the CLI depends on a newer unpublished web version, or when both packages are released together
- For repository-level release steps, see [`docs/92-release.md`](https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/92-release.md)
