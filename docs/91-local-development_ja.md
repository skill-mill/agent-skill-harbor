# ローカル開発

## ユーザー向け（npm パッケージ）

`npx agent-skill-harbor init` でプロジェクトを作成した場合:

```bash
pnpm install
pnpm dev          # 開発サーバーの起動
pnpm collect      # 組織からスキルを収集
pnpm build        # 静的サイトをビルド
pnpm preview      # ビルド結果をプレビュー
```

これらのスクリプトは内部的に `harbor` CLI を呼び出します。

## コントリビューター向け（ソースから）

### 前提条件

- Node.js 24+
- pnpm 10+

### はじめに

```bash
git clone https://github.com/skill-mill/agent-skill-harbor.git
cd agent-skill-harbor
pnpm install
pnpm setup:dev    # .env を作成し、demo repo の config/data/guide を取得
# .env を編集: GH_TOKEN, GH_ORG のコメントを外して設定
pnpm --dir packages/collector build
pnpm --dir packages/post-collect build
pnpm --dir packages/cli build
pnpm --dir packages/web build
node packages/cli/dist/bin/cli.js dev
```

開発サーバーは `http://localhost:5173` で起動します。

`pnpm setup:dev` は以下をプロジェクトルートに用意します（生成物はすべて gitignore 対象）:

1. `packages/cli/templates/init/.env.example` → `.env`
2. GitHub から `skill-mill/agent-skill-harbor-demo` の archive を取得
3. demo repo の `config/` → `config/`
4. demo repo の `data/` → `data/`
5. demo repo の `guide/` → `guide/`

このコマンドの実行にはネットワークアクセスが必要です。

### コマンド

```bash
node packages/cli/dist/bin/cli.js dev       # 開発サーバーの起動
node packages/cli/dist/bin/cli.js build     # CLI 経由でカタログサイトをビルド
node packages/cli/dist/bin/cli.js preview   # ビルド結果のプレビュー
cd packages/web && pnpm check          # web package の型チェック
cd packages/web && pnpm lint           # web package のリント
pnpm format       # Prettier でフォーマット
pnpm --dir packages/collector build    # packages/collector/ を変更した後に再ビルド
pnpm --dir packages/post-collect build # packages/post-collect/ を変更した後に再ビルド
pnpm --dir packages/cli build          # packages/cli/ を変更した後に再ビルド
pnpm --dir packages/web build          # packages/web/ を変更した後に再ビルド
GH_TOKEN=$(gh auth token) node packages/cli/dist/bin/cli.js collect
node packages/cli/dist/bin/cli.js post-collect --collect-id <collect_id>
pnpm setup:dev                # ローカルの demo config/data/guide を更新
```

demo データには `data/collects.yaml`、`data/skills.yaml`、sample plugin の出力が含まれます。

source リポジトリでビルド済み CLI を実行する場合は、`config/`、`data/`、`guide/` を正しく参照させるため、リポジトリルートで実行してください。

### 典型的な動作確認フロー

```bash
cd /Users/fumi/ws/hobby/agent-skill-harbor
pnpm install
pnpm setup:dev
pnpm --dir packages/collector build
pnpm --dir packages/post-collect build
pnpm --dir packages/cli build
pnpm --dir packages/web build

GH_TOKEN=$(gh auth token) node packages/cli/dist/bin/cli.js collect --force
grep -m1 '^  collect_id:' data/collects.yaml
node packages/cli/dist/bin/cli.js post-collect --collect-id <collect_id>
node packages/cli/dist/bin/cli.js build
node packages/cli/dist/bin/cli.js dev
node packages/cli/dist/bin/cli.js preview
```

source repository 上で collector -> post-collect -> web まで一連の動作確認を行うなら、この手順が最も分かりやすいです。ライブな開発サーバーを見たいときは `dev`、ビルド済み成果物を確認したいときは `preview` を使ってください。

### 注意: `harbor dev` と `pnpm --dir packages/web dev`

source repository から開発する場合は、次を使ってください。

