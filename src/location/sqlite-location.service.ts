import { Injectable } from '@nestjs/common';
import * as SQLite from 'better-sqlite3';
import { Location } from './interfaces/location.interface';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { BaseLocationService } from './interfaces/base-location.service';
import { createLocationId } from '../utils/text.utils';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SQLiteLocationService extends BaseLocationService {
  private readonly db: SQLite.Database;
  private readonly EARTH_RADIUS_KM = 6371;

  constructor(private configService: ConfigService) {
    super();
    const dbPath =
      this.configService.get<string>('storage.sqlite.path') ||
      'data/locations.db';
    this.db = new SQLite(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create locations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        population INTEGER
      );
    `);

    // Create spatial index using R*Tree
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS locations_rtree USING rtree(
        id,              -- Integer primary key
        minLat, maxLat,  -- Latitude bounds
        minLng, maxLng   -- Longitude bounds
      );
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(lat, lng);
      CREATE INDEX IF NOT EXISTS idx_locations_population ON locations(population);
    `);
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch (error) {
      console.error('SQLite health check failed:', error);
      return false;
    }
  }

  async addLocation(location: Location): Promise<boolean> {
    const sanitizedLocation = this.sanitizeLocation(location);
    const id = createLocationId(
      sanitizedLocation.city,
      sanitizedLocation.admin_name,
      sanitizedLocation.iso2,
    );

    try {
      const insertLocation = this.db.prepare(`
        INSERT OR REPLACE INTO locations (id, data, lat, lng, population)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertRtree = this.db.prepare(`
        INSERT OR REPLACE INTO locations_rtree (id, minLat, maxLat, minLng, maxLng)
        VALUES (?, ?, ?, ?, ?)
      `);

      // Use transaction to ensure both inserts succeed or fail together
      const transaction = this.db.transaction((loc) => {
        insertLocation.run(
          id,
          JSON.stringify(sanitizedLocation),
          loc.lat,
          loc.lng,
          loc.population,
        );
        insertRtree.run(id, loc.lat, loc.lat, loc.lng, loc.lng);
      });

      transaction(sanitizedLocation);
      return true;
    } catch (error) {
      console.error('Failed to add location:', error);
      return false;
    }
  }

  async findNearby(
    query: NearbyQueryDto,
  ): Promise<(Location & { distance: number })[]> {
    try {
      // Calculate the bounding box for the given radius
      const lat = query.latitude;
      const lng = query.longitude;
      const distance = query.distance || 500000; // meters
      const distanceKm = distance / 1000;

      // Approximate lat/lng deltas for the bounding box
      const latDelta = (distanceKm / this.EARTH_RADIUS_KM) * (180 / Math.PI);
      const lngDelta =
        (distanceKm /
          (this.EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180))) *
        (180 / Math.PI);

      const stmt = this.db.prepare(`
        WITH nearby_locations AS (
          SELECT 
            l.*,
            (
              ? * acos(
                cos(radians(?)) * 
                cos(radians(l.lat)) * 
                cos(radians(l.lng) - radians(?)) + 
                sin(radians(?)) * 
                sin(radians(l.lat))
              )
            ) as distance
          FROM locations l
          JOIN locations_rtree r ON l.id = r.id
          WHERE r.minLat >= ? AND r.maxLat <= ?
            AND r.minLng >= ? AND r.maxLng <= ?
            AND (? = 0 OR l.population >= ?)
          ORDER BY distance ASC
          LIMIT ?
        )
        SELECT * FROM nearby_locations
        WHERE distance <= ?
      `);

      const results = stmt.all(
        this.EARTH_RADIUS_KM,
        lat,
        lng,
        lat,
        lat - latDelta,
        lat + latDelta,
        lng - lngDelta,
        lng + lngDelta,
        query.min_population || 0,
        query.min_population || 0,
        query.count || 10,
        distanceKm,
      );

      return results.map((row: { data: string; distance: number }) => {
        const locationData = JSON.parse(row.data);
        return {
          ...locationData,
          distance: row.distance * 1000, // Convert back to meters
        };
      });
    } catch (error) {
      console.error('Failed to find nearby locations:', error);
      throw error;
    }
  }
}
