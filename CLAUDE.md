# TeamSpark AI - Project Guide

This document provides project-specific guidelines for AI assistants working on TeamSpark AI. This project follows the [D-Stats organization standards](../CLAUDE.md) - refer to the root documentation for shared principles and standards.

> **Note**: This guide inherits from and extends the [D-Stats organization standards](../CLAUDE.md). For general development principles, security guidelines, and cross-project standards, refer to the root documentation.

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

### ⚠️ Critical: NEVER Skip Quality Checks

**IMPORTANT**: Always run ALL quality checks before committing or pushing, even if:

- Your changes seem unrelated to failing tests
- You only modified documentation
- The errors were "already there"
- You're in a hurry

**Zero tolerance policy**: If tests or lint checks fail, they MUST be fixed before proceeding. This maintains code quality across the entire codebase.

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

- **TypeScript Errors**: Type definition fixes are required - NO EXCEPTIONS
- **ESLint Errors**: Code quality issue fixes are required - NO EXCEPTIONS
- **Test Failures**: Must be fixed even if "unrelated" to your changes
- **ESLint Warnings**: Should be fixed (exceptions only with team consensus)

**Remember**: If the codebase has existing issues when you start working:

1. Fix them as part of your work
2. Or create a separate PR to fix them first
3. Never add more technical debt on top of existing issues

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

### ⚠️ NEVER Skip Checks

**DO NOT USE** `--no-verify` flag:

```bash
# ❌ NEVER DO THIS
git commit --no-verify -m "message"
git push --no-verify
```

**Why**: Even if your changes seem unrelated to failing tests/lint errors:

- Broken tests block everyone on the team
- Lint errors accumulate into technical debt
- Your "unrelated" change might have unexpected side effects
- Maintaining a clean codebase is everyone's responsibility

## 🚨 Pre-Push Checklist

### Using Safe Push (Recommended)

```bash
# Automatic quality checks before pushing
npm run safe-push

# Or use the script directly
./safe-push.sh
```

