# AI Developer Guide - TeamSpark AI

This document provides guidelines for AI assistants (such as Claude) to efficiently develop within this project.

## 🚀 Project Overview

- **Project Name**: TeamSpark AI
- **Purpose**: AI-powered team communication and engagement platform
- **Tech Stack**: Next.js 14, TypeScript, PostgreSQL (Docker), Prisma, Slack SDK
- **Repository**: https://github.com/D-stats/team-spark-ai

## 📋 User Story-Driven Development

This project adopts **user story-driven development**. When implementing new features or making changes, always follow this process:

### Checking User Stories

1. **Check Existing Stories**

   ```bash
   # Check story validation report
   npm run validate:stories

   # Check in developer dashboard (development environment)
   http://localhost:3000/dev
   ```

2. **Story File Locations**
   - `/src/lib/user-stories/stories/` - Story definitions
   - `/tests/e2e/stories/` - Story-based tests

### New Feature Implementation Flow

1. **Create or Check User Story**

   ```typescript
   // Example: /src/lib/user-stories/stories/feature-stories.ts
   {
     id: 'FEAT-001',
     title: 'Feature Name',
     asA: 'User Type',
     iWantTo: 'What I want to achieve',
     soThat: 'Business value',
     acceptanceCriteria: [
       {
         given: 'Precondition',
         when: 'Action',
         then: 'Expected result',
         verified: false,
       }
     ],
     priority: StoryPriority.P1,
     status: StoryStatus.READY,
   }
   ```

2. **Record During Implementation**

   - Record paths of implemented components, APIs, and tests in `implementedIn`
   - Record test IDs corresponding to acceptance criteria

3. **Create Tests**

   ```typescript
   // Create story-based tests
   import { describeStory, testCriteria } from '../utils/story-test';

   describeStory(story, () => {
     testCriteria(story.acceptanceCriteria[0], async ({ page }) => {
       // Test implementation
     });
   });
   ```

### Confirming Implementation Completion

- Confirm all acceptance criteria are met
- Generate validation report with `npm run validate:stories`
- Update story status to `DONE`

## 📋 Pre-Development Checklist

### 1. Environment Check

```bash
# Check Node.js version (18.x or higher recommended)
node --version

# Check if Docker is running
docker ps

# Check for port conflicts
lsof -i :3000  # Next.js
lsof -i :5432  # PostgreSQL
```

### 2. Environment Setup with direnv

```bash
# Install direnv (if not already installed)
brew install direnv  # macOS

# Allow direnv in the project
direnv allow .

# Verify environment variables are loaded
echo $DATABASE_URL
```

### 3. Starting PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Check if PostgreSQL is running
docker-compose ps
```

## 🛠️ Development Commands

For a complete list of commands, see the [Command List](./README.md#command-list) in README.md.

### Starting Development Server

```bash
# Install dependencies
npm install

# 🚀 Recommended: Start with pre-flight checks (prevents schema mismatch errors)
npm run dev:safe

# Normal start method
npm run dev

# Manually run pre-flight check
npm run pre-flight

# Alternative start methods for port conflicts
PORT=3001 npm run dev    # Specify via environment variable
npm run dev:alt          # Start on port 3001
npm run dev:custom       # Interactively specify port

# Access database with Prisma Studio
npm run prisma:studio
```

### Pre-flight Check

The `npm run pre-flight` command checks:

- ✅ PostgreSQL Docker container status
- ✅ Database connection
- ✅ Migration application status
- ✅ Prisma Client generation status
- ✅ Dependency installation
- ✅ Port conflicts
- ✅ TypeScript type errors (simplified)

If issues are found, specific solutions will be provided.

### Development Server Startup Verification

**Important**: Confirm the server has actually started before proceeding with work.

```bash
# Confirm server startup
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# 200 means OK

# Or use health check endpoint
npm run health

# Start server with startup verification
npm run dev:server  # Automatically verifies startup

