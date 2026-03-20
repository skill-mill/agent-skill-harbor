# リリース

公開パッケージのリリース手順を説明します。

## 対象パッケージ

- `agent-skill-harbor`: `harbor` 実行ファイル、テンプレート、command dispatch を含む公開 wrapper package
- `agent-skill-harbor-collector`: 公開 collect runtime package
- `agent-skill-harbor-post-collect`: 公開 post-collect runtime package
- `agent-skill-harbor-web`: SvelteKit アプリ本体と Web ビルド依存を含む公開 Web パッケージ

## リリース方針

- 変更が入った package だけを release します。
- 複数 package を release する場合は、runtime package を wrapper package より先に publish します。
- reusable workflow の変更は npm ではなく、この repository の git tag で publish します。

複数 package をまとめて release する場合の推奨順:

1. `agent-skill-harbor-web`
2. `agent-skill-harbor-collector`
3. `agent-skill-harbor-post-collect`
4. `agent-skill-harbor`

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

### `agent-skill-harbor-collector` を release するとき

```bash
pnpm install --no-frozen-lockfile
pnpm --dir collector lint:check
pnpm --dir collector check
pnpm --dir collector test
pnpm --dir collector build
pnpm --filter agent-skill-harbor-collector publish --access public
git tag collector-v<version>
```

### `agent-skill-harbor-post-collect` を release するとき

```bash
pnpm install --no-frozen-lockfile
pnpm --dir post-collect lint:check
pnpm --dir post-collect check
pnpm --dir post-collect test
pnpm --dir post-collect build
pnpm --filter agent-skill-harbor-post-collect publish --access public
git tag post-collect-v<version>
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

### 複数 package を release するとき

1. 先に `agent-skill-harbor-web` を release する。
2. `agent-skill-harbor-collector` と `agent-skill-harbor-post-collect` を必要に応じて release する。
3. metadata や templates が変わった場合だけ最後に `agent-skill-harbor` を release する。
4. 公開対象の package が利用可能になったことを確認してから git tag を作成する。

## タグ方針

- repository 全体で 1 つの version tag を使うのではなく、package ごとの git tag を使います。
- CLI release の tag は `cli-vX.Y.Z` を使います。
- Web release の tag は `web-vX.Y.Z` を使います。
- Collector release の tag は `collector-vX.Y.Z` を使います。
- Post-collect release の tag は `post-collect-vX.Y.Z` を使います。
- reusable workflow の tag には、`wf-v0`、`wf-v0.14`、`wf-v0.14.0` のような専用 tag を使います。

## Reusable Workflow Tag

- 生成される `CollectSkills` workflow は `skill-mill/agent-skill-harbor/.github/workflows/collect.yml@wf-v0` を呼び出します。
- reusable workflow の更新は npm publish 不要ですが、参照されている workflow tag の更新または新規作成が必要です。
- `wf-v0` は後方互換を保てる範囲の変更だけで動かすようにします。
- caller 側との互換性期待が大きく変わる場合だけ、新しい major workflow tag を作ります。

## バージョニング方針

- `cli/package.json`、`collector/package.json`、`post-collect/package.json`、`web/package.json` は独立して version を管理します。
- `cli/templates/init/package.template.json` と `cli/templates/init/tools/harbor/*/package.template.json` は、publish したい package version と整合するよう保ちます。

## 補足

- Web の実行時依存は `web/package.json` に置きます。
- wrapper 専用の実行時依存は `cli/package.json` に置きます。
- collect 専用の実行時依存は `collector/package.json` に置きます。
- post-collect 専用の実行時依存は `post-collect/package.json` に置きます。
- Vite の chunk size warning は現状では既知のものとして扱います。手動で chunk を分ける検証により、残っている重さの主因は `three` だと分かったため、graph 実装をさらに深く最適化しない限り、追加の chunk 分割設定は常用しません。
