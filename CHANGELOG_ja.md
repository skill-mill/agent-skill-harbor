# 変更履歴

## [cli 0.10.4] / [web 0.9.3] - 2026-03-14

### 修正

- GitHub Pages デプロイ用ワークフローテンプレートで `upload-pages-artifact` の使用をやめ、自前で tar を作成するよう変更（同アクションは `.github` を全バージョンで、その他のドットファイルを v4 で除外するため）

### 変更

- List ビューのデフォルト grouping を Repository から Origin に変更

## [web 0.9.2] - 2026-03-14

### 修正

- Vite dev server の filesystem allow list を広げ、pnpm の入れ子になった store path から web package を解決する構成でも `pnpm dev` が再び動作するよう修正

### 変更

- root workspace の formatter 対象を repository 共通ファイルのみに絞り、package ローカルの整形は `cli/` と `web/` 側に委ねる構成へ整理

## [cli 0.10.1] / [web 0.9.1] - 2026-03-14

### 変更

- `cli/` と `web/` の両 package に、package ローカルで使える `format` / `format:check` / `lint` / `lint:check` / `verify` を追加し、workspace root に依存せず検査と自動修正ができるよう整理
- release ドキュメントを、package ごとの `verify` 手順、任意の `pack` 指針、package 専用 git tag (`cli-vX.Y.Z`, `web-vX.Y.Z`) に合わせて更新
- package ローカルの format 対象を調整し、新しい静的検査で見つかった CLI / web の小さな問題を修正
- コントリビューター向けドキュメントと README 補足を、独立 package の release フローに合わせて更新

## [0.10.0] - 2026-03-14

### 変更

- `agent-skill-harbor` と `agent-skill-harbor-web` を常に同時 bump する運用をやめ、独立した version 管理に変更して release を簡素化
- package 間の version 整合に依存していた repository-wide の同期 script と lifecycle hook を削除
- CLI の `agent-skill-harbor-web` 依存を広めの `<1` range に緩め、minor / patch の web release だけでは CLI release が不要な構成に変更
- コントリビューター向け・リリース向けドキュメントを、同期 release ではなく package 単位 release の説明に更新

## [0.9.0] - 2026-03-14

### 追加

- 公開される `agent-skill-harbor` CLI パッケージに日本語 README を追加

### 変更

- 公開 CLI パッケージを `cli/` に移し、リポジトリ構成を `cli/` / `web/` の対称な package root に整理
- ルート workspace の script をリポジトリ管理用に絞り、コントリビューター向けドキュメントを `cli/` / `web/` 単位の実行方法へ更新
- CLI パッケージの build script を `build` に整理し、init template は同期対象ではなくプレースホルダ検証対象として扱うよう version フックを簡素化

## [0.8.7] - 2026-03-14

### 修正

- Guide の Markdown リンク描画時に `paths.base` を維持するようにし、GitHub Pages の prerender が `/guide` リンクで失敗しないよう修正

## [0.8.6] - 2026-03-14

### 追加

- `agent-skill-harbor-web` に既定の Guide ページを同梱し、プロジェクト側 `guide/` による override と `guide/.gitkeep` の scaffold を追加

### 変更

- アプリ内の Docs セクションを Guide に改名し、route を `/docs` から `/guide` へ変更
- init テンプレートの README は、コピー後の保守負荷を抑えるため Quick Start リンクだけの最小構成に変更

## [0.8.5] - 2026-03-14

### 修正

- docs の dynamic route を `prerender = 'auto'` に変更し、`/docs/[slug]` が unseen prerenderable route としてビルド失敗しないよう修正

## [0.8.4] - 2026-03-14

### 変更

- スキル詳細ページの heading ID 生成を、plain text 抽出 + `github-slugger` に変更して GitHub のアンカー生成へより近づけた
- prerender の missing-id は build を止めるエラーではなく warning として扱うよう変更

### 修正

- GitHub 風の自己フラグメントリンクを含む外部 `SKILL.md` でも、ローカル描画とのアンカー差分だけで静的ビルドが失敗しないよう修正

## [0.8.3] - 2026-03-13

### 変更

- init 用 workflow テンプレートは、暫定的な Node 24 移行 env を外しつつ、明示的な `pnpm` メジャーバージョン固定を維持する構成に変更
- 公開される `agent-skill-harbor-web` に npm 用の `description`、`keywords`、`license` を追加

### 修正

- `&` などの記号を含む見出しでも、スキル詳細ページの heading ID が GitHub 風アンカーリンクと一致するよう修正

## [0.8.2] - 2026-03-13

### 追加

- 専用の `04-release` ドキュメントを追加（EN/JA）
- 公開される `agent-skill-harbor-web` パッケージ向けの npm README を追加
- ルート・web・init template のバージョン整合を保つ `versions:sync` / `versions:check` を追加

### 変更

- 公開される Web ランタイムを `agent-skill-harbor-web` として分離し、CLI から依存する構成に変更
- ローカル開発ドキュメントにパッケージ責務と publish 順序の説明を追加
- `pnpm version` と `prepack` の前後で version 検証・同期を行うフックを追加

### 修正

- `harbor build` / `harbor dev` / `harbor preview` が、存在しない同梱パスではなくインストール済み Web パッケージから Vite を解決するよう修正
- ソースリポジトリに収集済みスキルがない状態でも、スキル詳細ページの prerender でビルドが落ちないよう修正

## [0.8.1] - 2026-03-13

### 修正

