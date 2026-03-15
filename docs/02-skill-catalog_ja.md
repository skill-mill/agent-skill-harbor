# Skill Catalog Guide

Agent Skill Harbor は、収集した `SKILL.md` と関連メタデータから、ブラウズ可能なスキルカタログを構築します。

## カタログ画面

Web アプリでは、収集したスキルを複数の見方で確認できます。

- Card view: サマリ付きで素早く一覧する画面
- List view: より高密度に比較する画面
- Stats view: リポジトリ数、所有区分、鮮度などを確認する画面
- Graph view: リポジトリ間と来歴の関係を可視化する画面
- Skill detail view: 個別スキル、関連ファイル、コピー元を確認する画面

これらの画面は `data/skills.yaml` と `data/skills/` 配下のキャッシュ済みファイルを読み取って表示します。

## 来歴追跡

Harbor は、ダウンロードしたスキルに来歴メタデータが含まれていれば、そのコピー元を追跡して表示できます。

対応している情報源:

- [agent-skill-porter](https://github.com/skill-mill/agent-skill-porter) が書き込む `_from` frontmatter
- [agent-skills](https://github.com/vercel-labs/skills) / `vercel-labs/agent-skills` が保存する GitHub ベースの `skills-lock.json`

現在の挙動:

- `_from` を主方式として優先
- `skills-lock.json` は `_from` が無い場合のみ fallback として利用
- `skills-lock.json` fallback は現時点では GitHub source のみ対応

collect 時には、検出した来歴を `data/skills.yaml` の `resolved_from` に正規化して保存するため、UI は単一の来歴フィールドを参照できます。
