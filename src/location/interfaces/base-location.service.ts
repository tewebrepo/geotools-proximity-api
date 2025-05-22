import { Location } from './location.interface';
import { NearbyQueryDto } from '../dto/nearby-query.dto';

export interface ILocationService {
  addLocation(location: Location): Promise<boolean>;
  findNearby(
    query: NearbyQueryDto,
  ): Promise<(Location & { distance: number })[]>;
  healthCheck(): Promise<boolean>;
}

export abstract class BaseLocationService implements ILocationService {
  abstract addLocation(location: Location): Promise<boolean>;
  abstract findNearby(
    query: NearbyQueryDto,
  ): Promise<(Location & { distance: number })[]>;
  abstract healthCheck(): Promise<boolean>;

  protected sanitizeLocation(location: Location): Location {
    return {
      ...location,
      city: location.city?.trim(),
      city_ascii: location.city_ascii?.trim(),
      country: location.country?.trim(),
      iso2: location.iso2?.trim().toUpperCase(),
      iso3: location.iso3?.trim().toUpperCase(),
      admin_name: location.admin_name?.trim(),
      capital: location.capital?.trim(),
    };
  }
}
