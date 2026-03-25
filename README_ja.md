<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# Agent Skill Harbor

> Skill Governance for companies.  
> Skill Discovery for teams.

Agent Skill Harbor は、GitHub Organization 内の Agent Skill (`SKILL.md`) を収集し、社内向けのカタログとして公開するためのツールです。

## 機能

- ガバナンス: 推奨・非推奨・禁止スキルを明示できる
- 来歴追跡: コピー元や導入元を追跡できる
- スキル解析: `builtin.audit-skill-scanner` plugin が収集したスキルを解析し安全性を監査
- Slack 通知: `builtin.notify-slack` plugin で収集・集計後のサマリを通知

## 特長

- Serverless: カタログ UI は prerender 済みの静的 Web アプリ
- DB-less ＆ Git Native: 収集結果は `data/` に YAML/JSON で保存し、Git に commit する
- GitHub Native: GitHub Actions でデータ更新し GitHub Pages でホストする

デモサイト:

- https://skill-mill.github.io/agent-skill-harbor-demo/

## クイックスタート

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor

pnpm install
pnpm install --dir collector

# .env で GH_ORG を設定

gh auth login && GH_TOKEN=$(gh auth token) pnpm collect
# あるいは .env で GH_TOKEN を設定してから:
# pnpm collect
pnpm dev
```

`pnpm install` は root package (`agent-skill-harbor`) を入れます。  
`pnpm install --dir collector` は `pnpm collect` / `pnpm post-collect` に必要な collector runtime を入れます。

## CLI コマンド

インストール後のメイン CLI は `harbor` または `agent-skill-harbor` として利用できます。

| コマンド                   | 説明                                 |
| -------------------------- | ------------------------------------ |
| `harbor init [dir]`        | 新しいプロジェクトを生成             |
| `harbor setup <plugin-id>` | 任意 plugin 用の runtime file を生成 |

日常的な project 操作は、生成される root scripts から実行します。

```bash
pnpm collect
pnpm post-collect
pnpm dev
pnpm build
pnpm preview
```

## 組織セットアップ

1. `npx agent-skill-harbor init` でプロジェクトを作成
2. Organization 内の private repository に push
3. GitHub Actions secret として `GH_TOKEN` を設定
4. GitHub Pages または Cloudflare Pages を有効化
5. 生成された `CollectSkills` workflow を一度実行

生成される `CollectSkills` workflow は、`wf-v0` に pin された Harbor の reusable workflow を呼ぶ薄い caller です。

reusable workflow の中では:

- `collect` job で `collector/` core だけを install して収集
- `post_collect` job で収集 artifact を復元し、再度 `collector/` core を install した上で、有効な optional plugin manifest だけ追加 install
- 最終的な `data/` を commit

という構造になっています。これにより、GitHub 収集と optional な post-collect 依存を分離できます。

詳細は [組織セットアップ](docs/01-organization-setup_ja.md) を参照してください。

## プロジェクト構成

```sh
my-skill-harbor/
├── .github/workflows/
│
├── config/
│   ├── harbor.yaml         # アプリケーションの全般的設定
│   └── governance.yaml     # 追加のガバナンス設定
│
├── collector/              # スキル収集バッチ処理
│   ├── package.json
│   └── plugins/
│       └── <plugin-id>/    # プラグインごとのマニフェストやコード
│
├── data/
│   ├── assets/
│   ├── collects.yaml       # スキル収集処理の履歴
│   ├── plugins/            # プラグインごとの成果物
│   ├── skills.yaml         # 収集したスキルの一覧
│   └── skills/             # 収集したスキルのファイルのキャッシュ
│
├── .env
│
├── guide/
│
└── package.json            # Web UI のマニフェスト
```

補足:

- root `package.json` は `agent-skill-harbor` だけに依存
- `collector/package.json` は `agent-skill-harbor-collector` 用の Harbor 管理 manifest
- optional plugin manifest と example user-defined plugin は `collector/plugins/<plugin-id>/` に置く

## Post-Collect Plugins

組み込み plugin は `config/harbor.yaml` で有効化します。

例:

- `builtin.detect-drift`
- `builtin.notify-slack`
- `builtin.audit-promptfoo-security`
- `builtin.audit-skill-scanner`

optional な runtime file は `harbor setup` で生成します。

```bash
harbor setup example-user-defined-plugin
harbor setup builtin.audit-promptfoo-security
harbor setup builtin.audit-skill-scanner
```

生成先は `collector/plugins/<plugin-id>/` です。

詳細は [Post-Collect Plugins](docs/03-post-collect-plugins_ja.md) を参照してください。

## ドキュメント

- [組織セットアップ](docs/01-organization-setup_ja.md)
- [スキルカタログガイド](docs/02-skill-catalog_ja.md)
- [Post-Collect Plugins](docs/03-post-collect-plugins_ja.md)
- [ガバナンスガイド](docs/04-governance-guide_ja.md)
- [ローカル開発](docs/91-local-development_ja.md)
- [リリース](docs/92-release_ja.md)

## ライセンス

MIT
