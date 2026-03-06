# ローカル開発

## 前提条件

- Node.js 22+
- pnpm 10+

## はじめに

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

開発サーバーは `http://localhost:5173` で起動します。

## ビルド

```bash
# すべてをビルド (Web)
pnpm run build
```

## スキル収集

組織のリポジトリからローカルでスキルを収集するには:

```bash
# 必要な環境変数を設定
export GITHUB_TOKEN=your_token
export GH_ORG=your_org

# スキル収集を実行
pnpm run collect
```

## プロジェクト構成

```
├── config/               # 人が管理する設定
│   ├── admin.yaml        # アプリケーション設定
│   └── governance.yaml   # ガバナンスポリシー定義
├── data/                 # マシン生成の収集データ
│   ├── catalog.yaml      # スキルカタログメタデータ
│   └── skills/           # 収集された SKILL.md ファイル
├── scripts/              # 収集・ビルドスクリプト
├── web/                  # SvelteKit フロントエンドアプリケーション
└── .github/workflows/    # GitHub Actions (収集 + デプロイ)
```

### 主要ディレクトリ

- **config/**: 人が編集する設定ファイル。`admin.yaml` はアプリケーション設定（新着期間、フォーク除外など）を管理。`governance.yaml` はスキルごとのガバナンスポリシーを定義。
- **data/**: マシン生成データ。`catalog.yaml` は収集された全スキルのメタデータを保持。`skills/` にはプラットフォーム/オーナー/リポジトリごとに整理されたキャッシュ済み SKILL.md ファイルが格納。
- **scripts/**: `collect-org-skills.ts` スクリプトが GitHub API を使用して Org 内の全リポジトリから SKILL.md ファイルをスキャン。
- **web/**: adapter-static によるプリレンダリングを使用した SvelteKit アプリケーション。すべてのページはビルド時に生成され、静的 HTML として配信。