# Verify the correct service is running in detail
npm run verify
```

### Health Check Endpoint

The development server implements a `/api/health` endpoint that provides:

```json
{
  "status": "ok",
  "timestamp": "2025-06-19T22:47:16.340Z",
  "service": "team-spark-ai",
  "version": "0.1.0",
  "checks": {
    "server": true,
    "database": true
  }
}
```

- **service**: Confirms the correct service is running
- **checks.server**: Server running status
- **checks.database**: Database connection status

### Server Verification Script

`scripts/verify-server.sh` performs 5 checks:

1. **Port Check**: Is the specified port open?
2. **Process Check**: Is the Node.js process running?
3. **HTTP Header Check**: Is it responding as a Next.js server?
4. **Health Check**: Is it the correct service (team-spark-ai)?
5. **Next.js Route Check**: Do Next.js-specific paths exist?

If 3 or more checks pass, the correct development server is considered to be running.

### Port Management Strategy

To avoid port conflicts in development, we adopt the following strategies:

1. **Automatic Port Check**: Automatically checks for port conflicts when running `npm run dev`
2. **Environment Variable Support**: Flexible configuration via PORT and other environment variables
3. **Docker Compose Usage**: Services for internal communication don't expose external ports

See `docs/development/port-management.md` for details.

### Code Quality Checks

```bash
# TypeScript type check
npm run type-check

# Run ESLint
npm run lint

# Format with Prettier
npm run format

# Run all checks
npm run validate

# User story validation
npm run validate:stories

# Run story-based tests
npm run test:stories
```

## 📝 Required Checks After Feature Development

### ⚠️ Important: Always Run Tests and Quality Checks After Feature Development

After completing new feature implementation or changes to existing features, **always run the following checks**:

```bash
# 1. TypeScript type check (required)
npm run type-check

# 2. Run ESLint (required)
npm run lint

# 3. Run tests (required if implementation exists)
npm test

# 4. Overall quality check (recommended)
npm run validate
```

### Feature Development Flow

1. **Implementation** → Complete feature or bug fix
2. **Quality Check** → Run above commands
3. **Fix** → Fix any errors or warnings
4. **Recheck** → Repeat until all pass
5. **Commit** → Commit only after quality checks pass

### Handling Errors and Warnings

- **TypeScript Errors**: Type definition fixes are required
- **ESLint Errors**: Code quality issue fixes are required
- **Test Failures**: Confirm existing features aren't broken and fix
- **ESLint Warnings**: Fix when possible (can commit if not critical)

## 📝 Pre-Commit Requirements

### 1. Code Quality Check

```bash
# Always run (same as after feature development)
npm run type-check
npm run lint
npm test

# Or run all at once
npm run validate
```

### 2. Database Migration

```bash
# If there are schema changes
npx prisma migrate dev --name [migration_name]

# Regenerate Prisma Client
npx prisma generate
```

### 3. Environment Variable Check

- Confirm `.env` doesn't contain sensitive information in commits
- Update `.env.example` if new environment variables were added
- Ensure direnv is loading variables correctly: `direnv status`

### 4. Automatic Checks on Commit (Husky + lint-staged)

This project automatically runs code quality checks on commit:

```bash
# Automatically executed on commit
- ESLint --fix (TypeScript/TSX files)
- Prettier --write (all target files)
```

To manually skip (not recommended):

```bash
git commit --no-verify -m "message"
```

## 🚨 Pre-Push Checklist

1. **Local Operation Check**

   - No errors with `npm run dev`
   - Major features work normally

2. **Code Quality**

   - `npm run validate` passes completely
   - No errors or warnings in console

3. **Database**
   - Migration files are committed
   - Seed data is updated if needed

## 🔄 CI/CD Confirmation

### GitHub Actions Check Method

1. After push, check the "Actions" tab in the GitHub repository
2. Confirm the following workflows succeed:
   - `typecheck`: TypeScript type check
   - `lint`: Code quality check
   - `test`: Test execution (after implementation)
   - `build`: Build success

### Handling Failures

```bash
# Run same checks locally
npm run typecheck
npm run lint
npm run test
npm run build
```

## 🐛 Troubleshooting

See [docs/guides/troubleshooting.md](./docs/guides/troubleshooting.md) for detailed troubleshooting guide.

### Common Issues

- **Port Conflicts**: Check with `npm run check:ports`, see [PORT_MANAGEMENT.md](./docs/development/port-management.md)
- **PostgreSQL Connection Error**: Check Docker status with `docker-compose ps`
- **Prisma Error**: Regenerate Client with `npx prisma generate`
- **Schema Mismatch**: Pre-check with `npm run pre-flight`

### Schema Change Precautions

1. **Required Steps**

   ```bash
   npx prisma migrate dev --name descriptive_name
   npx prisma generate
   npm run type-check
   ```

2. **Team Development Sync**
   - Include migration files in PR
   - Announce in README

## 📁 Project Structure

```
.
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/             # Utility functions
│   │   └── user-stories/ # User story management
│   ├── services/        # Business logic
│   ├── hooks/           # Custom hooks
│   └── types/           # TypeScript type definitions
├── tests/
│   └── e2e/
│       └── stories/     # Story-based tests
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
├── public/              # Static files
└── docs/
    └── user-stories/    # Story documentation
