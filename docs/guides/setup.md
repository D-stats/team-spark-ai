# Environment Setup Guide

## Prerequisites

Please ensure the following tools are installed:

- **Node.js**: v18.0.0 or higher (recommended: v20.x)
- **npm**: v9.0.0 or higher
- **Docker**: v20.0.0 or higher (for PostgreSQL)
- **Git**: v2.0.0 or higher
- **direnv**: (recommended) for automatic environment variable loading

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
git clone https://github.com/D-stats/team-spark-ai.git
cd team-spark-ai
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Environment Setup

### 3.1 Install and Configure direnv (Recommended)

```bash
# macOS
brew install direnv

# Ubuntu/Debian
sudo apt-get install direnv

# Add to your shell configuration
# For bash (~/.bashrc)
eval "$(direnv hook bash)"

# For zsh (~/.zshrc)
eval "$(direnv hook zsh)"

# Reload your shell
exec $SHELL
```

### 3.2 Environment Variables Setup

Create `.env` file from examples:

```bash
# Copy main environment variables
cp .env.example .env

# If using MCP Atlassian integration, append those variables
cat .env.sample >> .env
```

### 3.3 Configure Environment Variables

Edit `.env` and set the following:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/team_spark_dev

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000  # Optional, defaults to 3000

# Slack Configuration (Optional)
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret

# Email Configuration (Optional)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# MCP Atlassian Integration (Optional)
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
```

### 3.4 Allow direnv

```bash
# In the project directory
direnv allow .

# Verify environment variables are loaded
echo $DATABASE_URL
```

For detailed environment setup, see [Environment Setup Guide](../setup/ENVIRONMENT_SETUP.md).

## 4. Database Setup

### 4.1 Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify it's running
docker-compose ps

# The database will be available at:
# postgresql://postgres:postgres@localhost:5432/team_spark_dev
```

### 4.2 Run Database Migrations

```bash
# Run existing migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Optional) Seed initial data
npx prisma db seed
```

### 4.3 Verify Database Setup

```bash
# Open Prisma Studio to view database
npm run prisma:studio
```

## 5. MCP Atlassian Setup (Optional)

If you're using JIRA integration:

### 5.1 Install MCP Atlassian

```bash
# Install using uv (Python package manager)
uv tool install mcp-atlassian
```

### 5.2 Configure JIRA Credentials

Add to your `.env` file:

```bash
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
```

### 5.3 Restart Claude Code

After configuration, restart Claude Code to load the MCP server.

## 6. Create Slack App (Optional)

### 6.1 Create Slack App

1. Visit https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. App name: "TeamSpark AI"
4. Choose your workspace

### 6.2 Configure OAuth & Permissions

Add these Bot Token Scopes:

- `channels:read`
- `chat:write`
- `commands`
- `groups:read`
- `im:read`
- `im:write`
- `users:read`
- `users:read.email`

### 6.3 Configure Slash Commands

Add command:

- Command: `/kudos`
- Request URL: `https://your-domain.com/api/slack/commands/kudos`
- Short Description: "Send kudos to a team member"
- Usage Hint: `@user [category] message`

### 6.4 Get App Credentials

From "Basic Information" page, copy:

- Client ID
- Client Secret
- Signing Secret

Add these to your `.env` file.

## 7. Start Development Server

### 7.1 Run Pre-flight Checks

```bash
# Verify everything is set up correctly
npm run pre-flight
```

This checks:

- ✅ PostgreSQL connection
- ✅ Database migrations
- ✅ Environment variables
- ✅ Dependencies
- ✅ TypeScript configuration

### 7.2 Start Development Server

```bash
# Recommended: Start with safety checks
npm run dev:safe

# Or normal start
npm run dev

# If port 3000 is in use
npm run dev:alt      # Uses port 3001
PORT=3002 npm run dev # Custom port
```

### 7.3 Verify Operation

- http://localhost:3000 - TeamSpark AI Application
- http://localhost:5555 - Prisma Studio (run `npm run prisma:studio`)
- http://localhost:8025 - MailHog UI (if using local email testing)

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

#### Common Issues

1. **Database connection error**:

   ```bash
   docker-compose ps  # Check if PostgreSQL is running
   docker-compose up -d postgres  # Start if needed
   ```

2. **Port conflict**:

   ```bash
   npm run check:ports  # See what's using ports
   npm run dev:alt     # Use alternate port
   ```

3. **Environment variables not loading**:

   ```bash
   direnv allow .      # Re-allow direnv
   exec $SHELL        # Reload shell
   echo $DATABASE_URL # Verify
   ```

4. **TypeScript errors**:
   ```bash
   npm run type-check  # See detailed errors
   npm run prisma:generate  # Regenerate types
   ```

## 10. Next Steps

After environment setup is complete:

1. Read [CLAUDE.md](../../CLAUDE.md) for AI developer guidelines
2. Check [PRODUCT_OVERVIEW.md](../PRODUCT_OVERVIEW.md) to understand the product
3. Review [ARCHITECTURE.md](../ARCHITECTURE.md) for technical details
4. See [FEATURE_STATUS.md](../FEATURE_STATUS.md) for implementation status

## Appendix: Frequently Used Commands

See [Command List in README.md](../README.md#command-list) for complete list of commands.

### Important Commands

```bash
# Start development server (with pre-flight checks)
npm run dev:safe

# Database management
npx prisma migrate dev --name descriptive_name
npx prisma generate
npm run prisma:studio

# Quality checks
npm run validate       # Run all checks
npm run type-check    # TypeScript only
npm run lint          # ESLint only
npm run test          # Run tests

# Docker management
docker-compose up -d   # Start services
docker-compose ps      # Check status
docker-compose down    # Stop services
```
