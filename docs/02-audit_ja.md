# Audit ガイド

Agent Skill Harbor は、`harbor collect` 後に収集済みスキルを監査し、危険な指示や懸念点を検出できます。

監査は built-in の `builtin.static` engine と、利用者定義の engine の両方に対応します。

## 監査対象

`harbor audit` は `data/skills/` 配下のキャッシュ済みスキルを対象に動作します。

- 各スキルは `skill_key` で識別されます
- engine は `data/skills/<skill_key>` から `SKILL.md` を解決します
- 同じスキルディレクトリ内の関連 Markdown ファイルも監査対象にできます

デフォルトでは、自組織が所有するリポジトリ由来のスキルのみを監査します。

## 設定

監査設定は `config/harbor.yaml` で定義します。

```yaml
audit:
  exclude_community_repos: true
  engines:
    - id: builtin.static
    - id: company-policy
      command: ['python3', 'scripts/company-policy-audit.py']
      timeout_sec: 10
```

### フィールド

- `exclude_community_repos`: `true` の場合、自組織以外のスキルを監査対象から除外します
- `engines`: 実行する監査 engine の順序付きリスト

### Engine 設定ルール

- すべての engine に `id` が必要です
- `builtin.static` は built-in engine の ID です
- built-in engine には `command` は不要です
- 利用者定義 engine には `command` が必須です
- `timeout_sec` は任意で、1スキルに対する1回の engine 実行ごとに適用されます
- `timeout_sec` 未指定時、利用者定義 engine には `30` 秒が適用されます
- `timeout_sec` は `1` 以上 `300` 以下で指定します

## 利用者定義 Engine の実行環境準備

Harbor は設定された engine のコマンドを実行するだけで、Python 本体や pip パッケージなどの依存は自動インストールしません。

追加ランタイムが必要な engine を使う場合は、`harbor audit` を実行する環境側で事前に準備します。

### GitHub Actions の例

GitHub Actions で Python ベースの engine を使う場合は、`npx harbor audit` の前に `CollectAndAuditSkills` workflow でセットアップします。

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'

- name: Install Python audit dependencies
  run: pip install -r scripts/audit-requirements.txt

- name: Collect skills
  id: collect
  run: npx harbor collect

- name: Audit collected skills
  run: npx harbor audit --history-id "${{ steps.collect.outputs.history_id }}"