```

## 🔑 Important Development Principles

1. **User Story-Driven**: All features start from user stories
2. **Type Safety**: Maximize TypeScript type usage
3. **Error Handling**: Proper error handling and user feedback
4. **Security**: Proper environment variable management, authentication/authorization checks
5. **Performance**: Avoid unnecessary rendering, proper caching
6. **Accessibility**: Keyboard operation, screen reader support
7. **Test-Driven**: Create tests based on acceptance criteria

## 📞 Support

If issues aren't resolved, check:

1. `docs/guides/troubleshooting.md`
2. Search project issues
3. Ask in Slack development channel (after setup)

## 🎯 User Story Implementation Example

### When Adding a New Engagement Feature

1. **Create Story File**

   ```typescript
   // /src/lib/user-stories/stories/engagement-stories.ts
   export const newFeatureStory: UserStory = {
     id: 'ENG-005',
     title: '1-on-1 Meeting Records',
     asA: 'Manager',
     iWantTo: 'Record 1-on-1 meeting content with my reports',
     soThat: 'I can provide continuous growth support',
     acceptanceCriteria: [
       {
         id: 'AC-005-1',
         given: 'I am on the 1-on-1 page',
         when: 'I click the new creation button',
         then: 'A record form is displayed',
         verified: false,
       },
     ],
     priority: StoryPriority.P1,
     status: StoryStatus.READY,
     tags: ['1on1', 'manager', 'engagement'],
   };
   ```

2. **Update Implementation and Story**

   - After creating component, add to `implementedIn.components`
   - After creating API, add to `implementedIn.apis`
   - After creating test, add to `implementedIn.tests`
   - Update to `verified: true` when tests for each acceptance criterion pass

3. **Run Validation**

   ```bash
   # Check implementation status
   npm run validate:stories

   # Run story-based tests
   npm run test:stories
   ```

4. **Update Status**
   - Update to `status: StoryStatus.DONE` when all acceptance criteria are met

This approach ensures business value and implementation are always linked during development.

## 🌐 多言語対応（i18n）ガイドライン

### Cookie不使用ポリシー

このプロジェクトはプライバシーファーストの方針により、言語設定の管理にCookieを使用しません。

- **言語設定の保存**: localStorageのみで管理
- **サーバーサイド**: URLパスから言語を判定
- **自動検出**: 初回訪問時のみ提案（強制リダイレクトなし）

### 開発時の必須事項

1. **すべてのユーザー向け文字列は翻訳キーを使用**

   ```typescript
   // ❌ 悪い例
   <h1>ダッシュボード</h1>
   <p>Welcome to the dashboard</p>

   // ✅ 良い例
   const t = useTranslations('dashboard');
   <h1>{t('title')}</h1>
   <p>{t('welcome')}</p>
   ```

2. **ハードコーディングされた日本語/英語は禁止**

   - 開発時に直接文字列を書かず、必ず翻訳ファイルに追加
   - コメントやconsole.logは例外

3. **新機能は必ず両言語でテスト**

   - 英語と日本語の両方で表示確認
   - テキストの長さによるレイアウト崩れをチェック

4. **日付・数値は必ずロケール対応フォーマッターを使用**

   ```typescript
   // ❌ 悪い例
   new Date().toLocaleDateString('ja-JP')`${price}円`;

   // ✅ 良い例（クライアントサイド）
   import { useI18n } from '@/hooks/use-i18n';
   const { formatDate, formatCurrency } = useI18n();
   formatDate(new Date());
   formatCurrency(price, 'JPY');

   // ✅ 良い例（サーバーサイド）
   import { serverFormatDate } from '@/lib/i18n-server';
   await serverFormatDate(new Date());
   ```

### 翻訳キーの命名規則

```
{section}.{subsection}.{element}.{state}
```

例:

- `dashboard.stats.monthlyKudos.title`
- `auth.login.submitButton`
- `errors.validation.required`

### 翻訳ファイルの構造

```
src/i18n/messages/
├── en.json  # 英語（デフォルト）
└── ja.json  # 日本語
```

新しい翻訳を追加する際は、必ず両方のファイルに追加してください。

### 動的コンテンツの扱い

- **翻訳が必要**: システムメッセージ、ラベル、エラー、通知
- **翻訳不要**: ユーザー生成コンテンツ（名前、投稿内容、コメント等）

### テキスト長の考慮事項

言語によってテキストの長さが大きく変わります：

- 英語→日本語: 文字数が約半分になることがある
- 日本語→英語: 文字数が2-3倍になることがある

UIデザイン時は、これらの変動を考慮して柔軟なレイアウトを設計してください。

### 実装チェックリスト

新機能を実装する際は、以下を確認してください：

- [ ] すべてのユーザー向け文字列が翻訳キーを使用している
- [ ] 日付・時刻・数値が適切にフォーマットされている
- [ ] エラーメッセージが翻訳されている
- [ ] フォームバリデーションメッセージが翻訳されている
- [ ] メタデータ（title, description）が翻訳されている
- [ ] 両言語でのレイアウト崩れがない
- [ ] 言語切り替え後も機能が正常に動作する

### よく使うフック・ユーティリティ

```typescript
// クライアントサイド
import { useTranslations } from 'next-intl';
import { useI18n } from '@/hooks/use-i18n';
import { useLanguagePreference } from '@/hooks/use-language-preference';

