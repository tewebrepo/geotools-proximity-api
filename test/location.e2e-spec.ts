import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Location } from '../src/location/interfaces/location.interface';
import { BaseLocationService } from '../src/location/interfaces/base-location.service';
import { RedisLocationService } from '../src/location/redis-location.service';
import RedisMock from 'ioredis-mock';

// Test data subset
const TEST_CITIES: Location[] = [
  {
    city: 'Tokyo',
    city_ascii: 'Tokyo',
    lat: 35.6897,
    lng: 139.6922,
    country: 'Japan',
    iso2: 'JP',
    iso3: 'JPN',
    admin_name: 'Tōkyō',
    capital: 'primary',
    population: 37732000,
    id: '1392685764',
  },
  {
    city: 'Seoul',
    city_ascii: 'Seoul',
    lat: 37.56,
    lng: 126.99,
    country: 'Korea, South',
    iso2: 'KR',
    iso3: 'KOR',
    admin_name: 'Seoul',
    capital: 'primary',
    population: 23016000,
    id: '1410836482',
  },
  {
    city: 'Shanghai',
    city_ascii: 'Shanghai',
    lat: 31.2286,
    lng: 121.4747,
    country: 'China',
    iso2: 'CN',
    iso3: 'CHN',
    admin_name: 'Shanghai',
    capital: 'admin',
    population: 24073000,
    id: '1156073548',
  },
  {
    city: 'Beijing',
    city_ascii: 'Beijing',
    lat: 39.9067,
    lng: 116.3975,
    country: 'China',
    iso2: 'CN',
    iso3: 'CHN',
    admin_name: 'Beijing',
    capital: 'primary',
    population: 18522000,
    id: '1156228865',
  },
  {
    city: 'Singapore',
    city_ascii: 'Singapore',
    lat: 1.3,
    lng: 103.8,
    country: 'Singapore',
    iso2: 'SG',
    iso3: 'SGP',
    admin_name: '',
    capital: 'primary',
    population: 5983000,
    id: '1702341327',
  },
];

describe('LocationController (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisLocationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('RedisClient')
      .useValue(new RedisMock())
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    // Get the Redis service and seed test data
    redisService = moduleFixture.get<RedisLocationService>(BaseLocationService);
    await Promise.all(
      TEST_CITIES.map((city) => redisService.addLocation(city)),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Location Service', () => {
    it('should find nearby cities from Tokyo', () => {
      return request(app.getHttpServer())
        .get('/locations/nearby')
        .query({
          latitude: 35.6897,
          longitude: 139.6922,
          distance: 1000000, // 1000km
          count: 3,
        })
        .expect(200)
        .expect((res) => {
          console.log('Response:', JSON.stringify(res.body, null, 2));
          expect(res.body.success).toBe(true);
          expect(res.body.result).toHaveLength(3);
          const cities = res.body.result.map((city) => city.city);
          console.log('Found cities:', cities);
          // First result should be Tokyo since it's the search point
          expect(cities).toContain('Tokyo');
          // Seoul and Shanghai should be in the results as they're within 1000km
          expect(cities).toContain('Seoul');
          expect(cities).toContain('Shanghai');
        });
    });

    it('should respect min_population parameter', () => {
      return request(app.getHttpServer())
        .get('/locations/nearby')
        .query({
          latitude: 35.6897,
          longitude: 139.6922,
          distance: 3000000, // 3000km
          min_population: 24000000,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(
            res.body.result.every((city) => city.population >= 24000000),
          ).toBe(true);
        });
    });

    it('should handle invalid coordinates gracefully', () => {
      return request(app.getHttpServer())
        .get('/locations/nearby')
        .query({
          latitude: 'invalid',
          longitude: 139.6922,
        })
        .expect(400);
    });
  });
});
