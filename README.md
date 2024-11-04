# NestJS GeoTools API with Redis Caching

This project is a NestJS API for finding nearby cities based on latitude and longitude, with Redis integration for caching. The application structure and services are designed to support fast data retrieval and a scalable architecture.

## Table of Contents

- [Overview](#overview)
- [Setup and Installation](#setup-and-installation)
  - [Environment Variables](#environment-variables)
  - [Running with Docker Compose](#running-with-docker-compose)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Nearby Locations](#nearby-locations)
- [Project Structure](#project-structure)
- [Redis Seeding](#redis-seeding)
- [Troubleshooting](#troubleshooting)

---

## Overview

This API provides endpoints to find nearby cities based on geographic coordinates. Redis is used to cache city data for quick retrieval.

### Features

- **Health Check**: Check the application's status and view Redis health and statistics.
- **Nearby Locations**: Fetch nearby city information based on location data.

## Setup and Installation

### Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Configure the environment variables:

   - `PORT`: Port for the NestJS server (default: 3000).
   - `REDIS_HOST`: Redis server host (default: `redis` in Docker).
   - `REDIS_PORT`: Redis server port (default: `6379`).
   - `BIGCITIES_FILE_PATH`: Path to the JSON file used to seed data in Redis.

### Running with Docker Compose

To start the application, including Redis, use:

```bash
docker-compose up --build
```

This command builds the Docker image and starts the services, seeding Redis with data on the first run.

### Accessing the Application

The application runs on `http://localhost:3000`.

## Endpoints

### Health Check

Checks the application's health, including Redis status and statistics.

- **Endpoint**: `GET /health`
- **Example**:

  ```bash
  curl http://localhost:3000/health
  ```

### Nearby Locations

Fetches nearby cities based on latitude, longitude, and optional filters.

- **Endpoint**: `GET /locations/nearby`
- **Parameters**:
  - `latitude` (required): Latitude of the location.
  - `longitude` (required): Longitude of the location.
  - `distance` (optional): Radius in meters (default: `500000`).
  - `count` (optional): Number of results (default: `10`).
  - `min_population` (optional): Minimum population filter.

- **Example**:

  ```bash
  curl "http://localhost:3000/locations/nearby?latitude=40.7128&longitude=-74.0060&distance=10000&count=5"
  ```

## Project Structure

This project follows a modular structure in NestJS.

### Key Files and Directories

#### `src/app.controller.ts`

Handles the application's health check.

#### `src/main.ts`

Bootstraps the application, configures global validation, and sets up Swagger documentation.

#### `src/app.controller.spec.ts`

Contains unit tests for `AppController`.

#### `src/app.service.ts`

Provides application-level services, including health checks and Redis statistics.

#### `src/app.module.ts`

Main module that imports configuration, location module, and provides Redis client configuration.

#### `src/location/location.module.ts`

Manages location-related services and controllers.

#### `src/location/location.controller.ts`

Handles requests related to location services, specifically for finding nearby locations.

#### `src/location/location.service.ts`

Implements Redis-based storage and retrieval for location data, including adding new locations and finding nearby cities.

#### `src/redis/redis.module.ts`

Configures Redis client using `ioredis` and integrates with NestJS.

#### `src/config/configuration.ts`

Provides a function to load environment variables and Redis configuration.

#### `src/location/interfaces/location.interface.ts`

Defines the `Location` interface with properties like city, coordinates, country, and population.

#### `src/location/dto/nearby-query.dto.ts`

Defines the `NearbyQueryDto` for validation of query parameters in the `findNearby` endpoint.

## Redis Seeding

The `src/seedRedis.ts` script seeds Redis with city data on the first application run. A `.redis_seeded` file is created to prevent re-seeding on subsequent restarts.

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**:
   - Verify `REDIS_HOST` and `REDIS_PORT` in `.env`.
   - Ensure Redis is reachable and running.

2. **Seeding Errors**:
   - Ensure `BIGCITIES_FILE_PATH` in `.env` points to a valid JSON file.
   - Check Docker logs for errors:

     ```bash
     docker-compose logs app
     ```

3. **Missing Data**:
   - If data isn’t found in `/locations/nearby`, confirm Redis contains the seeded data:

     ```bash
     docker-compose exec redis redis-cli KEYS "loc:*"
     ```

This completes the project documentation. Enjoy building with NestJS and Redis!
