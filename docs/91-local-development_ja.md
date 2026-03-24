# ローカル開発

## 生成プロジェクト側

`harbor init` 後は次を実行します。

```bash
pnpm install
pnpm install --dir collector

pnpm collect
pnpm post-collect
pnpm dev
pnpm build
pnpm preview
```

各 script の実体:

- `pnpm collect` → `pnpm --dir collector exec harbor-collector collect --project-root .`
- `pnpm post-collect` → `pnpm --dir collector exec harbor-collector post-collect --project-root .`
- `pnpm dev` / `pnpm build` / `pnpm preview` → root の `harbor` コマンド

## コントリビューター向け

### 前提

- Node.js 24+
- pnpm 10+

### 開始手順

```bash
git clone https://github.com/skill-mill/agent-skill-harbor.git
cd agent-skill-harbor

pnpm install
pnpm --dir collector install
pnpm setup:dev

pnpm build:cli
pnpm --dir collector build
node dist/bin/cli.js dev
```

開発サーバーは `http://localhost:5173` で起動します。

`pnpm setup:dev` は repo root を demo project として整えます。

1. `templates/init/.env.example` を `.env.example` と `.env` にコピー
2. demo 用の `config/`, `data/`, `guide/` を取得

### よく使うコマンド

```bash
pnpm verify
pnpm --dir collector verify

pnpm build
pnpm build:cli
pnpm --dir collector build

node dist/bin/cli.js dev
node dist/bin/cli.js build
node dist/bin/cli.js preview

GH_TOKEN=$(gh auth token) pnpm --dir collector exec harbor-collector collect --project-root .
pnpm --dir collector exec harbor-collector post-collect --project-root . --collect-id <collect_id>
```

### 構成

```text
agent-skill-harbor/
├── bin/                  # harbor CLI entrypoint
├── src/                  # CLI + web source
├── collector/            # collector + post-collect package
│   ├── bin/
│   ├── src/
│   └── plugins/
├── templates/            # init/setup templates
├── static/
├── guide/
├── docs/
├── config/
└── data/
```

### 設計メモ

- root package (`agent-skill-harbor`) が CLI + web を持つ
- `collector/` package (`agent-skill-harbor-collector`) が collect + post-collect を持つ
- optional plugin manifest は `collector/plugins/<plugin-id>/`
- collector core と optional plugin dependency は別 install surface
- `builtin.notify-slack` は collector core に含まれる

### workflow で collect と post_collect を分ける理由

reusable workflow は引き続き 2 jobs です。

- `collect`
- `post_collect`

理由:

- artifact 境界を明確にする
- post-collect だけ rerun しやすくする
- GitHub 収集権限と optional plugin dependency のセキュリティ境界を保つ
