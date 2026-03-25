# リリース

このドキュメントでは、公開 package の release 手順を説明します。

## 公開 package

- `agent-skill-harbor`
  - CLI + web package
- `agent-skill-harbor-collector`
  - collect + post-collect runtime package

## リリース順

両方が変わった場合は次の順です。

1. `agent-skill-harbor-collector`
2. `agent-skill-harbor`

`agent-skill-harbor` は、期待する collector version が先に公開されている前提で publish します。

## `agent-skill-harbor-collector` の release

```bash
pnpm install --no-frozen-lockfile
pnpm --dir collector verify
pnpm --dir collector build

cd collector
npm publish --access public
cd ..

git tag collector-v<version>
```

## `agent-skill-harbor` の release

```bash
pnpm install --no-frozen-lockfile
pnpm verify
pnpm cli:build

npm publish --access public

git tag cli-v<version>
```

## version 管理

- `agent-skill-harbor` と `agent-skill-harbor-collector` は独立 version
- root `package.json` の `harborCollectorRange` が collector range の source of truth
- `templates/init/collector/package.template.json` は、生成プロジェクトに使わせたい collector range と常に揃える

## reusable workflow tag

- 生成される caller workflow は `skill-mill/agent-skill-harbor/.github/workflows/collect.yml@wf-v0` を参照
- reusable workflow の release は npm ではなく git tag で管理
- `wf-v0` は非破壊的 workflow 変更の範囲でだけ動かす

## workflow action pin

Harbor は外部 GitHub Actions を commit SHA で pin しています。

対象:

- `.github/workflows/collect.yml`
- 生成される deploy workflow template

更新前:

```bash
pnpm actions:check
```

レビュー後に反映:

```bash
pnpm actions:pin
```

補足:

- 生成される `CollectSkills` caller は意図的に `@wf-v0` のままにする
- 多くの action 更新は `actions-up` が担当する
- `pnpm/action-setup` は別途手動確認の対象

## 補足

- root package が CLI + web の runtime dependency を持つ
- collector 専用の runtime dependency は `collector/package.json`
- `promptfoo` のような重い optional plugin dependency は collector core ではなく `collector/plugins/<plugin-id>/` の manifest に置く
