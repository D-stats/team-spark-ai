# Setup & Troubleshooting Guide

This document compiles common issues and solutions encountered during development environment setup.

## 🚨 Common Issues and Solutions

### 1. Schema Mismatch Error

#### Error Example

```
Error: Invalid `prisma.checkIn.findMany()` invocation:
The column `CheckIn.templateId` does not exist in the current database.
```

**Note**: Previous versions had fields like `achievements`, `challenges`, `nextWeekGoals`, but the system has now migrated to a template-based system.

#### Cause

Prisma schema and actual database structure do not match

#### Solution

```bash
# 1. Check current migration status
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate status

# 2. If there are unapplied migrations
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate deploy

# 3. If still not resolved, reset (development only)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate reset --force
```

### 2. Port Conflict Error

#### Error Example

```
Error: listen EADDRINUSE: address already in use :::3000
```

#### Solution

```bash
# 1. Check processes using the port
lsof -i :3000

# 2. Kill the process
kill -9 [PID]

# 3. Start with alternative port
PORT=3001 npm run dev

# Or start with automatic port check
npm run dev:safe
```

### 3. Supabase Connection Error

#### Error Example

```
Error: Could not connect to Supabase
```

#### Solution

```bash
# 1. Check Supabase status
npx supabase status

# 2. If not running
npx supabase start

# 3. If restart is needed
npx supabase stop
npx supabase start

# 4. Check logs
npx supabase logs
```

### 4. Prisma Client Generation Error

#### Error Example

```
Error: @prisma/client did not initialize yet
```

#### Solution

```bash
# 1. Regenerate Prisma Client
npx prisma generate

# 2. Clean up node_modules
rm -rf node_modules
npm install
npx prisma generate
```

### 5. TypeScript Error

#### Error Example

```
Type 'JsonValue' is not assignable to type 'Question[]'
```

#### Solution

```bash
# 1. Run type check
npm run type-check

# 2. Clean up .d.ts files
rm -rf .next/types

# 3. Rebuild
npm run build
```

## 🛠️ Preventive Maintenance

### Pre-Development Checklist

```bash
# Recommended: Run pre-flight check script
npm run pre-flight

# Or check manually
npx supabase status          # Verify Supabase is running
npm run check:ports          # Check port conflicts
npx prisma migrate status    # Check migration status
```

### Regular Maintenance

```bash
# Recommended weekly
npm update                   # Update dependencies
npx prisma migrate dev       # Sync migrations
npm run validate             # Quality check
```

## 📞 Support

If the above doesn't resolve your issue:

1. Copy the full error message
2. Record the commands you executed
3. Check the output of `npm run health`
4. Report on GitHub Issues or Slack

## Related Documentation

- [Environment Setup Guide](./setup-guide.md)
- [CLAUDE.md](../CLAUDE.md) - Troubleshooting section
- [Port Management Guide](./PORT_MANAGEMENT.md)