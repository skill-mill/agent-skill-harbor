<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/collector/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/packages/collector/README_ja.md">ja</a></p>

# agent-skill-harbor-collector

Agent Skill Harbor の collector ランタイムパッケージです。

このパッケージには、Skill Harbor プロジェクトで使われる `collect` コマンドの実装が含まれます。GitHub 組織から収集する環境に `post-collect` の重い依存を入れなくて済むよう、独立して公開されています。

## 目的

- `harbor collect` の実体を提供する
- GitHub 収集に必要な依存を `post-collect` や Web 依存から分離する
- 生成される Skill Harbor プロジェクトで install surface を分離できるようにする

## 補足

- このパッケージは主に `agent-skill-harbor` の内部ランタイム用途です
- `agent-skill-harbor` が未公開の新しい collector version に依存する場合は、先に `agent-skill-harbor-collector` を公開します
- リポジトリ全体のリリース手順は [`docs/92-release_ja.md`](https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/92-release_ja.md) を参照してください
