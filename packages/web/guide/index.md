# Agent Skill Harbor Guide

This page is a guide from the administrators of your Agent Skill Harbor instance to developers in your organization.

For an overview of Agent Skill Harbor itself, see the repository [README](https://github.com/skill-mill/agent-skill-harbor/blob/main/README.md).

You can override the content of this page by placing `guide/index.md` (`guide/index_ja.md`) in the repository.
You can also add pages by placing files like `guide/01-foo.md` (`guide/01-foo_ja.md`).

## What Is Agent Skill Harbor?

Agent Skill Harbor is a skill sharing and discovery service for teams, and a skill governance tool for organizations.

It catalogs Agent Skills (`SKILL.md`) across all repositories in a GitHub Organization and publishes a browsable internal skill catalog. This helps developers discover useful skills already used inside the organization and learn from existing skill authoring practices.

## How It Works

Skills are collected by periodically crawling each repository, so developers do not need to go through a separate registration or submission process after creating a skill.

Agent Skill Harbor can also analyze the provenance of skills installed from external repositories. To enable this, developers need to use [agent-skill-porter](https://github.com/skill-mill/agent-skill-porter) when downloading skills from public repositories. The CLI can add skills with a simple command like this:

```sh
npm install -g agent-skill-porter
sk add https://github.com/anthropics/skills
```

The provenance mechanism is simple. `agent-skill-porter` adds a special `_from` property to the frontmatter of the target `SKILL.md`. It records a value such as `anthropics/skills@b0cbd3d`, using the format `<owner>/<repository>@<sha>`. Combined with the `name` property, this allows the download source to be identified uniquely.

## Notes

Adding custom properties to `SKILL.md` is acceptable. The Agent Skill format is standardized, but extra frontmatter properties are not prohibited. In practice, many teams already extend `SKILL.md` with organization-specific metadata, and unknown properties are generally ignored by agents.

The additional token cost is also small. These properties usually consume around 10 to 20 tokens, so even if a project loads dozens of skills, the impact remains minimal.
