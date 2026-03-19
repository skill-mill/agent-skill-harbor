<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/cli/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/cli/README_ja.md">ja</a></p>

# agent-skill-harbor

Agent Skill Harbor の CLI パッケージです。

## このパッケージに含まれるもの

- `harbor` / `agent-skill-harbor` 実行ファイル
- `harbor init` で使われるプロジェクト雛形テンプレート
- 別公開される collector / post-collect / web ランタイムパッケージへのコマンドディスパッチ

## クイックスタート

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
pnpm install
pnpm collect
pnpm dev
```

上の `pnpm collect` は、`init` で生成された Skill Harbor プロジェクト側のスクリプトです。このリポジトリ自身で確認する場合は、まず workspace package を build してから wrapper を実行します。

```bash
pnpm --dir collector build
pnpm --dir post-collect build
pnpm --dir cli build
node cli/dist/bin/cli.js collect
```

Web のローカル確認は次を使います。

```bash
pnpm --dir web build
node cli/dist/bin/cli.js build
node cli/dist/bin/cli.js preview
```

生成されたプロジェクトでは `tools/harbor/*` 配下でランタイム package を別々に install し、GitHub collection job が重い `post-collect` 依存を入れなくて済むようにしています。

## ランタイムパッケージ

- [`agent-skill-harbor-collector`](https://github.com/skill-mill/agent-skill-harbor/blob/main/collector/README_ja.md)
- [`agent-skill-harbor-post-collect`](https://github.com/skill-mill/agent-skill-harbor/blob/main/post-collect/README_ja.md)
- [`agent-skill-harbor-web`](https://github.com/skill-mill/agent-skill-harbor/blob/main/web/README_ja.md)

このリポジトリで `post-collect` を単独で試す場合は次を使います。

```bash
node cli/dist/bin/cli.js post-collect
```

ユーザー定義 plugin は `plugins/<id>/index.mjs`、次に `index.js`、最後に `index.ts` の順で解決されます。
例示用 user-defined plugin の雛形は `harbor gen sample-plugin` で生成できます。

製品全体の概要やドキュメントは、リポジトリの README を参照してください。

- https://github.com/skill-mill/agent-skill-harbor/blob/main/README_ja.md
