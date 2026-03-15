# Skill Catalog Guide

Agent Skill Harbor builds a browsable catalog from collected `SKILL.md` files and related metadata.

## Catalog Views

The web app provides multiple ways to inspect collected skills:

- Card view: scan skills quickly with summary metadata
- List view: compare skills in a denser table-like layout
- Stats view: review repository, ownership, and freshness trends
- Graph view: visualize repository and provenance relationships
- Skill detail view: inspect one skill, its files, and its origin

These pages read generated data from `data/skills.yaml` and cached files under `data/skills/`.

## Provenance Tracking

Harbor can trace and display where a copied skill came from when the downloaded skill includes provenance metadata.

Supported sources:

- `_from` frontmatter written by [agent-skill-porter](https://github.com/skill-mill/agent-skill-porter)
- GitHub-based `skills-lock.json` entries written by [agent-skills](https://github.com/vercel-labs/skills) / `vercel-labs/agent-skills`

Current behavior:

- `_from` is the primary source
- `skills-lock.json` is used only as a fallback when `_from` is missing
- `skills-lock.json` fallback currently supports GitHub sources only

During collection, Harbor normalizes the detected value into `resolved_from` in `data/skills.yaml`, so the UI can use one consistent provenance field.
