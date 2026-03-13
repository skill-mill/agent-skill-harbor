# リリース

公開パッケージのリリース手順を説明します。

## 対象パッケージ

- `agent-skill-harbor-web`: SvelteKit アプリ本体と Web ビルド依存を含む公開 Web パッケージ
- `agent-skill-harbor`: `harbor` 実行ファイル、テンプレート、collect ランタイムを含む公開 CLI パッケージ

## リリース方針

- 変更が入った package だけを release します。
- 両方の package を release する場合、または CLI が未公開の新しい web 機能を最低要件として要求する場合だけ、`agent-skill-harbor-web` を先、`agent-skill-harbor` を後に publish します。

CLI パッケージは `agent-skill-harbor-web` に依存しますが、現在は広めの semver range を使っています。そのため、CLI がまだ公開されていない新しい web 機能に依存しない限り、毎回の二重 release は不要です。

## リリースチェックリスト

### 共通

1. 今回 release する package を決める。
2. その package の `package.json` だけを bump する。
3. 必要に応じて changelog を更新する。

### `agent-skill-harbor-web` を release するとき

```bash
pnpm install --no-frozen-lockfile
pnpm --dir web verify
pnpm --dir web build
# pnpm --filter agent-skill-harbor-web pack  # `files` / README / package 構成を変更したときのみ
pnpm --filter agent-skill-harbor-web publish --access public
git tag web-v<version>
```

### `agent-skill-harbor` を release するとき

```bash
pnpm install --no-frozen-lockfile
pnpm --dir cli verify
pnpm --dir cli build
node cli/dist/bin/cli.js build
# pnpm --filter agent-skill-harbor pack  # `files` / bin / templates / README を変更したときのみ
pnpm --filter agent-skill-harbor publish --access public
git tag cli-v<version>
```

### 両方を release するとき

1. 先に `agent-skill-harbor-web` を release する。
2. 次に `agent-skill-harbor` を release する。
3. 公開対象の package が利用可能になったことを確認してから両方の git tag を作成する。

## タグ方針

- repository 全体で 1 つの version tag を使うのではなく、package ごとの git tag を使います。
- CLI release の tag は `cli-vX.Y.Z` を使います。
- Web release の tag は `web-vX.Y.Z` を使います。
- 両 package を同時に release した場合は、両方の tag を作成します。

## バージョニング方針

- `cli/package.json` と `web/package.json` は独立して version を管理します。
- `cli/templates/init/package.template.json` は引き続き `^{{PACKAGE_VERSION}}` を使うため、`init` で生成されたプロジェクトは常にその時点の CLI リリース系列を参照します。
- CLI は `agent-skill-harbor-web` に対して広めの `<1` range で依存します。minor / patch の web release だけなら CLI release は必須ではありません。

## 補足

- Web の実行時依存は `web/package.json` に置きます。
- CLI 専用の実行時依存は `cli/package.json` に置きます。
- Vite の chunk size warning は現状では既知のものとして扱います。手動で chunk を分ける検証により、残っている重さの主因は `three` だと分かったため、graph 実装をさらに深く最適化しない限り、追加の chunk 分割設定は常用しません。
