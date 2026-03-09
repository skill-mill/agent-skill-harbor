# 組織セットアップ

組織に Agent Skill Harbor をデプロイする手順を説明します。

## 前提条件

- GitHub Enterprise Cloud（Web UI を GitHub Pages に Private でホストする場合のみ）
- Node.js 24+
- pnpm 10+（または npm）

## ステップ 1: プロジェクトの作成

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
```

設定ファイル、GitHub Actions ワークフロー、`agent-skill-harbor` に依存する `package.json` を含むプロジェクトが生成されます。

このプロジェクトを組織内の**プライベート**リポジトリにプッシュします。

> **別の方法:** [agent-skill-harbor リポジトリ](https://github.com/anthropics/agent-skill-harbor) を直接クローンすることもできます。詳しくはローカル開発ガイドを参照。

## ステップ 2: 環境設定

`.env` を編集（`init` で生成済み、全値はデフォルトでコメントアウト）:

| 変数       | 必須            | 説明                                      | デフォルト              |
| ---------- | --------------- | ----------------------------------------- | ----------------------- |
| `GH_TOKEN` | Yes（ローカル） | Organization の `repo` スコープを持つ PAT | —                       |
| `GH_ORG`   | No              | GitHub Organization 名                    | git remote から自動検出 |
| `GH_REPO`  | No              | このリポジトリ名（収集から除外）          | git remote から自動検出 |

## ステップ 3: GitHub シークレットと変数の設定

リポジトリの **Settings > Secrets and variables > Actions** を開きます。

### リポジトリ変数

| 変数     | 必須 | 説明                   | 例       |
| -------- | ---- | ---------------------- | -------- |
| `GH_ORG` | No   | GitHub Organization 名 | `my-org` |

### リポジトリシークレット

| シークレット | 必須 | 説明                                                                                       |
| ------------ | ---- | ------------------------------------------------------------------------------------------ |
| `GH_TOKEN`   | Yes  | Organization 内リポジトリの `repo` スコープを持つ PAT（classic）または GitHub App トークン |

トークンには、SKILL.md ファイルをスキャンするために Organization 内の全リポジトリへの読み取りアクセスが必要です。

## ステップ 4: GitHub Pages の有効化

1. **Settings > Pages** を開く
2. **Source** を **GitHub Actions** に設定
3. **Visibility** を **Private** に設定し、Organization メンバーのみにアクセスを制限する

> **警告:** Pages の Visibility を Private に設定しないと、カタログページ（収集されたすべてのスキルデータを含む）がインターネット上の誰からでもアクセス可能になります。GitHub Pages の Private 設定には **GitHub Enterprise Cloud** プランが必要です。

## ステップ 5: インストールと実行

```bash
# 依存関係のインストール
pnpm install

# 組織からスキルを収集
pnpm collect

# ローカルで確認
pnpm dev
```

## ステップ 6: 初回デプロイ

1. リポジトリにプッシュ
2. **Actions > Collect Skills** を開く
3. **Run workflow** をクリックして初回収集をトリガー
4. 収集完了後、"Deploy to GitHub Pages" ワークフローが自動実行されます

## ステップ 7: ガバナンスポリシーの設定

`config/governance.yaml` を編集して、組織のスキルポリシーを定義します:

```yaml
policies:
  github.com/your-org/your-repo/.claude/skills/your-skill/SKILL.md:
    usage_policy: recommended # recommended | discouraged | prohibited | none
    note: 'このステータスの理由'
```

変更をコミット・プッシュすると、デプロイワークフローが自動的に Web UI を再ビルドします。

## ステップ 8: 公開スキルの追加 (オプション)

Claude Code のスラッシュコマンドで公開スキルを追加できます:

```
/manage-skill add owner/repo
```

## バージョンアップグレード

Agent Skill Harbor は npm パッケージとしてインストールされるため、アップグレードは簡単です:

```bash
pnpm update agent-skill-harbor
```

設定ファイル（`config/`, `.env`）とデータ（`data/`）はパッケージの更新に影響されません。

## ワークフロー概要

```
┌──────────────────────────────┐
│  Collect Skills (定期実行)     │
│  - Org リポジトリをスキャン      │
│  - SKILL.md をパース           │
│  - YAML に書き出し             │
│  - コミット & プッシュ          │
└────────┬─────────────────────┘
         │ トリガー
         ▼
┌──────────────────────────────┐
│  Deploy Pages                │
│  - SvelteKit をビルド          │
│  - GitHub Pages にデプロイ     │
└──────────────────────────────┘
```
