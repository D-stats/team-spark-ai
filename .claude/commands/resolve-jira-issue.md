---
allowed-tools:
  [
    'mcp__mcp-atlassian__jira_get_issue',
    'mcp__mcp-atlassian__jira_search',
    'mcp__mcp-atlassian__jira_get_transitions',
    'mcp__mcp-atlassian__jira_update_issue',
    'mcp__mcp-atlassian__jira_add_comment',
    'mcp__mcp-atlassian__jira_link_to_epic',
    'Bash(git *)',
    'Bash(npm *)',
    'Bash(gh *)',
    'TodoWrite',
    'TodoRead',
    'Read',
    'Edit',
    'MultiEdit',
    'Write',
    'Glob',
    'Grep',
    'LS',
    'Task',
  ]
description: TeamSpark AIプロジェクト向けJIRAチケット解決ワークフロー自動化
---

# Resolve JIRA Issue

指定されたJIRAチケット `$ARGUMENTS` を解決するための包括的なワークフローを実行します。

## Usage

```
/resolve-jira-issue TSA-XXX [optional: brief context]
```

## Context

このコマンドは、TeamSpark AIプロジェクトの開発ワークフローに特化したJIRAチケット解決プロセスを自動化します。オプションのコンテキスト情報が提供された場合、それを解釈・拡張して作業方針に反映します。

### コンテキスト解釈の例

- "frontend" → フロントエンド関連の実装に焦点
- "urgent" → 緊急対応として優先度高く処理
- "backend only" → バックエンドAPIの修正のみに限定
- "after TSA-10" → TSA-10完了後の作業として依存関係を明記
- "hotfix" → 本番環境の緊急修正として最小限の変更
- "continue" → 既存ブランチから作業を継続
- "from PR feedback" → PRレビューコメントへの対応から開始
- "tests only" → テストコードの追加・修正のみ
- "resume deployment" → デプロイ設定から作業再開

## Implementation Steps

このコマンドは以下の手順でJIRAチケット `$ARGUMENTS` を解決します：

**重要**: 既存ブランチが見つからない場合でも処理は停止せず、自動的に新規開発フローに移行します。

### 0. Parse Arguments and Context

```
# $ARGUMENTS を解析してチケット番号とコンテキストを分離
# 例1: "TSA-1" → ticket_id="TSA-1", context=null
# 例2: "TSA-1 urgent" → ticket_id="TSA-1", context="urgent"
# 例3: "TSA-1 frontend only" → ticket_id="TSA-1", context="frontend only"
```

注: 実装時はLLMが `$ARGUMENTS` 全体を解釈し、チケット番号とコンテキストを適切に分離して処理します。

オプションのコンテキストが提供された場合、以下のように解釈・活用：

- 作業スコープの限定（例: "API only" → API層のみの修正）
- 優先度の判断（例: "urgent" → 緊急対応フラグ設定）
- 技術的制約の理解（例: "no breaking changes" → 後方互換性維持）
- 依存関係の把握（例: "needs TSA-5" → 依存チケット確認）
- 作業再開の判断（例: "continue" → 既存ブランチの検出と継続）
- 開始ポイントの特定（例: "from tests" → ステップ5から開始）

### 1. JIRA Issue Analysis and Understanding

```
# チケット番号のみを使用してJIRA情報を取得
!mcp__mcp-atlassian__jira_get_issue [parsed ticket_id]
```

- JIRAチケットの詳細情報を取得して分析
- 日本語の要件、Acceptance Criteria、Definition of Doneを理解
- Issue TypeとEpicの関連性を確認
- 技術的要件とスコープを把握

### 2. Codebase Analysis and Planning

```
# 既存ブランチの高速チェック（ローカルのみ、リモート取得を省略）
!git branch | grep [parsed ticket_id] || echo "No local branch"

# continueコンテキストの場合のみリモートも確認
# !git ls-remote --heads origin "*[parsed ticket_id]*" 2>/dev/null | head -1

!TodoWrite # 開発計画の構造化タスク管理を開始
@CLAUDE.md # プロジェクト開発標準の確認
```