```bash
node packages/cli/dist/bin/cli.js dev
```

次ではなく:

```bash
pnpm --dir packages/web dev
```

wrapper 経由の `harbor dev` は、Vite 起動前に `data/assets/` を `packages/web/static/assets/` へ staging するため、plugin の副成果物が開発中や prerender 中にも見えるようになります。`packages/web/` から直接 Vite を起動するとこの staging を通らないため、asset リンクが欠けたり stale なまま残ったりすることがあります。

TODO:

- wrapper ではなく web package 側の dev workflow に asset staging を寄せて、`pnpm --dir packages/web dev` も正式にサポートできるようにする

### プロジェクト構成

```
├── packages/collector/             # 公開 collect runtime package
├── packages/cli/
│   ├── bin/              # 薄い harbor wrapper
│   ├── src/cli/          # init/gen と command dispatch
│   └── templates/        # wrapper package に同梱されるプロジェクトテンプレート
├── packages/post-collect/         # 公開 post-collect runtime package
├── scripts/              # 開発用スクリプト (setup-dev, collect)
├── packages/web/         # SvelteKit フロントエンドアプリケーション
│   ├── src/cli/          # build/dev/preview/deploy command entrypoints
│   ├── src/lib/server/   # サーバーサイドデータ読み込み (catalog, docs)
│   ├── src/routes/       # ページ (カタログ, スキル詳細, グラフ, ドキュメント)
│   └── src/lib/i18n/     # 国際化 (en, ja)
├── guide/                # setup:dev で取得する demo guide コンテンツ
├── config/               # 設定ファイル（gitignore 対象、setup:dev で作成）
├── data/                 # 収集データ（gitignore 対象、setup:dev で作成）
└── docs/                 # ドキュメント
```

### 主要アーキテクチャ

- **`SKILL_HARBOR_ROOT` 環境変数**: データ・config・ドキュメントの読み取り先を制御。CLI 使用時はユーザーのプロジェクトディレクトリに自動設定。開発時はリポジトリルートにフォールバック。
- **`packages/web/vite.config.ts`**: `SKILL_HARBOR_ROOT` からコンパイル時定数 `__PROJECT_ROOT__` を注入。
- **`packages/web/src/lib/server/catalog.ts`**: プリレンダリング時に `data/skills.yaml` と `data/skills/` を読み込み。
- **`adapter-static`**: すべてのページはビルド時にプリレンダリングされ、静的 HTML として配信。サーバーランタイム不要。

### パッケージ構成

- **`agent-skill-harbor`**: `packages/cli/` を root に持つ公開 wrapper package。`harbor` 実行ファイル、`init`、`gen`、templates、command dispatch を含みます。
- **`agent-skill-harbor-collector`**: `packages/collector/` を root に持つ公開 collect runtime package。
- **`agent-skill-harbor-post-collect`**: `packages/post-collect/` を root に持つ公開 post-collect runtime package。`promptfoo` など重い依存はここに閉じ込めます。
- **`agent-skill-harbor-web`**: `packages/web/` を root に持つ公開 SvelteKit Web package。`build`、`dev`、`preview`、`deploy` もここが担当します。
- **install surface の分離**: 生成プロジェクトは `tools/harbor/collector`、`tools/harbor/post-collect`、`tools/harbor/web` を持ち、workflow ごとに必要な依存だけを install します。
- **依存の管理責務**: Web UI と SvelteKit の依存は `packages/web/package.json`、collect 専用依存は `packages/collector/package.json`、post-collect 専用依存は `packages/post-collect/package.json`、wrapper 専用依存は `packages/cli/package.json` に置きます。ルート `package.json` は workspace 管理専用です。

### リリース補足

- 変更が入った package だけを release します。
- 複数 package を release する場合は `agent-skill-harbor-web`、`agent-skill-harbor-collector`、`agent-skill-harbor-post-collect`、`agent-skill-harbor` の順を推奨します。
- 詳細なリリース手順は [92-release_ja.md](92-release_ja.md) を参照してください。
