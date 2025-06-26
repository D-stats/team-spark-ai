#!/bin/bash

# Test environment health check

echo "🔍 Checking test environment..."

# Check if test database is running
if docker ps | grep -q team-spark-postgres-test; then
  echo "✅ Test database is running"
else
  echo "❌ Test database is not running"
  echo "   Run: npm run test:db:setup"
fi

# Check database connection
if PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d team_spark_test -c "\dt" > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ Cannot connect to test database"
fi

# Check if port 3001 is available
if lsof -i :3001 > /dev/null 2>&1; then
  echo "⚠️  Port 3001 is in use"
else
  echo "✅ Port 3001 is available"
fi

# Check if Playwright browsers are installed
if [ -d "$HOME/Library/Caches/ms-playwright" ]; then
  echo "✅ Playwright browsers are installed"
else
  echo "❌ Playwright browsers not installed"
  echo "   Run: npx playwright install"
fi

echo ""
echo "Ready to run tests with: npm run test:run"