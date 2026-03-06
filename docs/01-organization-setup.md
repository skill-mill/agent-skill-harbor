# Organization Setup

This guide explains how to deploy Agent Skill Harbor for your organization.

## Prerequisites

- GitHub Enterprise Cloud (only if hosting the web UI privately on GitHub Pages)
- Node.js 22+
- pnpm 10+

## Step 1: Clone the Repository

Clone this repository as a **private** repository within your organization.

```bash
git clone https://github.com/your-org/agent-skill-harbor.git
cd agent-skill-harbor
pnpm install
```

## Step 2: Configure GitHub Secrets and Variables

Go to your repository's **Settings > Secrets and variables > Actions**.

### Repository Variables

| Variable | Required | Description | Default | Example |
|----------|----------|-------------|---------|---------|
| `GH_ORG` | No | Your GitHub organization name | Auto-detected from git remote URL | `my-org` |
| `GH_REPO` | No | This repository name. Used for self-exclusion during collection and header display. | Auto-detected from git remote URL | `agent-skill-harbor` |

### Repository Secrets

| Secret | Required | Description | Default |
|--------|----------|-------------|---------|
| `ORG_GITHUB_TOKEN` | Yes | Personal Access Token (classic) or GitHub App token with `repo` scope for your organization | — |

The token needs read access to all repositories in the organization to scan for SKILL.md files.

## Step 3: Enable GitHub Pages

1. Go to **Settings > Pages**
2. Set **Source** to **GitHub Actions**
3. Under **Visibility**, set to **Private** to restrict access to organization members only

> **Warning:** If you do not set the Pages visibility to Private, your catalog page — including all collected skill data — will be publicly accessible to anyone on the internet. Private GitHub Pages visibility requires a **GitHub Enterprise Cloud** plan. If your organization does not have Enterprise Cloud, GitHub Pages will always be public regardless of the repository's visibility setting.

## Step 4: Initial Skill Collection

1. Go to **Actions > Collect Skills**
2. Click **Run workflow** to trigger the first collection
3. The workflow will scan all org repositories for SKILL.md files
4. Collected data will be committed to the `data/` directory

## Step 5: Configure Governance Policies

Edit `config/governance.yaml` to define your organization's skill policies:

```yaml
policies:
  github.com/your-org/your-repo/.claude/skills/your-skill/SKILL.md:
    usage_policy: recommended    # recommended | discouraged | prohibited | none
    note: "Reason for this status"
```

Commit and push the changes. The deploy workflow will automatically rebuild the web UI.

## Step 6: Add Public Skills (Optional)

Use the Claude Code slash command to add public skills:

```
/manage-skill add owner/repo
```

## Workflow Overview

```
┌─────────────────────────┐
│  Collect Skills (cron)  │
│  - Scan org repos       │
│  - Parse SKILL.md       │
│  - Write YAML           │
│  - Commit & push        │
└────────┬────────────────┘
         │ triggers
         ▼
┌─────────────────────────┐
│  Deploy Pages           │
│  - Build SvelteKit      │
│  - Deploy to GH Pages   │
└─────────────────────────┘
```
