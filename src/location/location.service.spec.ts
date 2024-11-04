import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import Redis from 'ioredis';
import { Location } from './interfaces/location.interface';

jest.mock('ioredis');

describe('LocationService', () => {
  let service: LocationService;
  let redisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    const mockRedisClient = {
      set: jest.fn(),
      get: jest.fn(),
      geoadd: jest.fn(),
      georadius: jest.fn(),
    } as Partial<jest.Mocked<Redis>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    redisClient = module.get('REDIS_CLIENT');
  });

  describe('addLocation', () => {
    it('should add a location successfully', async () => {
      const mockLocation: Location = {
        city: 'Tokyo',
        city_ascii: 'Tokyo',
        lat: 35.6897,
        lng: 139.6922,
        country: 'Japan',
        iso2: 'JP',
        iso3: 'JPN',
        admin_name: 'Tokyo',
        capital: 'primary',
        population: 37732000,
      };

      redisClient.set.mockResolvedValue('OK');
      redisClient.geoadd.mockResolvedValue(1);

      const result = await service.addLocation(mockLocation);
      
      expect(result).toBe(true);
      expect(redisClient.set).toHaveBeenCalledWith(
        'loc:jp_tky_tky',
        JSON.stringify(mockLocation)
      );
      expect(redisClient.geoadd).toHaveBeenCalledWith(
        'locations',
        mockLocation.lng,
        mockLocation.lat,
        'jp_tky_tky'
      );
    });

    it('should handle errors when adding location', async () => {
      const mockLocation: Location = {
        city: 'Tokyo',
        city_ascii: 'Tokyo',
        lat: 35.6897,
        lng: 139.6922,
        country: 'Japan',
        iso2: 'JP',
        iso3: 'JPN',
        admin_name: 'Tokyo',
        capital: 'primary',
        population: 37732000,
      };

      redisClient.set.mockRejectedValue(new Error('Redis error'));

      const result = await service.addLocation(mockLocation);
      expect(result).toBe(false);
    });
  });

  describe('findNearby', () => {
    it('should find nearby locations', async () => {
      const mockLocation = {
        city: 'Tokyo',
        city_ascii: 'Tokyo',
        lat: 35.6897,
        lng: 139.6922,
        country: 'Japan',
        iso2: 'JP',
        iso3: 'JPN',
        admin_name: 'Tokyo',
        capital: 'primary',
        population: 37732000,
      };

      redisClient.georadius.mockResolvedValue([
        ['jp_tk_tk', '1000']
      ]);
      redisClient.get.mockResolvedValue(JSON.stringify(mockLocation));

      const result = await service.findNearby({
        latitude: 35.6897,
        longitude: 139.6922,
        distance: 5000,
        count: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockLocation,
        distance: 1000,
      });
      expect(redisClient.georadius).toHaveBeenCalledWith(
        'locations',
        139.6922,
        35.6897,
        5000,
        'm',
        'WITHDIST',
        'COUNT',
        10,
        'ASC'
      );
    });

    it('should handle errors when finding nearby locations', async () => {
      redisClient.georadius.mockRejectedValue(new Error('Redis error'));

      await expect(service.findNearby({
        latitude: 35.6897,
        longitude: 139.6922,
        distance: 5000,
        count: 10,
      })).rejects.toThrow('Redis error');
    });

    it('should filter by minimum population', async () => {
      const mockLocation1 = {
        city: 'Tokyo',
        city_ascii: 'Tokyo',
        lat: 35.6897,
        lng: 139.6922,
        country: 'Japan',
        iso2: 'JP',
        iso3: 'JPN',
        admin_name: 'Tokyo',
        capital: 'primary',
        population: 37732000,
      };

      const mockLocation2 = {
        ...mockLocation1,
        city: 'Small Town',
        population: 5000,
      };

      redisClient.georadius.mockResolvedValue([
        ['jp_tkt_tky', '1000'],
        ['jp_st_st', '2000']
      ]);
      redisClient.get
        .mockResolvedValueOnce(JSON.stringify(mockLocation1))
        .mockResolvedValueOnce(JSON.stringify(mockLocation2));

      const result = await service.findNearby({
        latitude: 35.6897,
        longitude: 139.6922,
        distance: 5000,
        count: 10,
        min_population: 1000000,
      });

      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Tokyo');
    });
  });
});