<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Skill Governance for companies.  
> Skill Discovery for teams.

組織とチームのための Skill 管理ツール。

## スクリーンショット

|                                                             カードビュー                                                              |                                                             リストビュー                                                              |
| :-----------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------: |
| ![カードビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-card.png) | ![リストビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-list.png) |

### 統計ビュー

![統計ビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-stats.png)

### グラフビュー

![グラフビュー](https://raw.githubusercontent.com/skill-mill/agent-skill-harbor/main/docs/img/agent-skill-harbor-screenshot-graph.gif)

## 概要

Agent Skill Harbor は、GitHub Organization 内の全リポジトリから Agent Skill (SKILL.md) をカタログ化し、組織内でブラウズ可能なカタログを公開します。

- ガバナンス — 禁止したいスキル、推奨したいスキルをチームにアピール可能
- スキル・トレーサビリティ — 外部からインストールしたスキルも含め、すべてのスキルの出所・来歴を追跡可能
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

## CLI コマンド

初期構築・データ収集・ビルド・デプロイをサポートする CLI でアプリケーションを管理・操作します。本番環境では、すべての CLI コマンドは GitHub Actions から実行されます。

依存パッケージとしてインストール後、`harbor` または `agent-skill-harbor` として利用可能：

| コマンド                   | 説明                                 |
| -------------------------- | ------------------------------------ |
| `harbor init [dir]`        | 新しいプロジェクトをスキャフォールド |
| `harbor gen sample-plugin` | サンプル post-collect plugin を生成  |
| `harbor collect`           | GitHub Organization からスキルを収集 |
| `harbor post-collect`      | collect 後プラグインを実行           |
| `harbor build`             | 静的サイトをビルド                   |
| `harbor deploy <target>`   | ビルド済みカタログをデプロイ         |
| `harbor dev`               | 開発サーバーを起動                   |
| `harbor preview`           | ビルド結果をプレビュー               |

### ビルドオプション

```bash
# GitHub Pages デプロイ用のベースパスを設定
harbor build --base=/my-repo-name
```

## 組織へのセットアップ

1. `npx agent-skill-harbor init` で新しいプロジェクトを作成
2. GitHub リポジトリのシークレットを設定 (`GH_TOKEN`)
3. GitHub Pages を有効化（Settings > Pages > Source: GitHub Actions）
4. **重要:** Pages の Visibility を **Private** に設定し、Organization メンバーのみにアクセスを制限（GitHub Enterprise Cloud が必要）
5. `CollectSkills` ワークフローを手動トリガーして初回収集を実行
6. `CollectSkills` では `collect` と `post-collect` を別 step で順に実行します
7. `CollectSkills` 成功後、デプロイワークフローが自動実行されます

ユーザー定義の post_collect plugin は `plugins/<id>/index.mjs`、次に `index.js`、最後に `index.ts` の順で探索されます。
サンプル plugin が必要な場合は `harbor gen sample-plugin` を実行し、`config/harbor.yaml` の `sample_plugin` をアンコメントしてください。

詳細は [組織セットアップガイド](docs/01-organization-setup_ja.md) を参照してください。

## プロジェクト構成（ユーザープロジェクト）

```
my-skill-harbor/
├── .env                    # GitHub トークンと Org 設定
├── config/
│   ├── harbor.yaml         # 収集・カタログ設定
│   └── governance.yaml     # スキル使用ポリシー
├── plugins/                # 任意のユーザー定義 post_collect plugin
├── data/                   # collect で生成（Git 管理）
│   ├── collects.yaml       # 収集履歴
│   ├── plugins/            # 生成された post_collect plugin 出力
│   ├── skills.yaml         # スキルメタデータ
│   └── skills/             # キャッシュされた SKILL.md ファイル
├── .github/workflows/      # GitHub Actions (収集 + デプロイ)
└── package.json            # agent-skill-harbor に依存
```

## スキルの来歴追跡

Harbor は、ダウンロードしたスキルにコピー元メタデータが含まれていれば、その来歴を追跡できます。

主な連携先は [agent-skill-porter](https://github.com/skill-mill/agent-skill-porter) で、skill frontmatter の `_from` を使って来歴を解決します。加えて、[agent-skills](https://github.com/vercel-labs/skills) / `vercel-labs/agent-skills` が保存する GitHub ベースの `skills-lock.json` にも対応しています。

カタログ画面の構成と来歴追跡の挙動の詳細は [Skill Catalog Guide](docs/02-skill-catalog_ja.md) を参照してください。

## ドキュメント

- [組織セットアップ](docs/01-organization-setup_ja.md)
- [スキル カタログ ガイド](docs/02-skill-catalog_ja.md)
- [ガバナンス ガイド](docs/04-governance-guide_ja.md)
- [ローカル開発](docs/91-local-development_ja.md)
- [リリース](docs/92-release_ja.md)

## ライセンス

MIT
