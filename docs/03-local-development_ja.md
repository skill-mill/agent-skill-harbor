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
pnpm setup:dev    # テンプレートとフィクスチャをコピー
# .env を編集: GH_TOKEN, GH_ORG のコメントを外して設定
tsx cli/bin/cli.ts dev
```

開発サーバーは `http://localhost:5173` で起動します。

`pnpm setup:dev` は以下をプロジェクトルートにコピーします（すべて gitignore 対象）:

1. `cli/templates/init/.env.example` → `.env`
2. `cli/templates/init/config/*` → `config/`
3. `fixtures/config/*` → `config/`（サンプルのガバナンスポリシーで上書き）
4. `fixtures/data/*` → `data/`（サンプルのカタログ・スキルデータ）

### コマンド

```bash
tsx cli/bin/cli.ts dev        # 開発サーバーの起動
tsx cli/bin/cli.ts build      # CLI 経由でカタログサイトをビルド
tsx cli/bin/cli.ts preview    # ビルド結果のプレビュー
cd web && pnpm check          # web package の型チェック
cd web && pnpm lint           # web package のリント
pnpm format       # Prettier でフォーマット
tsx cli/bin/cli.ts collect    # スキル収集（GH_TOKEN が必要）
cd cli && pnpm build          # CLI パッケージをビルド（bin/ や src/ を変更した後に実行）
pnpm setup:dev                # テンプレートとフィクスチャを再コピー
```

### プロジェクト構成

```
├── cli/
│   ├── bin/              # CLI エントリポイント
│   ├── src/cli/          # CLI コマンド (init, collect, build, dev, preview)
│   └── templates/        # CLI パッケージに同梱されるプロジェクトテンプレート
├── scripts/              # 開発用スクリプト (setup-dev, collect)
├── web/                  # SvelteKit フロントエンドアプリケーション
│   ├── src/lib/server/   # サーバーサイドデータ読み込み (catalog, docs)
│   ├── src/routes/       # ページ (カタログ, スキル詳細, グラフ, ドキュメント)
│   └── src/lib/i18n/     # 国際化 (en, ja)
├── fixtures/             # ローカル開発用サンプルデータ
│   ├── config/           # サンプルのガバナンスポリシー
│   └── data/             # サンプルのカタログ・スキルデータ
├── config/               # 設定ファイル（gitignore 対象、setup:dev で作成）
├── data/                 # 収集データ（gitignore 対象、setup:dev で作成）
└── docs/                 # ドキュメント
```

### 主要アーキテクチャ

- **`SKILL_HARBOR_ROOT` 環境変数**: データ・config・ドキュメントの読み取り先を制御。CLI 使用時はユーザーのプロジェクトディレクトリに自動設定。開発時はリポジトリルートにフォールバック。
- **`web/vite.config.ts`**: `SKILL_HARBOR_ROOT` からコンパイル時定数 `__PROJECT_ROOT__` を注入。
- **`web/src/lib/server/catalog.ts`**: プリレンダリング時に `data/skills.yaml` と `data/skills/` を読み込み。
- **`adapter-static`**: すべてのページはビルド時にプリレンダリングされ、静的 HTML として配信。サーバーランタイム不要。

### パッケージ構成

- **`agent-skill-harbor`**: `cli/` を root に持つ公開 CLI パッケージ。`harbor` 実行ファイル、プロジェクトテンプレート、collect ランタイムを含みます。
- **`agent-skill-harbor-web`**: 公開される SvelteKit Web パッケージ。フロントエンドのソース、SvelteKit 設定、Web ビルド依存を含みます。
- **実行時依存の向き**: CLI パッケージは `agent-skill-harbor-web` に依存し、`web/` を CLI tarball に同梱するのではなく、インストール済みの Web パッケージからビルドツール群を解決します。
- **依存の管理責務**: Web UI と SvelteKit の依存は `web/package.json` を正とし、CLI/ランタイム依存は `cli/package.json` に置きます。ルート `package.json` は workspace 管理専用です。

### リリース補足

- 変更が入った package だけを release します。
- 両 package を同時に release する場合は `agent-skill-harbor-web` を先、その後に `agent-skill-harbor` を publish します。
- 詳細なリリース手順は [04-release_ja.md](docs/04-release_ja.md) を参照してください。
