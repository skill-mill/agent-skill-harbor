# Post-Collect Plugins

Agent Skill Harbor では、各 `collect` の後に plugin を実行できます。

## ビルトインプラグイン

現在のビルトインプラグインは次の 2 つです。

- `builtin.detect-drift`
- `builtin.audit-static`

`config/harbor.yaml` で設定します。

```yaml
post_collect:
  plugins:
    - id: builtin.detect-drift
      short_label: Drift
    - id: builtin.audit-static
      short_label: Audit
```

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

その後、`config/harbor.yaml` の `sample_plugin` をアンコメントしてください。

## プラグイン出力

各 plugin の実行結果は次に履歴として保存されます。

- `data/plugins/<plugin-id>.yaml`

各ファイルには新しい順で複数回分が保存され、`data/collects.yaml` の `collect_id` と対応付けられます。

主な出力フィールド:

- `summary`: 実行結果の概要テキスト
- `label_intents`: 各ラベルに対する UI 表示用の intent（色分け）マッピング
- `results`: スキルパスをキーとしたスキルごとの結果

### `label_intents` の値一覧

| 値        | 色     | 用途例                       |
|-----------|--------|------------------------------|
| `neutral` | グレー | デフォルト / 不明な状態      |
| `info`    | 青     | 情報提供レベルの検出         |
| `success` | 緑     | 合格 / 同期済み              |
| `warn`    | アンバー | 警告 / 要確認               |
| `danger`  | 赤     | 失敗 / 重大な問題            |

各 skill ごとの `results` では:

- `label`: バッジやフィルター用の短いラベル
- `raw`: 詳細画面に出す自由文
- その他のキー: そのまま保持され、詳細画面で raw 表示されます

## Web UI での扱い

- Card / List / Skill detail では、最新 `collect_id` に一致する plugin 出力だけを使います
- Stats では `collect_id` ごとの plugin 履歴を使います
- `short_label` が設定されていれば、フィルター名やテーブル見出しに使われます

## ワークフロー

生成される `CollectSkills` workflow では、次の順で実行します。

1. `collect`
2. `post-collect --collect-id ...`

これにより、収集処理と post-collect 処理を分離し、後段だけ再実行しやすくしています。
