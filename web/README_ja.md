<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/web/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/web/README_ja.md">ja</a></p>

# agent-skill-harbor-web

Agent Skill Harbor 向けの Web パッケージです。

このパッケージには、`agent-skill-harbor` から利用される SvelteKit フロントエンドのソース、設定、実行時依存が含まれます。あわせて、`harbor build`、`harbor dev`、`harbor preview`、`harbor deploy` の実体となる runtime entry point も含みます。

## 目的

- `harbor build`、`harbor dev`、`harbor preview` が利用する Web アプリ本体を提供する
- Web 固有の依存を CLI パッケージから分離する
- `agent-skill-harbor` が依存する公開 Web ランタイムパッケージとして機能する

## 補足

- このパッケージは主に `agent-skill-harbor` の内部ランタイム用途です
- このパッケージは build 済みアプリではなく source 一式を配布し、導入先で `harbor build` や `harbor dev` 実行時に SvelteKit を build します
- `agent-skill-harbor-web` を先に release するのは、CLI が未公開の新しい web version に依存するとき、または両 package を同時 release するときだけです
- リポジトリ全体のリリース手順は [`docs/92-release_ja.md`](https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/92-release_ja.md) を参照してください
