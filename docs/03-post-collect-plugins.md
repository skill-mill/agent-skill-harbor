# Post-Collect Plugins

Agent Skill Harbor can run plugins after each `collect`.

## Built-in Plugins

Harbor currently provides these built-in plugins:

- `builtin.detect-drift`
- `builtin.audit-static`

Configure them in `config/harbor.yaml`:

```yaml
post_collect:
  plugins:
    - id: builtin.detect-drift
      short_label: Drift
    - id: builtin.audit-static
      short_label: Audit
```

## User-Defined Plugins

User plugins are optional and discovered from:

- `plugins/<id>/index.mjs`
- `plugins/<id>/index.js`
- `plugins/<id>/index.ts`

Search order is `mjs`, then `js`, then `ts`.

Plugin ids must use lowercase letters, numbers, `-`, and `_`.

To generate the sample plugin scaffold:

```bash
harbor gen sample-plugin
```

Then uncomment `sample_plugin` in `config/harbor.yaml`.

## Plugin Output

Each plugin writes history entries to:

- `data/plugins/<plugin-id>.yaml`

Each file stores multiple runs, newest first. Entries are linked to `data/collects.yaml` by `collect_id`.

Output fields:

- `summary`: human-readable summary of the plugin run
- `label_intents`: maps each label to a visual intent used for coloring in the UI
- `results`: per-skill results keyed by skill path

### `label_intents` values

| Value     | Color   | Usage example                |
|-----------|---------|------------------------------|
| `neutral` | Gray    | Default / unknown state      |
| `info`    | Blue    | Informational finding        |
| `success` | Green   | Passed / in sync             |
| `warn`    | Amber   | Warning / needs attention    |
| `danger`  | Red     | Failed / critical issue      |

Within each skill result:

- `label`: short status label for badges and filters
- `raw`: free-form text for detail pages
- any additional keys: preserved and shown raw on the skill detail page

## Web UI Behavior

- Card/List/Skill detail use plugin output only when it matches the latest `collect_id`
- Stats reads plugin output history by `collect_id`
- `short_label` is used for filter labels and table headers when configured

## Workflow

The generated `CollectSkills` workflow runs:

1. `collect`
2. `post-collect --collect-id ...`

This keeps collection and post-collection processing separate and rerunnable.
