# ガバナンスガイド

Agent Skill Harbor は、組織内での Agent Skill の利用を管理するためのガバナンス機能を提供します。

## ガバナンスステータス

| ステータス | 説明 | バッジ色 |
|-----------|------|---------|
| **recommended** | 利用を推奨（レビュー済み・承認済み） | 緑 |
| **deprecated** | 段階的に廃止、代替を使用すべき | 黄 |
| **prohibited** | セキュリティ・コンプライアンス上の理由で使用禁止 | 赤 |
| **none** | ガバナンスポリシー未設定 (デフォルト) | 灰 |

## 設定

ガバナンスポリシーは `config/governance.yaml` で定義します。

### 構造

```yaml
version: "1"

defaults:
  org_skills: "none"      # Org 収集スキルのデフォルトステータス
  public_skills: "none"   # 手動追加した公開スキルのデフォルトステータス

policies:
  - slug: "skill-slug"
    source: "org"          # "org" または "public"
    status: "recommended"
    note: "このポリシーの理由"
    updated_by: "team-or-person"
    updated_at: "2026-02-24T00:00:00Z"
```

### フィールド

- **slug**: スキルの識別子 (Org スキルはリポジトリ名、公開スキルは `{owner}_{repo}` 形式)
- **source**: スキルの取得元 (`org`: Organization 内、`public`: 手動追加)
- **status**: 上記のガバナンスステータスのいずれか
- **note**: ステータスが割り当てられた理由の説明
- **updated_by**: ポリシーを設定したチームまたは担当者
- **updated_at**: ポリシーの最終更新日時

## ポリシーの管理

### Claude Code 経由

manage-skill スラッシュコマンドを使用します:

```
/manage-skill govern code-review-assistant recommended "レビュー済み・利用推奨"
```

### 直接編集

1. `config/governance.yaml` を編集
2. ポリシーエントリを追加または変更
3. コミット・プッシュ (または PR を作成)
4. カタログが自動的に再ビルドされます

### PR レビュー経由

ガバナンス変更にレビューを必須とする組織向け:

1. ブランチを作成
2. `config/governance.yaml` を編集
3. レビュー用に PR を提出
4. マージ後、カタログが再ビルドされ Web UI が更新されます

## 収集時の動作

スキル収集 (GitHub Actions) の際、`config/governance.yaml` のガバナンスステータスが各スキルの YAML データにマージされます。つまり:

- ガバナンス変更は次回の収集実行またはカタログビルド時に反映されます
- Web UI はビルド後に常に最新のガバナンス状態を表示します
- 個別ポリシーが未設定のスキルにはデフォルトステータスが適用されます

## ベストプラクティス

1. **理由を記録する** - ステータスを割り当てた理由を `note` に必ず記載する
2. **所有者を追跡する** - `updated_by` にどのチームが決定したかを記録する
3. **定期的に見直す** - ポリシーが現在も適切かどうか定期的にレビューする
4. **PR で変更する** - ガバナンス変更は通常のコードレビュープロセスを経る
