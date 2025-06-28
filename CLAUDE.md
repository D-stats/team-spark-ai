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

### Using Safe Push (Recommended)

```bash
# Automatic quality checks before pushing
npm run safe-push

# Or use the script directly
./safe-push.sh
```

This script automatically:

- Checks for uncommitted changes
- Runs TypeScript type check
- Runs ESLint
- Runs Prettier format check
- Runs tests
- Runs build check
- Only pushes if all checks pass

### Manual Checklist

1. **Local Operation Check**

   - No errors with `npm run dev`
   - Major features work normally

2. **Code Quality**

   - `npm run validate` passes completely
   - No errors or warnings in console

3. **Database**
   - Migration files are committed
   - Seed data is updated if needed

### Git Hooks

Pre-push hooks are automatically configured to run:

- TypeScript type check
- ESLint
- Unit tests

To skip hooks in emergency (not recommended):

```bash
git push --no-verify
```

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
8. **Documentation Language**: Write all documentation, code comments, and commit messages in English for consistency and international collaboration

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

## 📝 Documentation and Code Comment Guidelines

### Language Standards

All documentation, code comments, commit messages, and technical content should be written in **English**. This ensures:

- Consistency across the codebase
- International team collaboration
- Better integration with tools and services
- Easier open-source contribution

**Exceptions**:

- User-facing strings in translation files (en.json, ja.json)
- Example data that demonstrates i18n functionality
- Specific Japanese business logic explanations when necessary

### Comment Examples

```typescript
// ✅ Good: English comment
// Calculate monthly kudos points for the team

// ❌ Bad: Japanese comment
// チームの月間クドスポイントを計算

// ✅ Good: Clear function documentation
/**
 * Validates user input for kudos creation
 * @param data - The kudos data to validate
 * @returns Validation result with errors if any
 */

// ❌ Bad: Mixed languages
/**
 * ユーザー入力をvalidateする
 * @param data - クドスデータ
 */
```

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

## 🚫 ESLint Compliance and Technical Debt Prevention

### Critical: Preventing ESLint Errors

This codebase uses strict TypeScript and ESLint rules to maintain high code quality. **ALL code must pass ESLint checks without errors.** Based on analysis of 485 ESLint errors that accumulated, here are the most common issues and how to prevent them:

### Most Common ESLint Errors (Top 5)

1. **`@typescript-eslint/strict-boolean-expressions` (229 errors - 47%)**

   - This rule requires explicit handling of nullish/falsy values in conditionals
   - **Never** use implicit boolean coercion for nullable values

2. **`@typescript-eslint/explicit-module-boundary-types` (110 errors - 23%)**

   - All exported functions must have explicit return type annotations
   - This includes React components and API route handlers

3. **`@typescript-eslint/no-unsafe-assignment` (73 errors - 15%)**

   - Avoid assigning `any` typed values without proper type assertions
   - Common in API responses and dynamic imports

4. **`@typescript-eslint/no-unsafe-member-access` (52 errors - 11%)**

   - Don't access properties on `any` typed values
   - Always type API responses and external data

5. **`@typescript-eslint/no-unsafe-call` (12 errors - 2%)**
   - Don't call functions typed as `any`
   - Ensure all function imports have proper types

### ESLint Compliance Examples

#### 1. Strict Boolean Expressions

```typescript
// ❌ BAD: Implicit boolean coercion
if (userId) { ... }
if (message) { ... }
if (!error) { ... }

// ✅ GOOD: Explicit null/undefined checks
if (userId !== null && userId !== undefined) { ... }
if (message !== '') { ... }
if (error === null) { ... }

// ✅ GOOD: For optional chaining results
if (user?.email != null) { ... }

// ✅ GOOD: For arrays
if (items.length > 0) { ... }

// ✅ GOOD: For booleans (already boolean, no coercion)
if (isEnabled) { ... }
```

#### 2. Explicit Module Boundary Types

