# ガバナンスガイド

Agent Skill Harbor は、組織内での Agent Skill の利用を管理するためのガバナンス機能を提供します。

## ガバナンスステータス

| ステータス      | 説明                                             | バッジ色 |
| --------------- | ------------------------------------------------ | -------- |
| **recommended** | 利用を推奨（レビュー済み・承認済み）             | 緑       |
| **discouraged** | 利用は非推奨（代替の検討を推奨）                 | 黄       |
| **prohibited**  | セキュリティ・コンプライアンス上の理由で使用禁止 | 赤       |
| **none**        | ガバナンスポリシー未設定（デフォルト）           | 灰       |

## 設定

ガバナンスポリシーは `config/governance.yaml` で定義します。

### 構造

```yaml
policies:
  github.com/your-org/your-repo/skills/your-skill/SKILL.md:
    usage_policy: recommended # recommended | discouraged | prohibited | none
    note: 'このポリシーの理由'
```

各キーは `github.com/{org}/{repo}/{skillPath}` 形式のスキルパスです。

### フィールド

- **usage_policy**: 上記のガバナンスステータスのいずれか
- **note**: ポリシーが割り当てられた理由の説明

## ポリシーの管理

### Claude Code 経由

manage-skill スラッシュコマンドを使用します:

```
/manage-skill govern code-review-assistant recommended "レビュー済み・利用推奨"
```

### 直接編集

1. `config/governance.yaml` を編集
2. ポリシーエントリを追加または変更
3. コミット・プッシュ（または PR を作成）
4. カタログが自動的に再ビルドされます

### PR レビュー経由

ガバナンス変更にレビューを必須とする組織向け:

1. ブランチを作成
2. `config/governance.yaml` を編集
3. レビュー用に PR を提出
4. マージ後、カタログが再ビルドされ Web UI が更新されます

## 収集時の動作

スキル収集（GitHub Actions）の際、`config/governance.yaml` のガバナンスステータスが各スキルのデータにマージされます。つまり:

- ガバナンス変更は次回のカタログビルド時に反映されます
- Web UI はビルド後に常に最新のガバナンス状態を表示します
- 個別ポリシーが未設定のスキルには `none` が適用されます

## ベストプラクティス

1. **理由を記録する** - ポリシーを割り当てた理由を `note` に必ず記載する
2. **PR で変更する** - ガバナンス変更は通常のコードレビュープロセスを経る
3. **定期的に見直す** - ポリシーが現在も適切かどうか定期的にレビューする
