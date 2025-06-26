# Development Environment Setup Guide

This guide will help you set up the TeamSpark AI development environment from scratch.

## Prerequisites

- Node.js 18.x or higher
- Docker Desktop installed and running
- Git
- direnv (recommended for environment variable management)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/D-stats/team-spark-ai.git
cd team-spark-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables Setup

Copy the example environment file:

```bash
cp .env.example .env
```

If using direnv (recommended):

```bash
direnv allow .
```

### 4. Start PostgreSQL Database

Start the PostgreSQL container using Docker Compose:

```bash
docker-compose up -d postgres
```

Verify the database is running:

```bash
docker-compose ps
```

### 5. Run Database Migrations

Apply all database migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

### 6. Seed the Database with Test Data

Insert test data for development:

```bash
npm run prisma:seed
```

This will create:

- 1 Organization: Acme Corporation
- 4 Users with different roles
- 2 Teams: Engineering and Sales
- Sample kudos between users
- Sample OKRs for Q1 2025

### 7. Start the Development Server

Start with pre-flight checks (recommended):

```bash
npm run dev:safe
```

Or start directly:

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 8. Access the Application

Since authentication is not yet implemented, the application runs in development mode with a mock user.

#### Available Test Users (in database):

- **Admin**: admin@demo.com
- **Manager**: sarah.manager@demo.com
- **Developer**: john.dev@demo.com
- **Sales**: emily.sales@demo.com

**Note**: These are test users in the database, but actual login functionality is not implemented yet. The application will use a mock development user.

## Verify Setup

### Check Server Health

```bash
npm run health
```

### Access Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

This opens a web interface at http://localhost:5555 where you can view and edit database data.

### Run Type Checks and Linting

```bash
npm run validate
```

## Common Issues

### Port Conflicts

If port 3000 is already in use:

```bash
# Use alternative port
PORT=3001 npm run dev

# Or use the alternative dev command
npm run dev:alt
```

### Database Connection Issues

1. Ensure Docker is running
2. Check PostgreSQL container status:
   ```bash
   docker-compose ps
   ```
3. Restart the container if needed:
   ```bash
   docker-compose restart postgres
   ```

### Missing Prisma Client

If you see Prisma-related errors:

```bash
npx prisma generate
```

## Development Workflow

### Before Starting Development

Always run the pre-flight check:

```bash
npm run pre-flight
```

### After Making Schema Changes

1. Create a migration:

   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```

2. Regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run specific story tests
npm run test:stories
```

### Code Quality

Before committing, ensure code quality:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run all validations
npm run validate
```

## Working with JIRA Issues

### Using Claude Code with JIRA

When implementing features, use the `/resolve-jira-issue` slash command in Claude Code:

```
/resolve-jira-issue TSA-XXX
```

This command will:

- Fetch the JIRA issue details
- Understand the requirements
- Implement the feature according to specifications
- Update the JIRA ticket with progress

### JIRA Workflow Best Practices

1. **Start Work**:

   - Use `/resolve-jira-issue TSA-XXX` to begin
   - Claude Code will move the issue to "In Progress"

2. **During Development**:

   - Claude Code will add progress comments
   - Review the implementation regularly
   - Course-correct if needed

3. **Completion**:
   - Create PR with JIRA ticket ID
   - Issue moves to "Done" after PR merge

### Git Commit Convention

Always include JIRA ticket ID in commits:

```bash
feat(TSA-123): Add user authentication feature
fix(TSA-456): Resolve login timeout issue
```

## Next Steps

1. **Start with Authentication**: Use `/resolve-jira-issue TSA-41` to implement authentication
2. **Explore the Application**: Navigate to http://localhost:3000 to see the application
3. **Check Prisma Studio**: View the seeded data at http://localhost:5555
4. **Read CLAUDE.md**: Understand the AI development guidelines
5. **Review User Stories**: Check `/src/lib/user-stories/stories/` for feature requirements

## Notes

- The application currently uses mock authentication in development mode
- Real authentication implementation is pending
- All features are accessible without login in development mode
- The seed data provides a realistic development environment

## Troubleshooting

For additional troubleshooting, see:

- [Troubleshooting Guide](./troubleshooting.md)
- [Port Management Guide](../development/port-management.md)
- Project README.md
