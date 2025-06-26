# Environment Setup Guide

## Prerequisites

Please ensure the following tools are installed:

- **Node.js**: v18.0.0 or higher (recommended: v20.x)
- **npm**: v9.0.0 or higher
- **Docker**: v20.0.0 or higher (for Supabase Local)
- **Git**: v2.0.0 or higher

### Verify Required Tools Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker version
docker --version

# Check Git version
git --version
```

## 1. Clone the Project

```bash
# Clone the repository
git clone [repository-url]
cd startup-hr

# Or for new projects
mkdir startup-hr
cd startup-hr
git init
```

## 2. Install Dependencies

```bash
# If package.json exists
npm install

# For new projects (see initial setup below)
npm init -y
```

## 3. Supabase Local Setup

### 3.1 Install Supabase CLI

```bash
# Install with npm (recommended)
npm install -g supabase

# Or install with Homebrew (macOS)
brew install supabase/tap/supabase
```

### 3.2 Initialize Supabase Project

```bash
# Initialize Supabase
npx supabase init

# Start local Supabase
npx supabase start
```

Once started, you'll see information like:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJ...
service_role key: eyJ...
```

Save this information to `.env.local`.

### 3.3 Environment Variables Setup

Create `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection (for Prisma)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=public

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Slack Configuration (configure later)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
```

Also create `.env.example` file (without sensitive information):

```bash
cp .env.local .env.example
# Remove actual values from .env.example
```

## 4. Next.js Project Initial Setup

### 4.1 If Project Not Created Yet

```bash
# Create Next.js project
npx create-next-app@latest . --typescript --tailwind --app --use-npm

# Install additional dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install prisma @prisma/client
npm install @slack/bolt @slack/web-api
npm install zod react-hook-form @hookform/resolvers
npm install zustand
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install recharts
npm install clsx tailwind-merge

# Development dependencies
npm install -D @types/node
npm install -D eslint-config-prettier prettier
```

### 4.2 Initialize Prisma

```bash
# Initialize Prisma
npx prisma init

# Edit schema file (see below)
# Run migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

## 5. Database Setup

### 5.1 Configure Prisma Schema

Edit `prisma/schema.prisma` to define data models.

### 5.2 Initial Migration

```bash
# Create and run migration files
npx prisma migrate dev --name initial_schema

# Seed data (optional)
npx prisma db seed
```

## 6. Create Slack App

### 6.1 Create Slack App

1. Visit https://api.slack.com/apps
2. Select "Create New App" → "From scratch"
3. Set app name and workspace

### 6.2 Required Permissions (Bot Token Scopes)

- `chat:write`
- `commands`
- `users:read`
- `users:read.email`
- `team:read`

### 6.3 Configure Slash Commands

Register the following commands:

- `/kudos` - Request URL: `https://your-domain.com/api/slack/commands`
- `/checkin` - Request URL: `https://your-domain.com/api/slack/commands`
- `/mood` - Request URL: `https://your-domain.com/api/slack/commands`

### 6.4 Update Environment Variables

Add Slack App information to `.env.local`:

```bash
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

## 7. Start Development Server

### 7.1 Verify Supabase is Running

```bash
npx supabase status
```

### 7.2 Start Development Server

```bash
# Recommended: Start with pre-flight checks (prevents schema mismatch errors)
npm run dev:safe

# Or normal start
npm run dev

# Alternative start for port conflicts
PORT=3001 npm run dev

# Open Supabase Studio in another terminal
npx supabase status
# Open the displayed Studio URL in browser
```

### 7.3 Verify Operation

- http://localhost:3000 - Application
- http://localhost:54323 - Supabase Studio
- http://localhost:54324 - Inbucket (for email testing)

## 8. VSCode Recommended Settings

### 8.1 Recommended Extensions

`.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 8.2 Settings File

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## 9. Troubleshooting

See [SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md) for detailed troubleshooting.

### Quick Help

#### Pre-flight Check

```bash
# Verify environment health
npm run pre-flight
```

#### Common Issues

1. **Schema mismatch error**: `npm run prisma:reset` (development only)
2. **Port conflict**: `PORT=3001 npm run dev`
3. **Supabase connection error**: `npx supabase stop && npx supabase start`
4. **TypeScript error**: Check details with `npm run type-check`

## 10. Next Steps

After environment setup is complete:

1. Check `docs/development/plan.md` to start development tasks
2. Follow guidelines in `CLAUDE.md` for development
3. Set up test environment before implementing features

## Appendix: Frequently Used Commands

See [Command List in README.md](../README.md#command-list) for complete list of commands.

### Important Commands

```bash
# Start development server (with pre-flight checks)
npm run dev:safe

# When changing schema
npx prisma migrate dev --name descriptive_name
npx prisma generate
npm run type-check

# Quality checks
npm run validate
```
