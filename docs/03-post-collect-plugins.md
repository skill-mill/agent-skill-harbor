# Post-Collect Plugins

Agent Skill Harbor can run plugins after each `collect`.

## Built-in Plugins

Harbor currently provides these built-in plugins.

Configure them in `config/harbor.yaml`:

```yaml
post_collect:
  plugins:
    - id: builtin.detect-drift
      short_label: Drift
    - id: builtin.audit-promptfoo-security
      short_label: Security
      config:
        model: openai:gpt-5
        vulnerabilities:
          - prompt-injection
          - prompt-extraction
          - jailbreak
          - policy-violation
        risk_threshold: 1
        critical_threshold: 3
    - id: builtin.audit-skill-scanner
      short_label: Scanner
      config:
        command: skill-scanner
        options: --policy balanced
```

Each `post_collect.plugins[]` entry supports these common fields:

- `id`: plugin id
- `short_label`: optional short name used in filters and table headers
- `config`: optional plugin-specific configuration object

`config` is intentionally generic. Harbor passes it to the plugin as-is via `context.plugin_config`, and each plugin decides how to interpret it. There is no global schema shared by all plugins.

### `builtin.detect-drift`

Detects whether collected skills have drifted from their recorded upstream origin.

- Primary purpose: provenance drift detection
- Typical output labels: `In sync`, `Drifted`, `Unknown`
- Recommended use: enable this when you rely on copied or imported skills and want to know when upstream changed

This plugin is lightweight and uses only collected catalog data plus saved skill files.

### `builtin.audit-promptfoo-security`

Runs `promptfoo` red teaming against org-owned skills and summarizes the results into Harbor labels.

- Primary purpose: LLM-based security / prompt safety auditing
- Typical output labels: `Safe`, `Risk`, `Critical`, `Unknown`
- Recommended use: enable this only when you explicitly want LLM-backed security checks and have configured `config.model`

Important notes:

- It currently targets org-owned skills only
- It may generate HTML reports under `data/assets/plugins/builtin.audit-promptfoo-security/`
- Harbor runs it with `PROMPTFOO_DISABLE_TELEMETRY=1` and `PROMPTFOO_DISABLE_UPDATE=1`
- `promptfoo` can still attempt other outbound communication depending on the red-team feature set you enable

If you have strong supply-chain or outbound-network constraints, review whether this plugin belongs in your `post_collect.plugins` list before enabling it.

### `builtin.audit-skill-scanner`

Runs Cisco `skill-scanner` against org-owned skills and summarizes the maximum severity into Harbor labels.

- Primary purpose: local skill security scanning without external LLM/API requirements
- Typical output labels: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`, `safe`, `unknown`
- Recommended use: enable this when Python 3.10+ and `skill-scanner` are available and you want local static scanning

Important notes:

- It targets org-owned skills only
- `command` defaults to `skill-scanner`
- `options` is passed through as additional CLI flags, but Harbor reserves scan target and output flags
- Harbor adds `--use-behavioral --use-trigger --lenient` by default
- `--enable-meta` is not enabled by default because it requires an API key
- It keeps `report.html`, `report.sarif.json`, and `report.json` under `data/assets/plugins/builtin.audit-skill-scanner/`
- `skill-scanner` can still attempt outbound communication indirectly via LiteLLM during CLI startup/help flows
- In generated GitHub Actions workflows, Harbor's reusable collect workflow auto-detects this plugin from `config/harbor.yaml` and installs Python plus `cisco-ai-skill-scanner` in `post_collect`

## User-Defined Plugins

User plugins are optional and discovered from:

- `plugins/<id>/index.mjs`
- `plugins/<id>/index.js`
- `plugins/<id>/index.ts`

Search order is `mjs`, then `js`, then `ts`.

Plugin ids must use lowercase letters, numbers, `-`, and `_`.

If a plugin needs extra runtime dependencies, add `plugins/<id>/package.json`.
The generated reusable collect workflow detects `plugins/*/package.json` during the `post_collect` job and installs each plugin directory automatically.

To generate the example plugin scaffold:

```bash
harbor gen example-user-defined-plugin
harbor gen notify-slack
```

Then uncomment the matching plugin entry in `config/harbor.yaml`.
`notify-slack` also generates `plugins/notify-slack/package.json`, so before local use run:

```bash
pnpm install --dir plugins/notify-slack
# or
npm install --prefix plugins/notify-slack
```

Then update the generated files as needed for your real plugin.

## Plugin Output

Each plugin writes history entries to:

- `data/plugins/<plugin-id>.yaml`

Each file stores multiple runs, newest first. Entries are linked to `data/collects.yaml` by `collect_id`.

Output fields:

- `summary`: human-readable summary of the plugin run
- `label_intents`: maps each label to a visual intent used for coloring in the UI
- `sub_artifacts`: plugin-level secondary artifact file names kept under `data/assets/plugins/<plugin-id>/<normalized-skill-key>/`
- `results`: per-skill results keyed by skill path

### `label_intents` values

| Value     | Color | Usage example             |
| --------- | ----- | ------------------------- |
| `neutral` | Gray  | Default / unknown state   |
| `info`    | Blue  | Informational finding     |
| `success` | Green | Passed / in sync          |
| `warn`    | Amber | Warning / needs attention |
| `danger`  | Red   | Failed / critical issue   |

Within each skill result:

- `label`: short status label for badges and filters
- `raw`: free-form text for detail pages
- any additional keys: preserved and shown raw on the skill detail page

`builtin.audit-promptfoo-security` may also write:

- `findings`: counts by vulnerability id
- `reasons`: raw promptfoo reasons grouped by vulnerability id

## Secondary Artifacts

Plugins may produce files other than their main YAML output as a side effect.

If a plugin wants those files to be deployed with the web app, it should write them under:

- `data/assets/plugins/<plugin-id>/...`

You can also place your own static files anywhere under `data/assets/`; Harbor copies the whole directory into the web build output.

Harbor stores file names in `sub_artifacts`, but the plugin itself is still responsible for creating and updating the files using the stable path convention above.

During `harbor build`, Harbor copies `data/assets/` into the web build output so those files can be linked from the UI.

In generated projects, the build workflow installs only `tools/harbor/web`, but the copy rule stays the same because Harbor always reads `data/assets/` from the project root passed via `--project-root`.

## Web UI Behavior

- Card/List/Skill detail use plugin output only when it matches the latest `collect_id`
- Stats reads plugin output history by `collect_id`
- `short_label` is used for filter labels and table headers when configured
- files under `data/assets/` are copied into the web build output during `harbor build`
- skill detail pages build secondary artifact links from `plugin_id`, `skill.key`, and `sub_artifacts`

## Workflow

The generated `CollectSkills` workflow is a thin caller pinned to Harbor's published reusable workflow (`wf-v0`).

Inside that reusable workflow, Harbor:

1. installs `tools/harbor/collector` and runs `collect`
2. installs `tools/harbor/post-collect`
3. installs `plugins/*/package.json` when present
4. runs `post-collect --collect-id ...`
5. commits updated `data/` back to the repository

This keeps collection and post-collection processing separate and rerunnable while shrinking generated workflow YAML in user projects.
