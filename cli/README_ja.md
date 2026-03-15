<p align="center"><a href="./README.md">en</a> | <a href="./README_ja.md">ja</a></p>

# agent-skill-harbor

Agent Skill Harbor の CLI パッケージです。

## このパッケージに含まれるもの

- `harbor` / `agent-skill-harbor` 実行ファイル
- `harbor init` で使われるプロジェクト雛形テンプレート
- Skill Harbor プロジェクト向けの collect / build ランタイム

## クイックスタート

```bash
npx agent-skill-harbor init my-skill-harbor
cd my-skill-harbor
pnpm install
pnpm collect
pnpm dev
```

上の `pnpm collect` は、`init` で生成された Skill Harbor プロジェクト側のスクリプトです。CLI パッケージのリポジトリ自身で collector を実行する場合は、次のどちらかを使います。

```bash
pnpm --dir cli build
node cli/dist/bin/cli.js collect
```

あるいは、ビルドなしのローカル開発実行なら:

```bash
node --import tsx bin/cli.ts collect
```

製品全体の概要やドキュメントは、リポジトリの README を参照してください。

- https://github.com/skill-mill/agent-skill-harbor/blob/main/README_ja.md
