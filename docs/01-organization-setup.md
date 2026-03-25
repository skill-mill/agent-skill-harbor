# Organization Setup

This guide explains how to create and operate an Agent Skill Harbor project for your organization.

## Prerequisites

- Node.js 24+
- pnpm 10+ (or npm)
- a GitHub token that can read the repositories you want to catalog
- GitHub Enterprise Cloud if you want private GitHub Pages hosting

## 1. Scaffold a Project

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
```

This creates:

- root `package.json` for `agent-skill-harbor` (CLI + web)
- `collector/package.json` for `agent-skill-harbor-collector`
- `config/`, `data/`, `guide/`
- generated GitHub Actions workflows

## 2. Install Dependencies

```bash
pnpm install
pnpm install --dir collector
```

Or with npm:

```bash
npm install
npm install --prefix collector
```

## 3. Configure `.env`

Edit `.env` and set values as needed.

| Variable   | Required    | Description                                     |
| ---------- | ----------- | ----------------------------------------------- |
| `GH_TOKEN` | Yes (local) | token used for local collection                 |
| `GH_ORG`   | No          | GitHub organization name                        |
| `GH_REPO`  | No          | current repository name to exclude if necessary |

## 4. Configure GitHub Actions

Add the following in your repository settings.

### Secrets

| Secret     | Required | Description                                  |
| ---------- | -------- | -------------------------------------------- |
| `GH_TOKEN` | Yes      | token that can read the repositories to scan |

### Variables

| Variable | Required | Description              |
| -------- | -------- | ------------------------ |
| `GH_ORG` | No       | GitHub organization name |

## 5. Enable Pages

For GitHub Pages:

1. go to **Settings > Pages**
2. set **Source** to **GitHub Actions**
3. set **Visibility** to **Private** if you need org-only access

For Cloudflare Pages, configure the Cloudflare secrets and use the generated Cloudflare deploy workflow instead.

## 6. Run Locally Once

```bash
pnpm collect
pnpm dev
```

`pnpm collect` calls:

```bash
node collector/node_modules/agent-skill-harbor-collector/dist/src/runtime/collect-command.js
```

## 7. First Workflow Run

Push the project, then run `CollectSkills`.

The generated caller workflow points to Harbor's reusable workflow at `wf-v0`.

Inside the reusable workflow:

1. `collect` job installs collector core and runs collection
2. `post_collect` job restores the collected artifact
3. `post_collect` installs collector core again
4. `post_collect` installs only enabled optional plugin manifests
5. final `data/` is committed back to the repository

This boundary is intentional:

- `collect` has access to `GH_TOKEN`
- optional heavy dependencies such as `promptfoo` are installed only in `post_collect`

## 8. Optional Plugin Setup

Enable built-in plugins in `config/harbor.yaml`.

Some plugins also need runtime files under `collector/plugins/<plugin-id>/`.

Examples:

```bash
harbor setup builtin.audit-promptfoo-security
harbor setup builtin.audit-skill-scanner
harbor setup example-user-defined-plugin
```

After running `setup`, uncomment the matching entry in `config/harbor.yaml` and install the generated runtime files if needed.

See [Post-Collect Plugins](03-post-collect-plugins.md).
