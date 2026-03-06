# 組織セットアップ

組織に Agent Skill Harbor をデプロイする手順を説明します。

## 前提条件

- GitHub Enterprise Cloud（Web UI を GitHub Pages に Private でホストする場合のみ）
- Node.js 22+
- pnpm 10+

## ステップ 1: リポジトリのクローン

このリポジトリを組織内に**プライベート**リポジトリとしてクローンします。

```bash
git clone https://github.com/your-org/agent-skill-harbor.git
cd agent-skill-harbor
pnpm install
```

## ステップ 2: GitHub シークレットと変数の設定

リポジトリの **Settings > Secrets and variables > Actions** を開きます。

### リポジトリ変数

| 変数 | 必須 | 説明 | デフォルト | 例 |
|------|------|------|-----------|-----|
| `GH_ORG` | No | GitHub Organization 名 | git remote URL から自動検出 | `my-org` |
| `GH_REPO` | No | このリポジトリ名。収集時の自己除外とヘッダー表示に使用。 | git remote URL から自動検出 | `agent-skill-harbor` |

### リポジトリシークレット

| シークレット | 必須 | 説明 | デフォルト |
|------------|------|------|-----------|
| `ORG_GITHUB_TOKEN` | Yes | Organization 内リポジトリの `repo` スコープを持つ Personal Access Token (classic) または GitHub App トークン | — |

トークンには、SKILL.md ファイルをスキャンするために Organization 内の全リポジトリへの読み取りアクセスが必要です。

## ステップ 3: GitHub Pages の有効化

1. **Settings > Pages** を開く
2. **Source** を **GitHub Actions** に設定
3. **Visibility** を **Private** に設定し、Organization メンバーのみにアクセスを制限する

> **警告:** Pages の Visibility を Private に設定しないと、カタログページ（収集されたすべてのスキルデータを含む）がインターネット上の誰からでもアクセス可能になります。GitHub Pages の Private 設定には **GitHub Enterprise Cloud** プランが必要です。Enterprise Cloud をご利用でない場合、リポジトリの可視性に関わらず GitHub Pages は常に公開されます。

## ステップ 4: 初回スキル収集

1. **Actions > Collect Skills** を開く
2. **Run workflow** をクリックして初回収集をトリガー
3. ワークフローが Org 内の全リポジトリから SKILL.md ファイルをスキャンします
4. 収集されたデータは `data/` ディレクトリにコミットされます

## ステップ 5: ガバナンスポリシーの設定

`config/governance.yaml` を編集して、組織のスキルポリシーを定義します:

```yaml
policies:
  github.com/your-org/your-repo/.claude/skills/your-skill/SKILL.md:
    usage_policy: recommended    # recommended | discouraged | prohibited | none
    note: "このステータスの理由"
```

変更をコミット・プッシュすると、デプロイワークフローが自動的に Web UI を再ビルドします。

## ステップ 6: 公開スキルの追加 (オプション)

Claude Code のスラッシュコマンドで公開スキルを追加できます:

```
/manage-skill add owner/repo
```

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
