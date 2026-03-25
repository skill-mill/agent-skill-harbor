# Post-Collect Plugins

Agent Skill Harbor can run plugins after each collect run.

## Built-in Plugins

Configure built-in plugins in `config/harbor.yaml`.

Current built-ins:

- `builtin.detect-drift`
- `builtin.notify-slack`
- `builtin.audit-promptfoo-security`
- `builtin.audit-skill-scanner`

Common fields:

- `id`
- `short_label`
- `config`

`config` is passed through to the plugin as-is.

## Optional Runtime Files

Some plugins require extra runtime files under `collector/plugins/<plugin-id>/`.

Use:

```bash
harbor setup example-user-defined-plugin
harbor setup builtin.audit-promptfoo-security
harbor setup builtin.audit-skill-scanner
```

This generates files under:

- `collector/plugins/example-user-defined-plugin/`
- `collector/plugins/builtin.audit-promptfoo-security/`
- `collector/plugins/builtin.audit-skill-scanner/`

`builtin.notify-slack` is built in and does not require setup files.

## User-Defined Plugins

User-defined plugins are discovered from:

- `collector/plugins/<id>/index.mjs`
- `collector/plugins/<id>/index.js`
- `collector/plugins/<id>/index.ts`

Search order is `mjs`, then `js`, then `ts`.

User-defined plugin ids must use lowercase letters, numbers, `-`, and `_`.
`.` is reserved for built-in plugin ids such as `builtin.notify-slack`.

Because these plugins live under `collector/plugins/`, they can use collector core dependencies such as `js-yaml`.

If a plugin needs extra dependencies beyond collector core, add a manifest in the same directory, for example:

- `collector/plugins/<id>/package.json`
- `collector/plugins/<id>/requirements.txt`

## Plugin Output

Most plugins save history entries to:

- `data/plugins/<plugin-id>.yaml`

Each file stores multiple runs, newest first.

Common output fields:

- `summary`
- `label_intents`
- `results`
- `sub_artifacts`

`builtin.notify-slack` is different: it uses `persist: false`, so it logs a summary but does not save a plugin YAML history file.

## Secondary Artifacts

Plugins may write additional files under:

- `data/assets/plugins/<plugin-id>/...`

These files are copied into the built web output during `harbor build`.

Typical examples:

- `builtin.audit-promptfoo-security`
- `builtin.audit-skill-scanner`

## Workflow Behavior

The generated `CollectSkills` workflow is a thin caller pinned to `wf-v0`.

Inside Harbor's reusable workflow:

1. `collect` job installs `collector/` core and runs collection
2. `post_collect` job restores the collected artifact
3. `post_collect` installs `collector/` core
4. `post_collect` checks enabled plugin ids from `config/harbor.yaml`
5. only the enabled plugin manifests under `collector/plugins/<plugin-id>/` are installed
6. `post_collect` runs and updates `data/`

Manifest detection is generic:

- `package.json` means Node plugin dependencies
- `requirements.txt` means Python plugin dependencies

This is also the security boundary:

- `collect` runs with GitHub collection credentials
- optional dependencies such as `promptfoo` are installed only in `post_collect`

## `builtin.audit-promptfoo-security`

This plugin is intentionally optional.

- `promptfoo` is not part of collector core
- run `harbor setup builtin.audit-promptfoo-security`
- install its manifest:

```bash
pnpm install --dir collector/plugins/builtin.audit-promptfoo-security
# or
npm install --prefix collector/plugins/builtin.audit-promptfoo-security
```

Then uncomment the plugin entry in `config/harbor.yaml`.

## `builtin.audit-skill-scanner`

This plugin is also optional.

- run `harbor setup builtin.audit-skill-scanner`
- install its Python runtime:

```bash
uv pip install -r collector/plugins/builtin.audit-skill-scanner/requirements.txt
# or
pip install -r collector/plugins/builtin.audit-skill-scanner/requirements.txt
```

Then uncomment the plugin entry in `config/harbor.yaml`.

## `builtin.notify-slack`

`builtin.notify-slack` sends a Slack Incoming Webhook notification with:

- collect summary
- plugin summaries
- highlighted sections based on selected `highlight_intents`

It uses `text + blocks` and does not need setup files.

Example config:

```yaml
post_collect:
  plugins:
    - id: builtin.notify-slack
      short_label: Slack
      config:
        disable_send: false
        use_debug_message: false
        highlight_intents:
          - warn
          - danger

`highlight_intents` is optional. By default, `builtin.notify-slack` highlights `warn` and `danger`.
```

`HARBOR_SLACK_WEBHOOK_URL` is required when sending is enabled.
