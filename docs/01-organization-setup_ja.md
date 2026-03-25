# 組織セットアップ

このガイドでは、Agent Skill Harbor を組織向けに立ち上げて運用する手順を説明します。

## 前提

- Node.js 24+
- pnpm 10+（または npm）
- 収集対象リポジトリを読める GitHub token
- GitHub Pages を private で使う場合は GitHub Enterprise Cloud

## 1. プロジェクトを生成

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
```

これで次が作られます。

- root `package.json`（`agent-skill-harbor`: CLI + web）
- `collector/package.json`（`agent-skill-harbor-collector`）
- `config/`, `data/`, `guide/`
- GitHub Actions workflow

## 2. 依存をインストール

```bash
pnpm install
pnpm install --dir collector
```

npm の場合:

```bash
npm install
npm install --prefix collector
```

## 3. `.env` を設定

必要に応じて `.env` を編集します。

| 変数       | 必須             | 説明                           |
| ---------- | ---------------- | ------------------------------ |
| `GH_TOKEN` | ローカル時は必須 | ローカル collect 用 token      |
| `GH_ORG`   | 任意             | GitHub Organization 名         |
| `GH_REPO`  | 任意             | 必要なら除外したいこの repo 名 |

## 4. GitHub Actions を設定

リポジトリ設定で次を追加します。

### Secrets

| Secret     | 必須 | 説明                         |
| ---------- | ---- | ---------------------------- |
| `GH_TOKEN` | Yes  | 収集対象 repo を読める token |

### Variables

| Variable | 必須 | 説明                   |
| -------- | ---- | ---------------------- |
| `GH_ORG` | 任意 | GitHub Organization 名 |

## 5. Pages を有効化

GitHub Pages の場合:

1. **Settings > Pages**
2. **Source** を **GitHub Actions**
3. org 内限定にしたい場合は **Visibility** を **Private**

Cloudflare Pages を使う場合は、Cloudflare 用 secrets を設定し、生成済み workflow を使います。

## 6. 一度ローカルで実行

```bash
pnpm collect
pnpm dev
```

`pnpm collect` の実体は:

```bash
node collector/node_modules/agent-skill-harbor-collector/dist/src/runtime/collect-command.js
```

です。

## 7. 初回 workflow 実行

プロジェクトを push したら `CollectSkills` を実行します。

生成される caller workflow は `wf-v0` の Harbor reusable workflow を参照します。

reusable workflow の中では:

1. `collect` job で collector core を install して収集
2. `post_collect` job で collect artifact を復元
3. `post_collect` で再度 collector core を install
4. `post_collect` で有効な optional plugin manifest だけ追加 install
5. 最終的な `data/` を commit

この境界は意図的です。

- `collect` は `GH_TOKEN` を使う
- `promptfoo` のような重い optional dependency は `post_collect` にだけ入る

## 8. optional plugin を有効化

組み込み plugin は `config/harbor.yaml` で有効化します。

plugin によっては `collector/plugins/<plugin-id>/` に runtime file も必要です。

例:

```bash
harbor setup builtin.audit-promptfoo-security
harbor setup builtin.audit-skill-scanner
harbor setup example-user-defined-plugin
```

`setup` 後に `config/harbor.yaml` の該当項目をアンコメントし、必要なら生成された runtime file 側も install してください。

詳細は [Post-Collect Plugins](03-post-collect-plugins_ja.md) を参照してください。
