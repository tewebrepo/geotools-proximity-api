import Redis from 'ioredis';
import * as SQLite from 'better-sqlite3';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Gets the total number of cities from the source JSON file
 */
export function getSourceCitiesCount(filePath: string): number {
  if (!existsSync(filePath)) {
    throw new Error(`Source file not found: ${filePath}`);
  }
  const data = readFileSync(filePath, 'utf-8');
  const cities = JSON.parse(data);
  return cities.length;
}

/**
 * Checks if Redis needs seeding by comparing source data count with stored data
 */
export async function checkRedisSeeding(
  redis: Redis,
  sourcePath: string,
): Promise<boolean> {
  try {
    // Get source data count
    const expectedCount = getSourceCitiesCount(sourcePath);

    // Check if locations index exists and has entries
    const locationCount = await redis.zcard('locations');
    if (locationCount === 0) {
      console.log('Redis geospatial index is empty');
      return true;
    }

    // Count location keys
    let totalKeys = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        'loc:*',
        'COUNT',
        '100',
      );
      cursor = nextCursor;
      totalKeys += keys.length;
    } while (cursor !== '0');

    // Compare counts
    if (totalKeys !== expectedCount || locationCount !== expectedCount) {
      console.log(
        `Redis data mismatch: Found ${totalKeys} location keys and ${locationCount} geo entries, expected ${expectedCount}`,
      );
      return true;
    }

    console.log('Redis data is up to date');
    return false;
  } catch (error) {
    console.error('Error checking Redis seeding status:', error);
    return true; // If we can't verify, assume seeding is needed
  }
}

/**
 * Checks if SQLite needs seeding by comparing source data count with stored data
 */
export async function checkSqliteSeeding(
  db: SQLite.Database,
  sourcePath: string,
): Promise<boolean> {
  try {
    // Get source data count
    const expectedCount = getSourceCitiesCount(sourcePath);

    // Check if tables exist
    const tablesExist = db
      .prepare(
        `
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' 
        AND name IN ('locations', 'locations_rtree')
        `,
      )
      .all();

    if (tablesExist.length !== 2) {
      console.log('Required SQLite tables do not exist');
      return true;
    }

    // Count rows in locations table
    const result = db
      .prepare('SELECT COUNT(*) as count FROM locations')
      .get() as { count: number };
    const count = result.count;

    if (count !== expectedCount) {
      console.log(
        `SQLite data mismatch: Found ${count} locations, expected ${expectedCount}`,
      );
      return true;
    }

    console.log('SQLite data is up to date');
    return false;
  } catch (error) {
    console.error('Error checking SQLite seeding status:', error);
    return true; // If we can't verify, assume seeding is needed
  }
}
