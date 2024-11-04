import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Location } from './interfaces/location.interface';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Injectable()
export class LocationService {
  private readonly LOCATION_PREFIX = 'loc:';

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async addLocation(location: Location): Promise<boolean> {
    try {
      const id = this.generateLocationId(location);

      // Set location data in Redis
      await this.redisClient.set(
        `${this.LOCATION_PREFIX}${id}`,
        JSON.stringify(location)
      );

      // Add geolocation for the location
      await this.redisClient.geoadd('locations', location.lng, location.lat, id);

      return true;
    } catch (error) {
      console.error('Failed to add location:', error);
      return false;
    }
  }

  async findNearby(query: NearbyQueryDto) {
    try {
      // Find nearby locations using Redis GEO commands
      const results = await this.redisClient.georadius(
        'locations',
        query.longitude,
        query.latitude,
        query.distance || 500000,
        'm',
        'WITHDIST',
        'COUNT',
        query.count || 10,
        'ASC'
      );

      const locations = await Promise.all(
        results.map(async ([id, distance]) => {
          const data = await this.redisClient.get(`${this.LOCATION_PREFIX}${id}`);
          if (!data) return null;

          const location = JSON.parse(data) as Location;
          return {
            ...location,
            distance: parseFloat(distance),
          };
        })
      );

      return locations.filter(Boolean).filter(
        (loc) => !query.min_population || loc.population >= query.min_population
      );
    } catch (error) {
      console.error('Failed to find nearby locations:', error);
      throw error;
    }
  }

  private generateLocationId(location: Location): string {
    const cityName = this.cleanString(location.city_ascii);
    const adminName = this.cleanString(location.admin_name);
    return `${location.iso2.toLowerCase()}_${adminName}_${cityName}`;
  }

  private cleanString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]/g, '')
      .slice(0, 10);
  }
}