```

### ローカル実行

ローカルで実行する場合も、必要なランタイムと依存は事前に自分で準備してから `harbor audit` を呼び出します。

例:

- `python3` + `pip install -r scripts/audit-requirements.txt`
- `uv run python scripts/company-policy-audit.py`
- `node scripts/company-policy-audit.mjs`

## 実行方法

```bash
harbor collect
harbor audit
```

利用可能なオプション:

```bash
harbor audit --force
harbor audit --engines builtin.static,company-policy
harbor audit --history-id 550e8400-e29b-41d4-a716-446655440000
```

- `--force`: `tree_sha` に変更がなくても再監査します
- `--engines`: この実行時だけ設定済み engine 一覧を上書きします
- `--history-id`: 既存の `collect-history.yaml` entry に監査サマリを紐付けます

`harbor audit` は常に `data/report.yaml` を更新します。履歴エントリを更新するのは `--history-id` を付けた場合だけです。
監査結果の `warn` や `fail` は CLI の終了コードには反映しません。非ゼロ終了になるのは、設定不正、engine 異常終了、不正 JSON など技術的な失敗だけです。

## Engine 契約

Harbor は各 engine をプロジェクトルートで実行し、標準入力で `skill_key` を渡します。

stdin の例:

```text
github.com/example-org/internal-tools/skills/db-admin/SKILL.md
```

engine は標準出力で JSON を返します。

最小の有効レスポンス:

```json
{
	"result": "info"
}
```

詳細付きレスポンス:

```json
{
	"result": "warn",
	"summary": "外部送信の疑いを検出",
	"findings": [
		{
			"level": "warn",
			"summary": "外部 URL への送信指示",
			"file": "SKILL.md",
			"line": 18,
			"category": "external_communication",
			"references": ["2026-ASI03", "2026-ASI09"]
		}
	]
}
```

### レスポンス項目

- `result`: 必須。`pass`, `info`, `warn`, `fail` のいずれか
- `summary`: 任意の短い説明
- `findings`: 任意の検出結果一覧

### Finding 項目

- `level`: 任意。`info`, `warn`, `fail` のいずれか
- `summary`: 推奨。短い説明
- `file`: 任意。スキルディレクトリ内の相対パス
- `line`: 任意。1 始まりの行番号
- `category`: 任意。Harbor 側の分類ラベル
- `references`: 任意。`2026-ASI03` のような外部参照 ID

## 出力

最新の監査結果は `data/report.yaml` に保存されます。

`--history-id` を付けて実行した場合は、対応する `collect-history.yaml` の entry に `auditing` と `report` のサマリも保存されます。

各スキルごとに以下を保持します。

- `skill_key`
- `tree_sha`
- `engines.<id>.result`
- `engines.<id>.summary`
- `engines.<id>.findings`

スキル全体の最終結果は、必要なときに engine ごとの結果から導出します。

- `fail > warn > info > pass`

## Timeout の挙動

`timeout_sec` は監査全体ではなく、1スキルに対する1回の engine 実行ごとに評価されます。

たとえばある engine に `timeout_sec: 30` を設定した場合、その engine は各スキルごとに最大 30 秒まで実行され、それを超えると Harbor は失敗として扱います。

workflow の停止を避けるため、以下の制約があります。

- 既定値: `30` 秒
- 上限値: `300` 秒

## Built-in Static Engine

built-in の `builtin.static` engine は、キャッシュ済み Markdown ファイルから危険なパターンを検出します。

> 注意: `builtin.static` はまだアルファ品質で、誤検知も多いです。

以下のような付加情報を findings に含めることがあります。

- `permission_scope`, `external_communication` などの `category`
- `2026-ASI03` のような `references`

これらは公開契約上は任意ですが、built-in engine では結果の理解を助けるために活用します。

### Static 監査カテゴリ

built-in の `builtin.static` engine は、現在以下の観点で findings を分類します。

| Category                 | 見る内容                                               | 典型的なマッチ例                                                                    | 既定レベル               | References                 |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------ | -------------------------- |
| `instruction_safety`     | システム/開発者指示の上書きや無効化                    | `ignore previous`, `override system`, `<system>`, `you are now`                     | `warn`                   | `2026-ASI01`, `2026-ASI02` |
| `capability_risk`        | 破壊的操作やコード実行シグナル                         | `rm -rf`, `eval(`, `exec(`, `execSync(`, `child_process`, `os.system`, `subprocess` | `info` / `warn` / `fail` | `2026-ASI03`, `2026-ASI05` |
| `permission_scope`       | 権限昇格や危険な権限前提                               | `sudo`, `chmod 777`, `--privileged`, `as root`                                      | `info`                   | `2026-ASI04`, `2026-ASI05` |
| `data_handling`          | 秘密情報や認証情報、機微なローカルファイルへのアクセス | `process.env`, `api_key`, `secret`, `token`, `password`, `.env`, `~/.ssh`           | `info`                   | `2026-ASI06`               |
| `external_communication` | 外部通信やデータ送信に関わるパターン                   | `curl`, `wget`, `fetch(`, `https://`, `webhook`                                     | `info`                   | `2026-ASI03`, `2026-ASI09` |
| `provenance_trust`       | 供給元やサプライチェーンに関する参照                   | `_from:`, `forked from`, `upstream`, `mirror`                                       | `info`                   | `2026-ASI07`, `2026-ASI09` |
| `transparency`           | ユーザーへの通知や確認を避ける指示                     | `do not tell`, `hide this`, `silently`, `without asking`, `without confirmation`    | `warn`                   | `2026-ASI10`               |
| `resource_abuse`         | 無限ループや過剰再試行などのリソース枯渇パターン       | `while true`, `infinite loop`, `fork bomb`, `retry forever`, `until it works`       | `warn`                   | `2026-ASI08`               |

補足:

- これは cached Markdown に対する単純なパターン検出であり、完全な文脈理解ではありません。
- findings は「マッチした行ごと」に出るため、同じカテゴリで複数件出ることがあります。
- built-in の最終 `result` は、`fail` があれば `fail`、`warn` があれば `warn`、`info` だけなら `info`、何も無ければ `pass` です。
- コメント、サンプルコード、`process.env`、外部 URL などの弱いシグナルは、可能な限り `info` に寄せる方針です。
