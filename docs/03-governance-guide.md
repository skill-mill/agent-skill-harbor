# Governance Guide

Agent Skill Harbor provides governance controls to manage how Agent Skills are used within your organization.

## Governance Statuses

| Status | Description | Badge Color |
|--------|-------------|-------------|
| **recommended** | Encouraged for use, reviewed and approved | Green |
| **deprecated** | Should be phased out, use alternatives | Amber |
| **prohibited** | Must not be used due to security/compliance concerns | Red |
| **none** | No governance policy assigned (default) | Gray |

## Configuration

Governance policies are defined in `config/governance.yaml`.

### Structure

```yaml
version: "1"

defaults:
  org_skills: "none"      # Default status for org-collected skills
  public_skills: "none"   # Default status for manually-added public skills

policies:
  - slug: "skill-slug"
    source: "org"          # "org" or "public"
    status: "recommended"
    note: "Reason for this policy"
    updated_by: "team-or-person"
    updated_at: "2026-02-24T00:00:00Z"
```

### Fields

- **slug**: The skill identifier (repository name for org skills, `{owner}_{repo}` for public skills)
- **source**: Whether the skill is from the organization (`org`) or publicly added (`public`)
- **status**: One of the governance statuses listed above
- **note**: Human-readable explanation of why this status was assigned
- **updated_by**: The team or person who set this policy
- **updated_at**: When the policy was last updated

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

During skill collection (via GitHub Actions), the governance status from `config/governance.yaml` is merged into each skill's YAML data. This means:

- Governance changes take effect on the next collection run or catalog build
- The web UI always reflects the latest governance state after a build
- Skills without a specific policy use the default status

## Best Practices

1. **Document your reasoning** - Always include a `note` explaining why a status was assigned
2. **Track ownership** - Use `updated_by` to record which team made the decision
3. **Review regularly** - Periodically review policies to ensure they're still relevant
4. **Use PRs for changes** - Governance changes should go through your normal code review process
