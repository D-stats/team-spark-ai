# TeamSpark AI

AI-powered team engagement platform for Slack.

## Quick Start

See [DEVELOPMENT.md](./DEVELOPMENT.md) for the complete development guide.

```bash
# Clone and setup
git clone https://github.com/D-stats/team-spark-ai.git
cd team-spark-ai
npm install
cp .env.example .env.local

# Start development (no login needed)
npm run dev:safe
```

Access at http://localhost:3000/en

## Key Features

- 🎯 **Smart Kudos**: AI-powered recognition system
- 📊 **Team Analytics**: Engagement insights and metrics
- ✅ **Check-ins**: Automated team pulse surveys
- 🔄 **Slack Integration**: Seamless workflow integration
- 🌐 **i18n Support**: English and Japanese

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Prisma, PostgreSQL
- **Auth**: Mock auth for dev (real auth coming soon)
- **Integrations**: Slack SDK, OpenAI API

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Developer guide
- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions
- [docs/](./docs/) - Additional documentation (as needed)

## Team Development

This project uses mock authentication in development mode. All developers work as `dev@example.com` automatically - no login required.

For detailed setup and development workflow, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## License

Private - D-Stats Organization