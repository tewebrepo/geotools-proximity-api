import Redis from 'ioredis';
import { readFileSync } from 'node:fs';
import { checkRedisSeeding } from '../src/utils/seeding.utils';
import 'dotenv/config';

// Parse command line arguments
const args = process.argv.slice(2);
const forceSeeding = args.includes('--force');

interface City {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string;
  capital: string;
  population: number;
}

async function seedRedis() {
  const filePath = process.env.BIGCITIES_FILE_PATH || 'data/big_cities.json';
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  });

  try {
    // Check if seeding is necessary
    if (!forceSeeding) {
      console.log('🔍 Checking if seeding is necessary...');
      const needsSeeding = await checkRedisSeeding(redis, filePath);
      if (!needsSeeding) {
        console.log('✨ Redis data is already up to date');
        redis.disconnect();
        return;
      }
    }

    // Read and parse data
    console.log(`📂 Reading data from ${filePath}...`);
    const fileContent = readFileSync(filePath, 'utf-8');
    const cities: City[] = JSON.parse(fileContent);

    console.log(`🚀 Starting to seed ${cities.length} cities into Redis...`);

    for (const city of cities) {
      try {
        const cityId = `${city.iso2.toLowerCase()}_${city.admin_name}_${
          city.city_ascii
        }`
          .replace(/[^a-z0-9_]/gi, '')
          .toLowerCase();

        // Set city data in Redis
        await redis.set(`loc:${cityId}`, JSON.stringify(city));

        // Add geospatial data for the city
        await redis.geoadd('locations', city.lng, city.lat, cityId);

        console.log(`✅ Seeded ${city.city} (${cityId})`);
      } catch (cityError) {
        console.error(`❌ Failed to seed city: ${city.city}`, cityError);
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding Redis:', error);
  } finally {
    redis.disconnect();
  }
}

seedRedis().catch((error) => {
  console.error('❌ Unexpected error during seeding:', error);
  process.exit(1);
});
