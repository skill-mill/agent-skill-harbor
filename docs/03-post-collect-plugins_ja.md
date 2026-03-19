# Post-Collect Plugins

Agent Skill Harbor では、各 `collect` の後に plugin を実行できます。

## ビルトインプラグイン

現在のビルトインプラグインは次の 3 つです。

`config/harbor.yaml` で設定します。

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

`post_collect.plugins[]` では、共通して次のキーを使えます。

- `id`: plugin id
- `short_label`: フィルターやテーブル見出しに使う任意の短縮名
- `config`: plugin 固有の任意設定オブジェクト

`config` は意図的に汎用のままです。Harbor はこれを `context.plugin_config` として plugin にそのまま渡し、解釈は各 plugin 側に委ねます。全 plugin 共通の schema はありません。

### `builtin.detect-drift`

収集済み skill が、記録されている upstream origin から drift していないかを検出します。

- 主目的: 来歴の drift 検出
- 代表的なラベル: `In sync`, `Drifted`, `Unknown`
- 向いている用途: copy/import した skill を使っていて upstream 変更を追いたい場合

この plugin は軽量で、収集済み catalog データと保存済み skill ファイルだけを使います。

### `builtin.audit-promptfoo-security`

org-owned skill に対して `promptfoo` の red teaming を実行し、その結果を Harbor のラベルへ要約します。

GitHub: https://github.com/promptfoo/promptfoo

- 主目的: LLM ベースのセキュリティ / prompt 安全性監査
- 代表的なラベル: `Safe`, `Risk`, `Critical`, `Unknown`
- 向いている用途: `config.model` を設定したうえで、LLM ベースの security check を明示的に有効化したい場合

注意点:

- 現在は org-owned skill のみを対象にします
- HTML レポートを `data/assets/plugins/builtin.audit-promptfoo-security/` 配下に生成することがあります
- Harbor は `PROMPTFOO_DISABLE_TELEMETRY=1` と `PROMPTFOO_DISABLE_UPDATE=1` を付けて実行します
- それでも red team 機能の組み合わせによっては、`promptfoo` が別の外部通信を試みる可能性があります

サプライチェーンや外向き通信に強い制約がある場合は、この plugin を `post_collect.plugins` に入れる前に適用可否を確認してください。

### `builtin.audit-skill-scanner`

org-owned skill に対して Cisco `skill-scanner` を実行し、最大 severity を Harbor のラベルとして扱います。

GitHub: https://github.com/cisco-ai-defense/skill-scanner

- 主目的: 外部 LLM/API なしでのローカル skill セキュリティスキャン
- 代表的なラベル: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`, `safe`, `unknown`
- 向いている用途: Python 3.10+ と `skill-scanner` CLI を用意でき、ローカル static scan を有効化したい場合

注意点:

- 対象は org-owned skill のみです
- `command` のデフォルトは `skill-scanner` です
- `options` には追加 CLI フラグだけを渡せます。scan 対象や出力先は Harbor が固定で組み立てます
- Harbor は `--use-behavioral --use-trigger --lenient` を既定で付けます
- `--enable-meta` は API key が必要なため既定では付けません
- `report.html`, `report.sarif.json`, `report.json` を `data/assets/plugins/builtin.audit-skill-scanner/` 配下に保持します
- CLI 起動時に LiteLLM 経由の外向き通信を試みることがあります

## ユーザー定義プラグイン

ユーザー定義 plugin は任意機能で、次の場所から探索されます。

- `plugins/<id>/index.mjs`
- `plugins/<id>/index.js`
- `plugins/<id>/index.ts`

探索順は `mjs`、`js`、`ts` です。

plugin id には小文字英数字、`-`、`_` だけを使えます。

サンプル plugin を生成するには:

```bash
harbor gen sample-plugin
```

その後、`config/harbor.yaml` の `example_user_defined_plugin` をアンコメントしてください。
必要に応じて、そのまま plugin id や内容を実運用向けに変更してください。

## プラグイン出力

各 plugin の実行結果は次に履歴として保存されます。

- `data/plugins/<plugin-id>.yaml`

各ファイルには新しい順で複数回分が保存され、`data/collects.yaml` の `collect_id` と対応付けられます。

主な出力フィールド:

- `summary`: 実行結果の概要テキスト
- `label_intents`: 各ラベルに対する UI 表示用の intent（色分け）マッピング
- `sub_artifacts`: `data/assets/plugins/<plugin-id>/<normalized-skill-key>/` 配下に置く共通ファイル名配列
- `results`: スキルパスをキーとしたスキルごとの結果

### `label_intents` の値一覧

| 値        | 色       | 用途例                  |
| --------- | -------- | ----------------------- |
| `neutral` | グレー   | デフォルト / 不明な状態 |
| `info`    | 青       | 情報提供レベルの検出    |
| `success` | 緑       | 合格 / 同期済み         |
| `warn`    | アンバー | 警告 / 要確認           |
| `danger`  | 赤       | 失敗 / 重大な問題       |

各 skill ごとの `results` では:

- `label`: バッジやフィルター用の短いラベル
- `raw`: 詳細画面に出す自由文
- その他のキー: そのまま保持され、詳細画面で raw 表示されます

`builtin.audit-promptfoo-security` は追加で次のような値を持つことがあります。

- `findings`: 脆弱性 ID ごとの件数
- `reasons`: 脆弱性 ID ごとに grouped した promptfoo の理由文

## 副成果物

plugin は主成果物の YAML 以外にも、副作用としてファイルを出力できます。

それらを web アプリと一緒に配布したい場合は、次の場所に出力してください。

- `data/assets/plugins/<plugin-id>/...`

ユーザーが独自の静的ファイルを web と一緒に配布したい場合も、`data/assets/` 配下に置けば同じ仕組みで取り込まれます。

ファイル自体は引き続き plugin 実装が安定したパス規約で生成・更新しますが、共通ファイル名は plugin 出力の `sub_artifacts` に記録します。

`harbor build` 実行時には、Harbor が `data/assets/` を web のビルド成果物へコピーします。UI からリンクしたい HTML レポートなどはこの仕組みを使います。

生成プロジェクトでは build workflow が `tools/harbor/web` だけを install しますが、`--project-root` で対象プロジェクト root を渡すため、このコピー規約は同じです。

## Web UI での扱い

- Card / List / Skill detail では、最新 `collect_id` に一致する plugin 出力だけを使います
- Stats では `collect_id` ごとの plugin 履歴を使います
- `short_label` が設定されていれば、フィルター名やテーブル見出しに使われます
- `data/assets/` 配下のファイルは `harbor build` 時に web のビルド成果物へコピーされます
- Skill detail では `plugin_id`、`skill.key`、`sub_artifacts` から副成果物へのリンクを構築します

## ワークフロー

生成される `CollectSkills` workflow では、まず次の分離 install surface を使います。

- `tools/harbor/collector`
- `tools/harbor/post-collect`

そのうえで、次の順で実行します。

1. `collect`
2. `post-collect --collect-id ...`

これにより、収集処理と post-collect 処理を分離して後段だけ再実行しやすくしつつ、重い post-collect 依存を collect job に入れずに済みます。
