<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# agent-skill-harbor-web

Web package for Agent Skill Harbor.

This package contains the SvelteKit frontend source, configuration, and runtime dependencies used by `agent-skill-harbor`.

## Purpose

- Provide the web application source consumed by the `harbor build`, `harbor dev`, and `harbor preview` commands
- Keep web-specific dependencies separate from the CLI package
- Serve as the published runtime dependency of `agent-skill-harbor`

## Notes

- This package is primarily an internal runtime package for `agent-skill-harbor`
- Release `agent-skill-harbor-web` first only when the CLI depends on a newer unpublished web version, or when both packages are released together
- For repository-level release steps, see [`../docs/92-release.md`](../docs/92-release.md)
