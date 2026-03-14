# Audit ガイド

Agent Skill Harbor は、`harbor collect` 後に収集済みスキルを監査し、危険な指示や懸念点を検出できます。

監査は built-in の `static` engine と、利用者定義の engine の両方に対応します。

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
  fail_on: fail
  exclude_community_repos: true
  engines:
    - id: static
    - id: company-policy
      command: ['python3', 'scripts/company-policy-audit.py']
      timeout_sec: 10
```

### フィールド

- `fail_on`: 最終監査結果がこのレベル以上なら終了コード `1` を返します
- `exclude_community_repos`: `true` の場合、自組織以外のスキルを監査対象から除外します
- `engines`: 実行する監査 engine の順序付きリスト

### Engine 設定ルール

- すべての engine に `id` が必要です
- `static` は built-in engine 名です
- built-in engine には `command` は不要です
- 利用者定義 engine には `command` が必須です
- `timeout_sec` は任意で、1スキルに対する1回の engine 実行ごとに適用されます
- `timeout_sec` 未指定時、利用者定義 engine には `30` 秒が適用されます
- `timeout_sec` は `1` 以上 `300` 以下で指定します

## 利用者定義 Engine の実行環境準備

Harbor は設定された engine のコマンドを実行するだけで、Python 本体や pip パッケージなどの依存は自動インストールしません。

追加ランタイムが必要な engine を使う場合は、`harbor audit` を実行する環境側で事前に準備します。

### GitHub Actions の例

Python ベースの engine を使う場合は、`npx harbor audit` の前に `AuditSkills` workflow でセットアップします。

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'

- name: Install Python audit dependencies
  run: pip install -r scripts/audit-requirements.txt

- name: Audit collected skills
  run: npx harbor audit
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
harbor audit --engines static,company-policy
```

- `--force`: `tree_sha` に変更がなくても再監査します
- `--engines`: この実行時だけ設定済み engine 一覧を上書きします

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
	"result": "warn"
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

- `result`: 必須。`pass`, `warn`, `fail` のいずれか
- `summary`: 任意の短い説明
- `findings`: 任意の検出結果一覧

### Finding 項目

- `level`: 任意。`warn`, `fail` のいずれか
- `summary`: 推奨。短い説明
- `file`: 任意。スキルディレクトリ内の相対パス
- `line`: 任意。1 始まりの行番号
- `category`: 任意。Harbor 側の分類ラベル
- `references`: 任意。`2026-ASI03` のような外部参照 ID

## 出力

監査結果は `data/audit-results.yaml` に保存されます。

各スキルごとに以下を保持します。

- `skill_key`
- `tree_sha`
- `engines.<id>.result`
- `engines.<id>.summary`
- `engines.<id>.findings`

スキル全体の最終結果は、必要なときに engine ごとの結果から導出します。

- `fail > warn > pass`

## Timeout の挙動

`timeout_sec` は監査全体ではなく、1スキルに対する1回の engine 実行ごとに評価されます。

たとえばある engine に `timeout_sec: 30` を設定した場合、その engine は各スキルごとに最大 30 秒まで実行され、それを超えると Harbor は失敗として扱います。

workflow の停止を避けるため、以下の制約があります。

- 既定値: `30` 秒
- 上限値: `300` 秒

## Built-in Static Engine

built-in の `static` engine は、キャッシュ済み Markdown ファイルから危険なパターンを検出します。

以下のような付加情報を findings に含めることがあります。

- `permission_scope`, `external_communication` などの `category`
- `2026-ASI03` のような `references`

これらは公開契約上は任意ですが、built-in engine では結果の理解を助けるために活用します。
