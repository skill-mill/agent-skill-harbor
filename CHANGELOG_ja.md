# 変更履歴

## [Unreleased]

### 追加
- タブベースのビュー切り替え (Card / List / Graph)
- リスト（テーブル）表示（ソート可能、Repository カラム付き）
- `reroute` フックによる `/` と `/skills/` の統合表示
- Cloudflare Pages デプロイコマンドとワークフロー

### 変更
- カタログ URL を `/` から `/skills/` に変更
- フィルター/カラム名を "Origin" から "Owner" に変更
- Card 表示・詳細画面から Platform 表示を削除
- ヘッダーから Graph リンクを削除（タブで遷移可能）
- ページタイトルをフィルター行のスキル数表示に置き換え
- テンプレートを `init/` と `deploy/` サブディレクトリに分割
- collect ランタイムを dist エントリポイントに移動

## [0.3.1] - 2026-03-10

### 修正
- スキル詳細ページの Markdown リンク表示

## [0.3.0] - 2026-03-10

### 追加
- パブリックオリジンリポジトリの収集機能

## [0.2.0] - 2026-03-10

### 追加
- CLI コマンド (`init`, `collect`, `build`, `dev`, `preview`)
- インタラクティブ 3D ナレッジグラフ
- ダークモード（ライト/ダーク/システム切替）
- 多言語対応 (EN/JA)
- スキル詳細ページ（ガバナンスバッジ、来歴追跡）
- 動的ドキュメントルーティング
- 404 エラーページ
- グラフ印刷/エクスポート機能
- admin.yaml の `exclude_repos` 設定
- ESLint flat config

### 変更
- 製品名を Skill Warehouse から Agent Skill Harbor に変更
- CLI コマンド名を `harbor` に変更
- build:catalog を SvelteKit サーバーサイドカタログ読み込みに置き換え
- データモデルの各種改善（tree_sha、\_from 追跡、タイムスタンプ）

## [0.1.0] - 2026-03-09

### 追加
- 初期 MVP 実装
