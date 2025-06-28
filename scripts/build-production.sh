#!/bin/bash

# Production build script for TeamSpark AI
# This script prepares and builds the production Docker image

set -e

echo "🚀 Starting production build for TeamSpark AI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo "Please copy .env.production.example to .env.production and fill in your values."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "SLACK_CLIENT_ID"
    "SLACK_CLIENT_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Run production build checks
echo "📋 Running pre-build checks..."

# Type checking
echo "🔍 Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript type check failed${NC}"
    exit 1
fi

# Linting
echo "🔍 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-build checks passed${NC}"

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t team-spark-ai:latest -f Dockerfile .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
    echo ""
    echo "To run the production stack:"
    echo "  docker-compose -f docker-compose.prod.yml up -d"
    echo ""
    echo "To view logs:"
    echo "  docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "To stop:"
    echo "  docker-compose -f docker-compose.prod.yml down"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi