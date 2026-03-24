# Post-Collect Plugins

Agent Skill Harbor は、collect 実行後に plugin を実行できます。

## builtin plugin

builtin plugin は `config/harbor.yaml` で設定します。

現時点の builtin:

- `builtin.detect-drift`
- `builtin.notify-slack`
- `builtin.audit-promptfoo-security`
- `builtin.audit-skill-scanner`

共通フィールド:

- `id`
- `short_label`
- `config`

`config` は plugin にそのまま渡されます。

## optional runtime file

plugin によっては `collector/plugins/<plugin-id>/` 配下に追加 runtime file が必要です。

次を使います。

```bash
harbor setup example-user-defined-plugin
harbor setup builtin.audit-promptfoo-security
harbor setup builtin.audit-skill-scanner
```

生成先:

- `collector/plugins/example-user-defined-plugin/`
- `collector/plugins/builtin.audit-promptfoo-security/`
- `collector/plugins/builtin.audit-skill-scanner/`

`builtin.notify-slack` は builtin core なので setup file は不要です。

## user-defined plugin

user-defined plugin は次から探索されます。

- `collector/plugins/<id>/index.mjs`
- `collector/plugins/<id>/index.js`
- `collector/plugins/<id>/index.ts`

探索順は `mjs` → `js` → `ts` です。

user-defined plugin id には小文字、数字、`-`、`_` を使えます。
`.` は `builtin.notify-slack` のような builtin plugin id 用に予約されています。

これらの plugin は `collector/plugins/` 配下に置かれるので、collector core dependency (`js-yaml` など) を使えます。

collector core 以外の追加依存が必要なら、同じディレクトリに manifest を置きます。

例:

- `collector/plugins/<id>/package.json`
- `collector/plugins/<id>/requirements.txt`

## plugin 出力

多くの plugin は次に履歴を保存します。

- `data/plugins/<plugin-id>.yaml`

各ファイルには新しい run が先頭に追加されます。

共通フィールド:

- `summary`
- `label_intents`
- `results`
- `sub_artifacts`

ただし `builtin.notify-slack` は `persist: false` を使うため、summary はログに出しますが plugin YAML 履歴は保存しません。

## 副成果物

plugin は追加ファイルを次へ書けます。

- `data/assets/plugins/<plugin-id>/...`

これらは `harbor build` 時に Web 出力へコピーされます。

代表例:

- `builtin.audit-promptfoo-security`
- `builtin.audit-skill-scanner`

## workflow の挙動

生成される `CollectSkills` workflow は `wf-v0` を参照する薄い caller です。

Harbor の reusable workflow 内では:

1. `collect` job で `collector/` core を install して collect
2. `post_collect` job で collect artifact を復元
3. `post_collect` で `collector/` core を install
4. `config/harbor.yaml` から有効な plugin id を確認
5. `collector/plugins/<plugin-id>/` にある manifest のうち、有効なものだけ install
6. `post_collect` を実行して `data/` を更新

manifest 判定は generic です。

- `package.json` → Node plugin dependency
- `requirements.txt` → Python plugin dependency

この境界がセキュリティ上のポイントです。

- `collect` は GitHub 収集権限付きで実行
- `promptfoo` のような optional dependency は `post_collect` にだけ入る

## `builtin.audit-promptfoo-security`

この plugin は optional です。

- `promptfoo` は collector core に入っていません
- `harbor setup builtin.audit-promptfoo-security` を実行
- 生成された manifest を install:

```bash
pnpm install --dir collector/plugins/builtin.audit-promptfoo-security
# or
npm install --prefix collector/plugins/builtin.audit-promptfoo-security
```

その後 `config/harbor.yaml` の該当項目をアンコメントします。

## `builtin.audit-skill-scanner`

この plugin も optional です。

- `harbor setup builtin.audit-skill-scanner` を実行
- Python runtime を install:

```bash
uv pip install -r collector/plugins/builtin.audit-skill-scanner/requirements.txt
# or
pip install -r collector/plugins/builtin.audit-skill-scanner/requirements.txt
```

その後 `config/harbor.yaml` の該当項目をアンコメントします。

## `builtin.notify-slack`

`builtin.notify-slack` は Slack Incoming Webhook に次を通知します。

- collect summary
- plugin summary
- 指定した `highlight_intents` に基づく highlight

`text + blocks` を使い、setup file は不要です。

設定例:

```yaml
post_collect:
  plugins:
    - id: builtin.notify-slack
      short_label: Slack
      config:
        webhook_url: https://hooks.slack.com/services/...
        disable_send: false
        use_debug_message: false
        highlight_intents:
          - warn
          - danger

`highlight_intents` は省略可能です。既定では `warn` と `danger` を強調対象にします。
```
