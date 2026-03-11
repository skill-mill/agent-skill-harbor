---
name: skill-creator
description: "Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities."
license: Complete terms in LICENSE.txt
_from: skill-mill/sk-onboarding-kit@7196b39e893b5317f303447822e30ee44abfce88
---

# Skill Creator

## SKILL.md Structure

Every skill needs a `SKILL.md` with YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does and when to use it.
---
```

## Creation Process

1. **Identify the task**: What specific capability should this skill add?
2. **Write the description**: Include trigger phrases so the agent knows when to activate
3. **Draft instructions**: Step-by-step guidance for the agent
4. **Add examples**: Show expected inputs and outputs
5. **Test iteratively**: Refine based on actual agent behavior
6. **Organize resources**: Move detailed references to separate files

## Progressive Disclosure

- **Metadata** (~100 tokens): name + description, loaded at startup
- **Instructions** (<5000 tokens): SKILL.md body, loaded on activation
- **Resources** (as needed): scripts/, references/, assets/

Keep main SKILL.md under 500 lines.
