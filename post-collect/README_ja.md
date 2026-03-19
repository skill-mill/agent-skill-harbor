<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/post-collect/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/post-collect/README_ja.md">ja</a></p>

# agent-skill-harbor-post-collect

Agent Skill Harbor の post-collect ランタイムパッケージです。

このパッケージには、`post-collect` コマンドの実装と、`builtin.detect-drift`、`builtin.audit-promptfoo-security`、`builtin.audit-skill-scanner` などの built-in plugin が含まれます。

## 目的

- `harbor post-collect` の実体を提供する
- built-in plugin 依存を `collect` から分離する
- `promptfoo` のような重い依存を GitHub 収集環境から切り離す

## 補足

- このパッケージは主に `agent-skill-harbor` の内部ランタイム用途です
- `builtin.audit-promptfoo-security` は `promptfoo` に依存し、red-team 実行に必要な外部通信が発生する場合があります
- `builtin.audit-skill-scanner` は Python 3.10+ と、事前導入済みの `skill-scanner` CLI を必要とします
- `agent-skill-harbor` が未公開の新しい post-collect version に依存する場合は、先に `agent-skill-harbor-post-collect` を公開します
- plugin の挙動や出力規約は [`docs/03-post-collect-plugins_ja.md`](https://github.com/skill-mill/agent-skill-harbor/blob/main/docs/03-post-collect-plugins_ja.md) を参照してください
