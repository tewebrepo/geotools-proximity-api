import Redis from 'ioredis';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || '',
});

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
  const filePath = process.env.BIGCITIES_FILE_PATH || '../data/big_cities.json';
  const absolutePath = filePath;

  try {
    if (!existsSync(absolutePath)) {
      console.error(`❌ File not found: ${absolutePath}`);
      process.exit(1);
    }

    console.log(`📂 Reading data from ${absolutePath}...`);
    const data = readFileSync(absolutePath, 'utf-8');

    console.log('📊 Parsing JSON data...');
    const cities: City[] = JSON.parse(data);

    console.log(`🚀 Starting to seed ${cities.length} cities into Redis...`);

    for (const city of cities) {
      try {
        const cityId = `${city.iso2.toLowerCase()}_${city.admin_name}_${city.city_ascii}`
          .replace(/[^a-z0-9_]/gi, '').toLowerCase();

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
  redis.disconnect();
});
