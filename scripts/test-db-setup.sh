#!/bin/bash

# Script to set up test database for running tests

set -e

echo "🚀 Setting up test database..."

# Start test database
echo "📦 Starting PostgreSQL container..."
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while ! docker exec team-spark-postgres-test pg_isready -U postgres > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ PostgreSQL failed to start after $max_attempts attempts"
    exit 1
  fi
  echo -n "."
  sleep 1
done

echo ""
echo "✅ PostgreSQL is ready!"

# Load test environment variables
export $(cat .env.test | grep -v '^#' | xargs)

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Test database setup complete!"