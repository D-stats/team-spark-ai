# TeamSpark AI Development Guide

> **Keep it simple.** This is the single source of truth for developers.

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone https://github.com/D-stats/team-spark-ai.git
cd team-spark-ai
npm install

# 2. Setup environment
cp .env.example .env.local

# 3. Start development
npm run dev:safe  # Recommended: includes pre-flight checks
```

Access the app at http://localhost:3000/en (no login needed in dev mode)

## Core Development Rules

### 1. Before You Code

- Run `npm run dev:safe` to ensure environment is ready
- Pull latest changes: `git pull origin main`
- Create feature branch: `git checkout -b feature/your-feature`

### 2. While Coding

- **Mock Auth**: Development uses `dev@example.com` automatically (no login needed)
- **Database**: Each developer runs their own PostgreSQL in Docker
- **i18n**: All user-facing strings must use translation keys (no hardcoded text)
- **TypeScript**: Strict mode enabled - fix all type errors

### 3. Before You Commit

```bash
npm run validate  # Must pass: type-check, lint, tests
```

### 4. Git Workflow

```bash
# Safe push with automatic checks
npm run safe-push

# Or manual steps
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

## Key Commands

| Command                | Purpose                        | When to Use                  |
| ---------------------- | ------------------------------ | ---------------------------- |
| `npm run dev:safe`     | Start with pre-flight checks   | Daily development            |
| `npm run validate`     | Run all quality checks         | Before every commit          |
| `npm run safe-push`    | Push with automatic validation | When pushing changes         |
| `npm run test:stories` | Run user story tests           | After feature implementation |

## Project Structure

```
src/
├── app/[locale]/        # Next.js pages (i18n routing)
├── components/          # Reusable React components
├── lib/                 # Core utilities
│   ├── auth/           # Mock authentication (dev only)
│   └── user-stories/   # Feature requirements
└── services/           # Business logic
```

## Common Tasks

### Adding a New Feature

1. Check user stories in `/src/lib/user-stories/stories/`
2. Implement feature following existing patterns
3. Add translation keys to `src/i18n/messages/{en,ja}.json`
4. Update story status when complete

### Database Changes

```bash
# After modifying prisma/schema.prisma
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

### Port Conflicts

- Next.js: 3000 (use `PORT=3001 npm run dev` if needed)
- PostgreSQL: 5433 (configured in docker-compose.yml)

## Troubleshooting

| Issue           | Solution                                   |
| --------------- | ------------------------------------------ |
| 404 errors      | Access via language prefix: `/en` or `/ja` |
| Database errors | Run `docker compose up -d postgres`        |
| Type errors     | Run `npm run type-check` for details       |
| Port in use     | Check `npm run check:ports`                |

## Authentication Status

- **Current**: Mock auth for development (automatic login)
- **Future**: Real auth implementation tracked in JIRA TSA-41
- **Note**: All developers share the same mock user in dev mode

## Need Help?

1. Check existing code patterns first
2. Run `npm run validate` to catch common issues
3. See `/docs` folder for specific topics (keep it minimal)

---

**Remember**: Keep documentation simple. When in doubt, check the code.
