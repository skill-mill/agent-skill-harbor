<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Skill Governance for companies.  
> Skill Discovery for teams.

組織とチームのための Skill 管理ツール。

## スクリーンショット

|                                                             カードビュー                                                              |                                                             リストビュー                                                              |
| :-----------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
| ![カードビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-card.png) | ![リストビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-list.png) |

|                                                              統計ビュー                                                              |                                                              グラフビュー                                                              |
| :----------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------: |
| ![統計ビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-stats.png) | ![グラフビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-graph.gif) |

## 概要

Agent Skill Harbor は、GitHub Organization 内のリポジトリから Agent Skill (SKILL.md) を収集し、ガバナンス管理機能を提供し、GitHub Pages または Cloudflare Pages 上でブラウズ可能なカタログを公開します。

- トレーサビリティ — 外部からインストールしたスキルも含め、すべてのスキルの出所・来歴を追跡可能
- Serverless/DB-less — GitHub Actions でクローリング、データは Git に YAML/JSON として保存、GitHub Pages または Cloudflare Pages でホスティング
- 運用負荷なし/コスト最適 — 常時稼働リソースがないのでメンテナンスが楽で安価

## クイックスタート

### npm パッケージ（推奨）

```bash
# 新しいプロジェクトをスキャフォールド
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor

# .env を編集: GH_TOKEN と GH_ORG のコメントを外して設定
# または gh CLI を利用: GH_TOKEN=$(gh auth token) pnpm collect

# 依存関係のインストール
pnpm install

# 組織からスキルを収集
pnpm collect

# 開発サーバーの起動
pnpm dev
```

### ソースから（開発者向け）

```bash
git clone https://github.com/anthropics/agent-skill-harbor.git
cd agent-skill-harbor
pnpm install
pnpm setup:dev    # テンプレートとフィクスチャをコピー
pnpm dev
```

## CLI コマンド

依存パッケージとしてインストール後、`harbor` または `agent-skill-harbor` として利用可能：

| コマンド                 | 説明                                 |
| ------------------------ | ------------------------------------ |
| `harbor init [dir]`      | 新しいプロジェクトをスキャフォールド |
| `harbor collect`         | GitHub Organization からスキルを収集 |
| `harbor build`           | 静的サイトをビルド                   |
| `harbor deploy <target>` | ビルド済みカタログをデプロイ         |
| `harbor dev`             | 開発サーバーを起動                   |
| `harbor preview`         | ビルド結果をプレビュー               |

### ビルドオプション

```bash
# GitHub Pages デプロイ用のベースパスを設定
harbor build --base=/my-repo-name
```

## 組織へのセットアップ

1. `npx agent-skill-harbor init` で新しいプロジェクトを作成
2. GitHub リポジトリのシークレットを設定 (`GH_TOKEN`)
3. 利用するホスティング先を設定
4. GitHub Pages: Settings > Pages > Source を GitHub Actions に設定
5. Cloudflare Pages（任意）: GitHub 側に `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT_NAME` を設定
6. Cloudflare Pages Basic 認証: Cloudflare Pages 側の環境変数に `CLOUDFLARE_PW_<USERNAME>` を1つ以上設定
7. `DeployGitHubPages` または `DeployCloudflarePages` のどちらか一方で `workflow_run` を有効化
8. `CollectSkills` ワークフローを手動トリガーして初回収集を実行
9. 有効化した deploy workflow が収集成功後に自動実行されます
10. `DeployCloudflarePages` は production のみをデプロイし、手動実行も `main` のみを許可します

詳細は [組織セットアップガイド](docs/01-organization-setup_ja.md) を参照してください。

## プロジェクト構成（ユーザープロジェクト）

```
my-skill-harbor/
├── .env                    # GitHub トークンと Org 設定
├── config/
│   ├── settings.yaml       # 収集・カタログ設定
│   └── governance.yaml     # スキル使用ポリシー
├── data/                   # collect で生成（Git 管理）
│   ├── skills.yaml         # スキルメタデータ
│   └── skills/             # キャッシュされた SKILL.md ファイル
├── .github/workflows/      # GitHub Actions (収集 + デプロイ)
└── package.json            # agent-skill-harbor に依存
```

## スキルの来歴追跡

[agent-command-sync](https://github.com/hatappo/agent-command-sync) (`acs`) を使ってスキルのインストール・管理を行うと、SKILL.md frontmatter の `_from` 履歴が自動記録され、すべてのスキルの出所を追跡できます。

## ドキュメント

- [組織セットアップ](docs/01-organization-setup_ja.md)
- [ローカル開発](docs/02-local-development_ja.md)
- [ガバナンスガイド](docs/03-governance-guide_ja.md)

## ライセンス

MIT
