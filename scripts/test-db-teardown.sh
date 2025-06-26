#!/bin/bash

# Script to tear down test database

echo "🛑 Stopping test database..."

# Stop and remove containers
docker-compose -f docker-compose.test.yml down

# Remove volumes (optional - uncomment if you want to clean up data)
# docker-compose -f docker-compose.test.yml down -v

echo "✅ Test database stopped!"