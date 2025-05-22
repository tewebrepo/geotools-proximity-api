# GeoTools Proximity API

A NestJS-based API for finding nearby locations using either Redis or SQLite for storage.

## Features

- Find nearby locations within a specified radius
- Support for both Redis and SQLite storage backends
- Automatic fallback to SQLite if Redis is unavailable
- Configurable storage mode through environment variables
- Efficient spatial indexing using Redis GEO commands or SQLite R*Tree

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Copy `.env.example` to `.env` and adjust the values:

```env
# Server Configuration
PORT=3000

# Storage Configuration
STORAGE_MODE=auto  # 'redis', 'sqlite', or 'auto'

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# SQLite Configuration
SQLITE_PATH=data/locations.db

# Data Files
BIGCITIES_FILE_PATH=data/big_cities.json
```

3. Seed the database:

For Redis:
```bash
npm run seed:redis
```

For SQLite:
```bash
npm run seed:sqlite
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### GET /locations/nearby

Find locations near a specified point.

Query Parameters:
- `latitude` (required): Latitude of the center point
- `longitude` (required): Longitude of the center point
- `distance` (optional): Search radius in meters (default: 500000)
- `count` (optional): Maximum number of results (default: 10)
- `min_population` (optional): Minimum population filter

Example:
```bash
curl "http://localhost:3000/locations/nearby?latitude=37.7749&longitude=-122.4194&distance=10000"
```

## Storage Modes

The API supports three storage modes:

1. `redis`: Use Redis exclusively. Fails if Redis is unavailable.
2. `sqlite`: Use SQLite exclusively.
3. `auto` (default): Try Redis first, fall back to SQLite if Redis is unavailable.

Set the mode using the `STORAGE_MODE` environment variable.