- ローカルブランチを優先的に確認（高速）
- 既存ブランチがある場合は作業継続を検討
- プロジェクト固有の開発ガイドラインを確認
- 必要に応じてユーザーストーリーの作成・更新
- 作業をタスクに分割してTodoリストで管理

### 3. Git Branch Management

```
# ブランチ戦略（既存確認後、なければ新規作成）
!git checkout -b feat/[parsed ticket_id]_[brief-description]_[username] || git checkout feat/[parsed ticket_id]_[brief-description]_[username]
```

- チケット番号を含むブランチ名で作成/切り替え
- 既存ブランチがある場合は再利用
- Git Flow conventionに従った命名規則

### 4. Implementation

```
# Next.js/TypeScript/PostgreSQL/Prismaでの実装
!npm run pre-flight # 開発環境の事前チェック
# コンポーネント、API、サービスの実装
# ユーザーストーリーのacceptance criteriaに基づく開発
```

- TeamSpark AI技術スタックでの実装
- コンポーネント駆動開発
- 型安全性の確保
- エラーハンドリングの実装
- 多言語対応（i18n）の考慮

### 5. Testing Implementation

```
# テストの作成・実行
!npm test
!npm run test:stories # ストーリーベースのテスト
```

- ユニットテストとE2Eテストの作成
- ストーリーベースのテスト実装
- テストカバレッジの確認

### 6. Quality Assurance

```
# コード品質チェック
!npm run type-check
!npm run lint
!npm run format:check
!npm run validate
```

- TypeScript型チェック
- ESLintによるコード品質確認
- Prettierによるフォーマット確認
- 総合的な品質検証

### 7. Pre-commit Preparation

```
# コミット前の最終確認
!git add -A
!git status
!npm run pre-flight # 最終環境チェック
```

- 変更ファイルの確認
- 環境の最終チェック
- pre-commitフックの準備

### 8. Commit and Push

```
# Conventional Commitsに従ったコミット
!git commit -m "feat(TSA-XXX): [brief description]

- [詳細な変更内容]
- [関連する変更]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

!git push -u origin [branch-name]
```

### 9. Pull Request Creation

```
# GitHub CLIでPR作成
!gh pr create --title "feat: [Title] (TSA-XXX)" --body "..." --draft
```

- PR テンプレートに従った内容
- JIRAチケットへのリンク
- テスト計画の記載
- レビュー依頼の設定

### 10. JIRA Update and Documentation

```
# JIRAステータス更新
!mcp__mcp-atlassian__jira_update_issue # In Progressに更新
!mcp__mcp-atlassian__jira_add_comment # 進捗コメント追加
```

- JIRAチケットのステータス更新
- 実装内容のコメント追加
- PR URLの記載

### 11. Final Status Report

```
# 作業完了サマリー
!TodoWrite # 完了タスクの更新
```

- 実装内容のサマリー
- 次のステップの提案
- レビュー待ちの通知

## Key Principles

1. **User Story Driven**: すべての実装はユーザーストーリーに基づく
2. **Type Safety First**: TypeScriptの型安全性を最優先
3. **Quality Automated**: 自動化された品質チェック
4. **Incremental Progress**: 段階的な進捗管理
5. **Clear Communication**: 明確なコミットメッセージとPR

## Error Handling

各ステップでエラーが発生した場合：

- エラー内容を分析して適切な対処
- 必要に応じてユーザーに確認
- JIRAにエラー情報を記録
- 復旧可能な場合は自動リトライ

## Notes

- TSAプレフィックスはTeamSpark AIプロジェクト専用
- Confluenceは使用しない（プロジェクトREADMEとCLAUDE.mdで管理）
- すべてのコミュニケーションは日本語対応
- CI/CDはGitHub Actionsで自動化