// サーバーサイド
import { getTranslations } from 'next-intl/server';
import { serverFormatDate, serverFormatNumber } from '@/lib/i18n-server';
```

## 🔧 MCP Atlassian Integration

### Setup Instructions

1. **Install mcp-atlassian**:

   ```bash
   uv tool install mcp-atlassian
   ```

2. **Configure Atlassian credentials**:

   ```bash
   # Add JIRA credentials to your .env file
   echo "JIRA_URL=https://d-stats.atlassian.net" >> .env
   echo "JIRA_USERNAME=your-email@example.com" >> .env
   echo "JIRA_API_TOKEN=your-api-token" >> .env
   ```

3. **Ensure direnv is active**:

   ```bash
   direnv allow .       # In project directory
   direnv status        # Verify it's loaded
   ```

4. **Restart Claude Code** to load MCP server

### JIRA Workflow

When working with JIRA tickets:

1. **Use the slash command**:

   ```
   /resolve-jira-issue TSA-XXX
   ```

2. **JIRA Format Requirements**:

   - Use JIRA format for ticket updates: `h1.`, `*bold*`, `{code}`, etc.
   - Keep comments concise and structured
   - Always link to relevant PRs

3. **Status Transitions**:
   - Move to "In Progress" when starting work
   - Add progress comments regularly
   - Only move to "Done" after PR is merged

### Git Commit Convention with JIRA

Always include JIRA ticket ID in commits:

```bash
feat(TSA-123): Add user authentication feature
fix(TSA-456): Resolve login timeout issue
```

## 📋 JIRA Issue Management Guidelines

### Creating Epics and Tasks

1. **Check Issue Types Available**:

   - Not all JIRA projects have Epic issue type enabled
   - In TeamSpark AI project, "Epics" are created as regular Tasks with "Epic:" prefix in title
   - Use parent-child relationships to organize hierarchy

2. **Creating Epic-like Tasks**:

   ```
   Title: "Epic: [Epic Name]"
   Description: Include sections for Overview, Objectives, Feature Categories, Success Criteria
   ```

3. **Linking Child Tasks to Epic**:

   - Use the `parent` field (modern approach) or `customfield_10008` (Epic Link)
   - Always verify the correct field by checking existing issue structures
   - Link tasks immediately when creating related issues

4. **Best Practices**:
   - Create all related tasks at once and link them immediately
   - Add a comment to the Epic listing all child tasks
   - Use consistent naming: "Epic: " prefix for parent, clear action verbs for tasks
   - Include implementation order in Epic description

### JIRA Field Investigation

When unsure about JIRA fields:

```bash
# Search for specific field types
mcp__mcp-atlassian__jira_search_fields --keyword "epic"

# Get all fields for an issue
mcp__mcp-atlassian__jira_get_issue --issue_key "TSA-XXX" --fields "*all"

# Check issue type structure
mcp__mcp-atlassian__jira_search --jql "project = TSA" --fields "issuetype,parent"
```

### Common JIRA Custom Fields

- `customfield_10008`: Epic Link (legacy)
- `customfield_10009`: Epic Name
- `parent`: Modern parent-child relationship field
- `customfield_10100`: Rank (for prioritization)

### Error Prevention

1. **Before Creating Issues**:

   - Check if Epic issue type exists in the project
   - Verify custom field IDs for the specific JIRA instance
   - Plan the entire issue hierarchy before creation

2. **When Updating Issues**:

   - Use batch operations when updating multiple related issues
   - Always add a comment explaining structural changes
   - Verify updates with a follow-up search query

3. **Language Consistency**:
   - Use English for all JIRA content in international teams
   - Keep technical terms consistent across issues
   - Follow the project's established naming conventions

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
