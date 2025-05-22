import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Location } from './interfaces/location.interface';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { BaseLocationService } from './interfaces/base-location.service';
import { ConfigService } from '@nestjs/config';
import { createLocationId } from '../utils/text.utils';

@Injectable()
export class RedisLocationService extends BaseLocationService {
  private readonly LOCATION_PREFIX = 'loc:';
  private readonly redisClient: Redis;

  constructor(configService: ConfigService) {
    super();
    const config = configService.get('storage.redis');
    this.redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  async addLocation(location: Location): Promise<boolean> {
    try {
      const sanitizedLocation = this.sanitizeLocation(location);
      const id = createLocationId(
        sanitizedLocation.city,
        sanitizedLocation.admin_name,
        sanitizedLocation.iso2,
      );

      // Set location data in Redis
      await this.redisClient.set(
        `${this.LOCATION_PREFIX}${id}`,
        JSON.stringify(sanitizedLocation),
      );

      // Add geolocation for the location
      await this.redisClient.geoadd(
        'locations',
        sanitizedLocation.lng,
        sanitizedLocation.lat,
        id,
      );

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
      // Find nearby locations using Redis GEO commands
      const results = (await this.redisClient.georadius(
        'locations',
        query.longitude,
        query.latitude,
        query.distance || 500000,
        'm',
        'WITHDIST',
        'COUNT',
        query.count || 10,
        'ASC',
      )) as [string, string][];

      const locations = await Promise.all(
        results.map(async ([id, distance]: [string, string]) => {
          const data = await this.redisClient.get(
            `${this.LOCATION_PREFIX}${id}`,
          );
          if (!data) return null;

          const location = JSON.parse(data) as Location;
          return {
            ...location,
            distance: parseFloat(distance),
          };
        }),
      );

      return locations
        .filter(Boolean)
        .filter(
          (loc) =>
            !query.min_population || loc.population >= query.min_population,
        ) as (Location & { distance: number })[];
    } catch (error) {
      console.error('Failed to find nearby locations:', error);
      throw error;
    }
  }
}