```typescript
// ❌ BAD: Missing return type
export default function LoginPage() {
  return <div>Login</div>;
}

export async function GET(request: Request) {
  return Response.json({ data });
}

// ✅ GOOD: Explicit return types
export default function LoginPage(): JSX.Element {
  return <div>Login</div>;
}

export async function GET(request: Request): Promise<Response> {
  return Response.json({ data });
}

// ✅ GOOD: For React components with props
interface DashboardPageProps {
  params: { locale: string };
}

export default function DashboardPage({
  params
}: DashboardPageProps): JSX.Element {
  return <div>Dashboard</div>;
}
```

#### 3. Type Safety with API Responses

```typescript
// ❌ BAD: Unsafe any assignments
const response = await fetch('/api/users');
const data = await response.json();
const userId = data.id; // Error: unsafe member access
const userName = data.name; // Error: unsafe member access

// ✅ GOOD: Properly typed API responses
interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const response = await fetch('/api/users');
const result = (await response.json()) as ApiResponse<User>;

if (result.error) {
  throw new Error(result.error);
}

const userId = result.data.id; // Type safe!
const userName = result.data.name; // Type safe!
```

#### 4. Prisma Query Results

```typescript
// ❌ BAD: Assuming nullable fields exist
const user = await prisma.user.findUnique({ where: { id } });
if (user.email) { ... }  // Error: user might be null

// ✅ GOOD: Proper null checking
const user = await prisma.user.findUnique({ where: { id } });
if (user && user.email !== null) {
  // Now TypeScript knows user exists and email is not null
}

// ✅ GOOD: Using non-null assertion when you're certain
const user = await prisma.user.findUniqueOrThrow({ where: { id } });
// Now user is guaranteed to exist
if (user.email !== null) { ... }
```

#### 5. Form Data and Request Parsing

```typescript
// ❌ BAD: Unsafe form data access
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get('email'); // Type: FormDataEntryValue | null
  if (email) {
    // Error: implicit boolean coercion
    sendEmail(email); // Error: type mismatch
  }
}

// ✅ GOOD: Proper type narrowing
export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const email = formData.get('email');

  if (typeof email === 'string' && email !== '') {
    await sendEmail(email); // Now TypeScript knows it's a non-empty string
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Email is required' }, { status: 400 });
}
```

### Pre-Implementation ESLint Checklist

Before writing any code, ensure you:

- [ ] **Add explicit return types** to all exported functions
- [ ] **Never use implicit boolean coercion** for nullable values
- [ ] **Type all API responses** and external data sources
- [ ] **Handle all nullable cases explicitly** in conditionals
- [ ] **Avoid `any` type** - use `unknown` and type guards instead
- [ ] **Run `npm run lint`** before making any commits

### During Implementation

1. **Enable ESLint in your editor** to catch errors as you type
2. **Fix errors immediately** - don't accumulate technical debt
3. **Run `npm run lint` frequently** during development
4. **Never disable ESLint rules** without team consensus

### Common Patterns to Memorize

```typescript
// String checks
if (str !== '' && str !== null && str !== undefined) { ... }
// Or use a helper
if (str?.trim()) { ... }  // Only for strings where empty is falsy

// Number checks
if (num !== 0 && num != null) { ... }
if (typeof num === 'number' && !isNaN(num)) { ... }

// Array checks
if (Array.isArray(arr) && arr.length > 0) { ... }

// Object checks
if (obj !== null && obj !== undefined) { ... }
if (obj != null) { ... }  // Checks both null and undefined

// Optional chaining with explicit checks
if (user?.profile?.email != null) { ... }

// Type guards for unknown types
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}

if (isUser(data)) {
  console.log(data.email);  // Type safe!
}
```

### Zero-Tolerance Policy for New ESLint Errors

**IMPORTANT**: When implementing new features or modifying existing code:

1. **No new ESLint errors** should be introduced
2. **Fix existing errors** in files you modify
3. **Run full validation** before committing: `npm run validate`
4. **Document type decisions** when they're not obvious

Remember: Clean code is not optional - it's a requirement for maintaining a scalable, maintainable codebase.

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
