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

製品全体の概要やドキュメントは、リポジトリの README を参照してください。

- https://github.com/skill-mill/agent-skill-harbor/blob/main/README_ja.md
