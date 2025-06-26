# AI Developer Guide - TeamSpark AI

This document provides guidelines for AI assistants (such as Claude) to efficiently develop within this project.

## 🚀 Project Overview

- **Project Name**: TeamSpark AI
- **Purpose**: AI-powered team communication and engagement platform
- **Tech Stack**: Next.js 14, TypeScript, Supabase, Prisma, Slack SDK

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
lsof -i :54321 # Supabase Studio
lsof -i :54322 # Supabase API
```

### 2. Starting Supabase Local

```bash
# If Supabase is not running
npx supabase start

# Check status
npx supabase status
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

# Start Supabase Studio in another terminal
npx supabase status  # Check URL
```

### Pre-flight Check

The `npm run pre-flight` command checks:

- ✅ Supabase running status
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
  "service": "startup-hr-engagement",
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
4. **Health Check**: Is it the correct service (startup-hr-engagement)?
5. **Next.js Route Check**: Do Next.js-specific paths exist?

If 3 or more checks pass, the correct development server is considered to be running.

### Port Management Strategy

To avoid port conflicts in development, we adopt the following strategies:

1. **Automatic Port Check**: Automatically checks for port conflicts when running `npm run dev`
2. **Environment Variable Support**: Flexible configuration via PORT and other environment variables
3. **Docker Compose Usage**: Services for internal communication don't expose external ports

See `docs/PORT_MANAGEMENT.md` for details.

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

- Confirm `.env.local` doesn't contain sensitive information
- Update `.env.example` if new environment variables were added

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

See [docs/SETUP_TROUBLESHOOTING.md](./docs/SETUP_TROUBLESHOOTING.md) for detailed troubleshooting guide.

### Common Issues

- **Port Conflicts**: Check with `npm run check:ports`, see [PORT_MANAGEMENT.md](./docs/PORT_MANAGEMENT.md)
- **Supabase Connection Error**: Check status with `npx supabase status`
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

1. `docs/troubleshooting.md` (to be created)
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
