#!/bin/bash

# Default configuration
export PORT=7073
export STORAGE_MODE=${STORAGE_MODE:-auto}
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export REDIS_PASSWORD=${REDIS_PASSWORD:-}
export SQLITE_PATH=${SQLITE_PATH:-data/locations.db}
export BIGCITIES_FILE_PATH=${BIGCITIES_FILE_PATH:-data/big_cities.json}

# Create data directory if it doesn't exist
mkdir -p data

# Check if big_cities.json exists
if [ ! -f "$BIGCITIES_FILE_PATH" ]; then
    echo "❌ Error: $BIGCITIES_FILE_PATH not found"
    echo "Please ensure you have the cities data file in the correct location"
    exit 1
fi

# Initialize databases based on storage mode
if [ "$STORAGE_MODE" = "redis" ] || [ "$STORAGE_MODE" = "auto" ]; then
    echo "🔄 Seeding Redis database..."
    npm run seed:redis
fi

if [ "$STORAGE_MODE" = "sqlite" ] || [ "$STORAGE_MODE" = "auto" ]; then
    echo "🔄 Seeding SQLite database..."
    npm run seed:sqlite
fi

# Start the application
echo "🚀 Starting application in $STORAGE_MODE mode..."
npm run start:dev