- GitHub Pages の init ワークフローで、古い厳密版ではなく `pnpm` のメジャーバージョン固定（`version: 10`）を使うよう修正
- GitHub Pages の init ワークフローで、JavaScript Actions を Node.js 24 で実行するようにして Node.js 20 廃止経路に対応
- init テンプレートが古い `^0.1.0` ではなく、現行の `agent-skill-harbor` リリース系列を導入するよう修正

## [0.8.0] - 2026-03-12

### 追加

- **Config ページ**: Harbor 設定とガバナンスのタブ表示（Zod スキーマベース）
- README（EN/JA）を `/docs/` でサイドバー先頭エントリとして表示
- `manage-governance` と `manage-harbor-config` の CLI スキルを追加（Zod スキーマ参照付き）

### 変更

- `settings.yaml` を `harbor.yaml` にリネーム
- 統合スキル `manage-skill` を `manage-governance` と `manage-harbor-config` に分割
- ドキュメントの番号を変更: ガバナンスガイド → `02`、ローカル開発 → `03`
- 全ルートから末尾スラッシュを除去 (`trailingSlash: 'never'`)
- README の概要を改善、Organization Setup ガイドを簡素化
- agent-command-sync の参照を agent-skill-porter に更新

### 削除

- `docs/` の旧スクリーンショットファイル
- `manage-skill` スキル（スキルは collect フェーズで管理し、手動操作は不要）

## [0.7.1] - 2026-03-12

### 修正

- Stats ページの日付表示が選択中のロケール（EN/JA）に従うよう修正

### 変更

- README のスクリーンショットを `docs/img/` に移動、Stats ビューを追加、Stats と Graph を縦並びに変更

## [0.7.0] - 2026-03-12

### 追加

- List ビューに「オリジン別」グルーピングを追加 — `_from` チェーンを再帰的に辿り真のオリジンを解決
- オリジンテーブル: オリジンスキルと派生スキルをツリー構造で表示
- `originTable` の i18n キーを追加（EN/JA）

### 変更

- グルーピング切替を boolean から排他モード（`repo` / `origin` / フラット）にリファクタリング
- 収集 Cron スケジュールを6時間ごとから週1回（日曜 12:00 UTC）に変更
- 日本語の `repoTable.skills` ラベルを「スキル数」に変更
- `prepack` スクリプトを追加し publish/pack 前に CLI を自動ビルド

## [0.6.0] - 2026-03-12

### 追加

- **Stats ビュー**: KPI カード、スキル数推移チャート、収集履歴テーブル
- 2軸トレンドチャート（スキル数 + リポジトリスキル導入率のオーバーレイ）
- `repos_with_skills` メトリクス（スキル導入リポ数の追跡）
- トレンドチャートのホバーツールチップ（縦ガイドライン付き）
- Graph ビューに Owner フィルタを追加（URL パラメータ連携）
- GitHub API 呼び出しの指数バックオフリトライ（500/502/503 対応、最大3回）
- フッターのタグラインをランダム表示（5候補）
- スキル一覧ページのリポジトリ別グルーピング
- 収集履歴を `collect-history.yaml` に分離

### 変更

- `collect-history.yaml` を `collecting` + `statistics`（org/community 内訳）構造に変更
- `admin.yaml` を `settings.yaml` にリネーム、`included_extra_repos` 設定を追加
- Stats タブをタブバーの最左に移動
- リポジトリ KPI を導入率表示に変更（`スキルありリポ / 全リポ (割合%)`）
- Graph のフォースレイアウト調整: リンク距離をノード次数に比例、反発力を強化
- コレクターのエラーメッセージ改善: 生 HTML の代わりに HTTP ステータスを表示
- `checkRateLimit` を try-catch で囲み 503 時にブロックしないよう改善

### 修正

- タブ遷移時に Owner フィルタが Graph ビューに引き継がれない問題を修正
- リスト表示のデフォルトをリポジトリ別グルーピングに変更、タブ切替のダブルクリック問題を修正

## [0.5.2] - 2026-03-12

### 修正

- README タグラインの末尾スペースを復元（Markdown 改行用）

## [0.5.1] - 2026-03-12

### 変更

- タグラインとパッケージ説明文を更新

## [0.5.0] - 2026-03-12

### 追加

- スキル詳細ページに FileTree コンポーネントを追加
- リスト表示の説明文にツールチップを追加
- collect コマンドの実行結果サマリー（リポジトリ/スキル/ファイル数、実行時間）
- skills.yaml に収集メタデータ（`meta` ブロック）を保存

### 変更

- `catalog.yaml` を `skills.yaml` にリネーム
- 詳細ページのフィールド名 "Origin" を "Owner" に変更、Source History を Details に統合
- `_from` フロントマターをスカラ値 (`owner/repo@sha`) に標準化（配列の後方互換性あり）
- skills.yaml から冗長な `files` フィールドを削除（ファイルシステムキャッシュから導出）
- リスト表示の長いスキル名を最大幅で切り詰め

## [0.4.0] - 2026-03-12

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
- settings.yaml の `excluded_repos` 設定
- ESLint flat config

### 変更

- 製品名を Skill Warehouse から Agent Skill Harbor に変更
- CLI コマンド名を `harbor` に変更
- build:catalog を SvelteKit サーバーサイドカタログ読み込みに置き換え
- データモデルの各種改善（tree_sha、\_from 追跡、タイムスタンプ）

## [0.1.0] - 2026-03-09

### 追加

- 初期 MVP 実装