This script follows the [D-Stats quality assurance workflow](../CLAUDE.md#common-development-workflows) and automatically:

- Checks for uncommitted changes
- Runs TypeScript type check
- Runs ESLint
- Runs Prettier format check
- Runs tests
- Runs build check
- Only pushes if all checks pass

### TeamSpark AI Specific Checklist

1. **User Story Validation**

   - `npm run validate:stories` passes
   - All acceptance criteria are met

2. **i18n Compliance**

   - Features work in both English and Japanese
   - No hardcoded strings in components

3. **Slack Integration**

   - Slack features tested with test workspace
   - No broken webhook integrations

4. **Database Migrations**
   - Migration files are committed
   - Prisma schema is up to date

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

## 🔑 Project-Specific Development Principles

1. **User Story-Driven**: All features start from user stories (see User Story Management below)
2. **Team Engagement Focus**: Design features that enhance team communication and collaboration
3. **Real-time Updates**: Implement real-time features using appropriate technologies
4. **Slack Integration**: Maintain tight integration with Slack workspace features
5. **Multilingual Support**: Full i18n support for English and Japanese users
6. **Performance Optimization**: Target <200ms API response times for engagement features

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

## 📝 TeamSpark AI Specific Guidelines

Refer to [D-Stats Coding Standards](../docs/standards/coding-standards.md) for general coding guidelines. The following are specific to TeamSpark AI:

### Component Development

- **Component Structure**: Follow the established pattern in `/src/components/`
- **Story-driven**: Each component should relate to specific user stories
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Real-time Features**: Use WebSocket patterns for live updates

### API Development

- **Response Format**: Follow the established `ApiResponse<T>` pattern
- **Error Handling**: Use structured error responses with i18n keys
- **Authentication**: Implement proper auth checks on protected endpoints
- **Rate Limiting**: Apply appropriate rate limits for user-facing endpoints

## 🌐 Internationalization (i18n) Guidelines

### No-Cookie Policy

This project follows a privacy-first approach and does not use cookies for language preference management.

- **Language preference storage**: Managed only with localStorage
- **Server-side**: Language determined from URL path
- **Auto-detection**: Suggested only on first visit (no forced redirects)

### Development Requirements

1. **All user-facing strings must use translation keys**

   ```typescript
   // ❌ Bad example
   <h1>ダッシュボード</h1>
   <p>Welcome to the dashboard</p>

   // ✅ Good example
   const t = useTranslations('dashboard');
   <h1>{t('title')}</h1>
   <p>{t('welcome')}</p>
   ```

2. **No hardcoded Japanese/English strings**

   - Always add strings to translation files instead of writing directly in code
   - Comments and console.log are exceptions

3. **Test new features in both languages**

   - Verify display in both English and Japanese
   - Check for layout issues due to text length differences

4. **Always use locale-aware formatters for dates and numbers**

   ```typescript
   // ❌ Bad example
   new Date().toLocaleDateString('ja-JP')`${price}円`;

   // ✅ Good example (client-side)
   import { useI18n } from '@/hooks/use-i18n';
   const { formatDate, formatCurrency } = useI18n();
   formatDate(new Date());
   formatCurrency(price, 'JPY');

   // ✅ Good example (server-side)
   import { serverFormatDate } from '@/lib/i18n-server';
   await serverFormatDate(new Date());
   ```

### Translation Key Naming Convention

```
{section}.{subsection}.{element}.{state}
```

Examples:

- `dashboard.stats.monthlyKudos.title`
- `auth.login.submitButton`
- `errors.validation.required`

### Translation File Structure

```
src/i18n/messages/
├── en.json  # English (default)
└── ja.json  # Japanese
```

When adding new translations, always add them to both files.

### Handling Dynamic Content

- **Requires translation**: System messages, labels, errors, notifications
- **No translation needed**: User-generated content (names, posts, comments, etc.)

### Text Length Considerations

Text length varies significantly between languages:

- English → Japanese: Character count may be reduced by half
- Japanese → English: Character count may increase 2-3 times

Design flexible layouts that accommodate these variations.

### Implementation Checklist

When implementing new features, verify:

- [ ] All user-facing strings use translation keys
- [ ] Dates, times, and numbers are properly formatted
- [ ] Error messages are translated
- [ ] Form validation messages are translated
- [ ] Metadata (title, description) is translated
- [ ] No layout issues in either language
- [ ] Features work correctly after language switching

### Common Hooks and Utilities

```typescript
// Client-side
import { useTranslations } from 'next-intl';
import { useI18n } from '@/hooks/use-i18n';
import { useLanguagePreference } from '@/hooks/use-language-preference';

// Server-side
import { getTranslations } from 'next-intl/server';
import { serverFormatDate, serverFormatNumber } from '@/lib/i18n-server';
```

## 🔧 MCP Atlassian Integration

TeamSpark AI uses the [D-Stats organization MCP setup](../CLAUDE.md#mcp-model-context-protocol-integration). Project-specific configuration:

### JIRA Project Details

- **Project Key**: TSA
- **Issue Types**: Task, Bug, Story (no Epic type available)
- **Epic Pattern**: Use "Epic: [Name]" prefix for parent tasks
- **Custom Fields**: `customfield_10008` (Epic Link), `parent` (modern approach)

### TeamSpark AI JIRA Workflow

```bash
# Use standard slash commands
/resolve-jira-issue TSA-XXX

# Git commits with project prefix
feat(TSA-123): Add kudos notification feature
fix(TSA-456): Resolve Slack integration timeout
```

### Project-Specific JIRA Practices

- **Feature Epics**: Use "Epic: [Feature]" naming for complex features
- **User Story Linking**: Link JIRA tasks to user story IDs in comments
- **Slack Integration**: Include Slack channel mentions in task descriptions
- **i18n Tasks**: Tag with "i18n" label for internationalization work

Refer to [D-Stats MCP Integration](../CLAUDE.md#mcp-model-context-protocol-integration) for detailed JIRA setup and commands.

## 🚫 ESLint Compliance

**Critical**: This project follows strict TypeScript and ESLint rules. Refer to [D-Stats Coding Standards](../docs/standards/coding-standards.md) for detailed guidelines and examples.

### TeamSpark AI Specific ESLint Rules

- **React Hooks**: Proper dependency arrays for all hooks
- **i18n compliance**: No hardcoded strings in JSX
- **API type safety**: All API responses must be properly typed
- **Prisma null handling**: Explicit null checks for all Prisma queries

### Common TeamSpark AI Patterns

```typescript
// ✅ GOOD: i18n compliance
const t = useTranslations('dashboard');
return <h1>{t('title')}</h1>;

// ✅ GOOD: API response typing
interface KudosResponse {
  kudos: Kudos[];
  total: number;
}

// ✅ GOOD: Prisma null handling
const user = await prisma.user.findUnique({ where: { id } });
if (user !== null) {
  // Safe to use user
}
```

### Zero-Tolerance Policy

- **No new ESLint errors** should be introduced
- **Fix existing errors** in files you modify
- **Run `npm run validate`** before all commits
- **NEVER use --no-verify** to skip checks

See [D-Stats coding standards](../docs/standards/coding-standards.md) for comprehensive examples and patterns.

## 🚫 Quality Check Enforcement

### Why We Never Skip Checks

1. **Collective Code Ownership**: Everyone is responsible for the entire codebase health
2. **Preventing Technical Debt**: Small issues compound into major problems
3. **Team Productivity**: Broken tests/builds block everyone's work
4. **Quality Standards**: Maintaining high code quality benefits everyone

### What To Do When You Encounter Existing Issues

**Option 1: Fix as Part of Your Work**

```bash
# Fix the issues, then commit everything together
npm run lint:fix  # Auto-fix what's possible
npm test         # Fix failing tests
git add .
git commit -m "feat: your feature + fix: resolve existing lint/test issues"
```

**Option 2: Fix in a Separate PR First**

```bash
# Create a cleanup branch
git checkout -b fix/cleanup-lint-tests
# Fix all issues
npm run validate
# Commit and push the fixes
git commit -m "fix: resolve existing lint errors and failing tests"
git push
# Then continue with your feature
```

**NEVER Option 3: Skip the Checks**

```bash
# ❌ ABSOLUTELY FORBIDDEN
git commit --no-verify
git push --no-verify
npm test -- --passWithNoTests  # Don't disable tests!
```

### Remember

- **Your "small" documentation change** might break the build
- **That "unrelated" test failure** might be caused by your changes
- **Existing lint errors** are not an excuse to add more
- **Time pressure** is not a valid reason to skip quality checks

**The codebase quality is a shared responsibility. Leave it better than you found it.**

---

**Inherits from**: [D-Stats Organization Standards](../CLAUDE.md)  
**Shared Documentation**: [D-Stats docs/](../docs/)  
**Project Version**: 1.0 | **Last Updated**: 2025-06-29
