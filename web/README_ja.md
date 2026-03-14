<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# agent-skill-harbor-web

Agent Skill Harbor 向けの Web パッケージです。

このパッケージには、`agent-skill-harbor` から利用される SvelteKit フロントエンドのソース、設定、実行時依存が含まれます。

## 目的

- `harbor build`、`harbor dev`、`harbor preview` が利用する Web アプリ本体を提供する
- Web 固有の依存を CLI パッケージから分離する
- `agent-skill-harbor` が依存する公開ランタイムパッケージとして機能する

## 補足

- このパッケージは主に `agent-skill-harbor` の内部ランタイム用途です
- `agent-skill-harbor-web` を先に release するのは、CLI が未公開の新しい web version に依存するとき、または両 package を同時 release するときだけです
- リポジトリ全体のリリース手順は [`../docs/92-release_ja.md`](../docs/92-release_ja.md) を参照してください
