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

> **別の方法:** [agent-skill-harbor リポジトリ](https://github.com/skill-mill/agent-skill-harbor) を直接クローンすることもできます。詳しくはローカル開発ガイドを参照。

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
2. **Actions > CollectSkills** を開く
3. **Run workflow** をクリックして初回収集をトリガー
4. 収集完了後、`AuditSkills` ワークフローが自動実行されます
5. 監査完了後、デプロイワークフローが自動実行されます

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

## Cloudflare Pages へのデプロイ（代替）

GitHub Pages の代わりに Cloudflare Pages にデプロイできます。GitHub Enterprise Cloud なしで Basic 認証を利用したい場合に便利です。

### 1. シークレットの設定

GitHub リポジトリの **Settings > Secrets and variables > Actions** に以下を追加します:

| シークレット                    | 必須 | 説明                                         |
| ------------------------------- | ---- | -------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`          | Yes  | Pages 編集権限を持つ Cloudflare API トークン |
| `CLOUDFLARE_ACCOUNT_ID`         | Yes  | Cloudflare アカウント ID                     |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Yes  | Cloudflare Pages プロジェクト名              |

### 2. Basic 認証の設定（任意）

Cloudflare Pages プロジェクト設定の環境変数に `CLOUDFLARE_PW_<USERNAME>` を1つ以上設定すると、カタログを Basic 認証で保護できます。

### 3. デプロイワークフローの切り替え

`.github/workflows/` 内の `DeployCloudflarePages` で `workflow_run` を有効化し、`DeployGitHubPages` 側は無効化します。どちらのデプロイワークフローも `AuditSkills` を起点にし、有効にするデプロイワークフローは1つだけにしてください。

> **注意:** `DeployCloudflarePages` は production のみをデプロイし、手動実行も `main` のみを許可します。

## バージョンアップグレード

Agent Skill Harbor は npm パッケージとしてインストールされるため、アップグレードは簡単です:

```bash
pnpm update agent-skill-harbor
```

設定ファイル（`config/`, `.env`）とデータ（`data/`）はパッケージの更新に影響されません。

## ワークフロー概要

```
┌──────────────────────────────┐
│  CollectSkills (定期実行)      │
│  - Org リポジトリをスキャン      │
│  - SKILL.md をパース           │
│  - YAML に書き出し             │
│  - コミット & プッシュ          │
└────────┬─────────────────────┘
         │ トリガー
         ▼
┌──────────────────────────────┐
│  AuditSkills                 │
│  - 設定済み監査を実行           │
│  - 監査結果を書き出し           │
│  - コミット & プッシュ          │
└────────┬─────────────────────┘
         │ トリガー
         ▼
┌──────────────────────────────┐
│  DeployGitHubPages           │
│  - SvelteKit をビルド          │
│  - GitHub Pages にデプロイ     │
└──────────────────────────────┘
```
