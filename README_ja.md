<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Know what your agents know.

組織向けの Agent Skill カタログ・ガバナンスツール。

## スクリーンショット

| スキルカタログ | スキル詳細 |
|:---:|:---:|
| ![スキルカタログ](docs/agent-skill-harbor-screenshot02.jpeg) | ![スキル詳細](docs/agent-skill-harbor-screenshot01.jpeg) |

## 概要

Agent Skill Harbor は、GitHub Organization 内のリポジトリから Agent Skill (SKILL.md) を収集し、ガバナンス管理機能を提供し、GitHub Pages 上でブラウズ可能なカタログを公開します。

- トレーサビリティ — 外部からインストールしたスキルも含め、すべてのスキルの出所・来歴を追跡可能
- 柔軟な監査 — 社内スキルの監査はプロンプトを柔軟に設定可能
- Serverless/DB-less — GitHub Actions でクローリング、データは Git に YAML/JSON として保存、GitHub Pages でプライベート・ホスティング
- 運用負荷なし/コスト最適 — 常時稼働リソースがないのでメンテナンスが楽で安価

## クイックスタート

```bash
pnpm install
pnpm dev
```

ビルドコマンド、スキル収集、プロジェクト構成については [ローカル開発](docs/02-local-development_ja.md) を参照してください。

## 組織へのセットアップ

1. このリポジトリを組織内にプライベートとしてクローン
2. GitHub リポジトリのシークレットを設定 (`ORG_GITHUB_TOKEN`)
3. GitHub Pages を有効化 (Settings > Pages > Source: GitHub Actions)
4. "Collect Skills" ワークフローを手動トリガーして初回収集を実行

詳細は [組織セットアップガイド](docs/01-organization-setup_ja.md) を参照してください。

## スキルの来歴追跡

[agent-command-sync](https://github.com/hatappo/agent-command-sync) (`acs`) を使ってスキルのインストール・管理を行うと、SKILL.md frontmatter の `_from` 履歴が自動記録され、すべてのスキルの出所を追跡できます。

## ドキュメント

- [組織セットアップ](docs/01-organization-setup_ja.md)
- [ローカル開発](docs/02-local-development_ja.md)
- [ガバナンスガイド](docs/03-governance-guide_ja.md)

## ライセンス

MIT
