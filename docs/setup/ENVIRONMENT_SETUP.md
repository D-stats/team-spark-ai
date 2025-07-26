# Environment Setup Guide

This guide covers the complete environment setup for TeamSpark AI, including direnv configuration, environment variables, and secret management.

## 📁 Environment Files Overview

TeamSpark AI uses multiple environment files for different purposes:

```
.env                  # Main environment file (git ignored)
.env.example          # Example for TeamSpark AI variables
.envrc                # direnv configuration
.mcp.json             # MCP server configuration
```

## 🔧 direnv Setup

### What is direnv?

direnv is a shell extension that automatically loads and unloads environment variables based on your current directory. It's particularly useful for:

- Automatically loading project-specific environment variables
- Keeping sensitive data out of your shell history
- Ensuring consistent environments across team members

### Installation

#### macOS

```bash
brew install direnv
```

#### Ubuntu/Debian

```bash
sudo apt-get install direnv
```

#### Other Systems

Visit [direnv.net](https://direnv.net/docs/installation.html) for installation instructions.

### Shell Integration

Add the following to your shell configuration file:

#### Bash (~/.bashrc)

```bash
eval "$(direnv hook bash)"
```

#### Zsh (~/.zshrc)

```bash
eval "$(direnv hook zsh)"
```

#### Fish (~/.config/fish/config.fish)

```fish
direnv hook fish | source
```

### Project Setup

1. **Navigate to the project directory**:

   ```bash
   cd /path/to/team-spark-ai
   ```

2. **Allow direnv to load the .envrc file**:

   ```bash
   direnv allow .
   ```

3. **Verify it's working**:
   ```bash
   echo $DATABASE_URL
   # Should show your database connection string
   ```

### How it Works

The `.envrc` file in our project contains:

```bash
# Load environment variables if .env exists
[ -f .env ] && dotenv .env
```

This automatically loads all variables from `.env` when you enter the project directory.

## 🔐 Environment Variables Setup

### 1. Create Your .env File

```bash
# Copy from example files
cp .env.example .env
```

### 2. Core Application Variables

Edit `.env` and configure the following:

#### Database Configuration

```bash
# For local development with Docker
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/team_spark_dev

# For production (Cloud SQL)
DATABASE_URL=postgresql://username:password@/database_name?host=/cloudsql/INSTANCE_CONNECTION_NAME
```

#### Application Settings

```bash
# Local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Port configuration (optional, defaults to 3000)
PORT=3000
```

#### Slack Integration (Optional)

```bash
# Get these from https://api.slack.com/apps
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_BOT_TOKEN=xoxb-your-bot-token  # Optional, for single workspace
```

#### Email Configuration

```bash
# Using Resend (recommended)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com

# Using SMTP (development with MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
```

#### MCP Atlassian Integration (Optional)

MCP (Model Context Protocol) Atlassian integration is configured via `.mcp.json` for Claude Code users. The configuration uses the official Atlassian SSE endpoint:

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "sse",
      "url": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

**Note**: No additional environment variables or API tokens are required. Authentication is handled directly through Claude Code when accessing JIRA features.

### 3. Environment-Specific Configurations

#### Development (.env.development)

```bash
NODE_ENV=development
LOG_LEVEL=debug
PRISMA_LOG=query,info,warn,error
```

#### Production (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=info

# Google Cloud specific
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Security
JWT_SECRET=your-secure-random-string
REFRESH_TOKEN_SECRET=another-secure-random-string
SESSION_SECRET=yet-another-secure-random-string
```

## 🔒 Secret Management

### Local Development

1. **Never commit .env files**:

   ```bash
   # .gitignore already includes
   .env
   .env.local
   .env.*.local
   ```

2. **Use strong, unique values for secrets**:
   ```bash
   # Generate secure random strings
   openssl rand -base64 32
   ```

### Production (Google Cloud)

1. **Use Google Secret Manager**:

   ```bash
   # Create a secret
   gcloud secrets create DATABASE_URL --data-file=-

   # Access in application
   const secretValue = await getSecret('DATABASE_URL');
   ```

2. **GitHub Actions Secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Add production secrets:
     - `GCP_PROJECT_ID`
     - `GCP_SA_KEY` (Service Account JSON)
     - `PRODUCTION_DATABASE_URL`
     - `SLACK_CLIENT_SECRET`
     - etc.

## 🚀 Quick Start Checklist

- [ ] Install direnv and configure shell integration
- [ ] Copy `.env.example` to `.env`
- [ ] Configure database connection
- [ ] Set application URL
- [ ] (Optional) Add Slack credentials
- [ ] (Optional) Configure email service
- [ ] (Optional) Verify MCP Atlassian configuration in `.mcp.json`
- [ ] Run `direnv allow .` in project directory
- [ ] Verify with `npm run pre-flight`

## 🔍 Troubleshooting

### direnv not loading

```bash
# Check if direnv is allowed
direnv status

# Re-allow if needed
direnv allow .

# Reload shell
exec $SHELL
```

### Environment variables not found

```bash
# Check if .env exists
ls -la .env

# Verify direnv is working
cd .. && cd team-spark-ai
# You should see: direnv: loading...

# Manually test
source .env && echo $DATABASE_URL
```

### Database connection issues

```bash
# Check PostgreSQL is running
docker-compose ps

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check credentials
npm run prisma:studio
```

## 📚 Additional Resources

- [direnv Documentation](https://direnv.net/)
- [Slack App Setup Guide](./SLACK_SETUP.md)
- [Google Cloud Deployment](./CLOUD_DEPLOYMENT.md)
- [Database Setup](./DATABASE_SETUP.md)

## 🔐 Security Best Practices

1. **Rotate secrets regularly**
2. **Use different secrets for each environment**
3. **Never log sensitive values**
4. **Use least-privilege access for service accounts**
5. **Enable audit logging for secret access**
6. **Use secret scanning in CI/CD**

---

_Remember: Keep your secrets secret! 🤫_
