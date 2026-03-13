# Agent Skill Harbor とは

Agent Skill Harbor は、チームのためのスキル共有・発見サービスであり、組織のためのスキル・ガバナンス・ツールです。

GitHub Organization 内の全リポジトリから Agent Skill（`SKILL.md`）をカタログ化し、組織内でブラウズ可能なスキルカタログを公開します。社内で活用されている有用なスキルや、スキル作成の知見を学ぶことができます。

## 仕組み

スキルは各リポジトリを定期的にクローリングして収集されるため、作成したスキルをどこかへ登録したり申請したりするような面倒なプロセスは必要ありません。

また、Agent Skill Harbor には外部からインストールされたスキルの来歴を分析する機能があります。この機能を有効にするには、公開リポジトリからスキルをダウンロードする際に、開発者が [agent-skill-porter](https://github.com/skill-mill/agent-skill-porter) という CLI を使っている必要があります。この CLI では、リポジトリへのスキル追加を次のような簡単なコマンドで実行できます。

```sh
npm install -g agent-skill-porter
sk add https://github.com/anthropics/skills
```

スキルの来歴を記録する仕組みは単純で、agent-skill-porter は対象の `SKILL.md` の Frontmatter に `_from` という特殊なプロパティを追加します。ここには `anthropics/skills@b0cbd3d` のように `<owner>/<repository>@<sha>` が記録されます。この情報と `name` プロパティの値を組み合わせることで、ダウンロード元を一意に特定できます。

## 補足

`SKILL.md` のプロパティに独自項目を追加しても問題ありません。Agent Skill の仕様は標準化されていますが、余剰の Frontmatter プロパティに制限はありません。実用上も、各社のエージェントによって `SKILL.md` のプロパティは独自に拡張されており、基本的には未知のプロパティは無視されます。

また、この追加プロパティが消費するトークンは通常 10 から 20 トークン程度です。ひとつのプロジェクトで読み込まれるスキルが仮に数十件あったとしても、その影響はごく軽微です。
