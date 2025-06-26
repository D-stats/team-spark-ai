#!/bin/bash

# E2E tests runner with automatic setup

set -e

echo "🚀 Starting E2E tests..."

# Check if test database is running
if ! docker ps | grep -q team-spark-postgres-test; then
  echo "📦 Setting up test database..."
  npm run test:db:setup
fi

# Run tests
echo "🧪 Running tests..."
npm test "$@"

# Show results
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed. Check the test results above."
fi

# Ask if user wants to stop test database
read -p "Stop test database? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm run test:db:teardown
fi

exit $TEST_EXIT_CODE