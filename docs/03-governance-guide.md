# Governance Guide

Agent Skill Harbor provides governance controls to manage how Agent Skills are used within your organization.

## Governance Statuses

| Status          | Description                                          | Badge Color |
| --------------- | ---------------------------------------------------- | ----------- |
| **recommended** | Encouraged for use, reviewed and approved            | Green       |
| **discouraged** | Use is not recommended, consider alternatives        | Amber       |
| **prohibited**  | Must not be used due to security/compliance concerns | Red         |
| **none**        | No governance policy assigned (default)              | Gray        |

## Configuration

Governance policies are defined in `config/governance.yaml`.

### Structure

```yaml
policies:
  github.com/your-org/your-repo/skills/your-skill/SKILL.md:
    usage_policy: recommended # recommended | discouraged | prohibited | none
    note: 'Reason for this policy'
```

Each key is a skill path in the format `github.com/{org}/{repo}/{skillPath}`.

### Fields

- **usage_policy**: One of the governance statuses listed above
- **note**: Human-readable explanation of why this policy was assigned

## Managing Policies

### Via Claude Code

Use the manage-skill slash command:

```
/manage-skill govern code-review-assistant recommended "Reviewed and approved for use"
```

### Via Direct Edit

1. Edit `config/governance.yaml`
2. Add or modify a policy entry
3. Commit and push (or create a PR)
4. The catalog will be rebuilt automatically

### Via PR Review

For organizations that require governance changes to go through review:

1. Create a branch
2. Edit `config/governance.yaml`
3. Submit a PR for review
4. After merge, the catalog rebuilds and the web UI updates

## Collection Behavior

During skill collection (via GitHub Actions), the governance status from `config/governance.yaml` is merged into each skill's data. This means:

- Governance changes take effect on the next catalog build
- The web UI always reflects the latest governance state after a build
- Skills without a specific policy default to `none`

## Best Practices

1. **Document your reasoning** - Always include a `note` explaining why a policy was assigned
2. **Use PRs for changes** - Governance changes should go through your normal code review process
3. **Review regularly** - Periodically review policies to ensure they're still relevant
