<p align="center"><a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/collector/README.md">en</a> | <a href="https://github.com/skill-mill/agent-skill-harbor/blob/main/collector/README_ja.md">ja</a></p>

# agent-skill-harbor-collector

Agent Skill Harbor の collect / post-collect 用 runtime package です。

## 目的

- `collect` runtime module を提供する
- `post-collect` runtime module を提供する
- GitHub 収集依存と optional な post-collect plugin 依存を分離する

## Runtime 境界

生成プロジェクトでは、この package を `collector/` に install して使います。

- `pnpm install --dir collector`
- `node collector/node_modules/agent-skill-harbor-collector/dist/src/runtime/collect-command.js`
- `node collector/node_modules/agent-skill-harbor-collector/dist/src/runtime/post-collect-command.js`

optional plugin manifest は `collector/plugins/<plugin-id>/` に置きますが、collector core とは別 surface として install されます。

## 補足

- この package は `agent-skill-harbor` とは別に公開されます
- `builtin.notify-slack` は collector core に含まれます
- `promptfoo` のような重い optional dependency は collector core には入れません
