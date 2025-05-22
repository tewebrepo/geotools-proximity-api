import * as SQLite from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { createLocationId } from '../src/utils/text.utils';
import { checkSqliteSeeding } from '../src/utils/seeding.utils';
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

async function seedSqlite() {
  const dbPath = process.env.SQLITE_PATH || 'data/locations.db';
  const filePath = process.env.BIGCITIES_FILE_PATH || 'data/big_cities.json';

  console.log(`🗄️ Initializing SQLite database at ${dbPath}...`);
  const db = new SQLite(dbPath);

  try {
    // Check if seeding is necessary
    if (!forceSeeding) {
      console.log('🔍 Checking if seeding is necessary...');
      const needsSeeding = await checkSqliteSeeding(db, filePath);
      if (!needsSeeding) {
        console.log('✨ SQLite data is already up to date');
        return;
      }
    }

    // Read and parse data
    console.log(`📂 Reading data from ${filePath}...`);
    const fileContent = readFileSync(filePath, 'utf-8');
    const cities: City[] = JSON.parse(fileContent);

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        population INTEGER
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS locations_rtree USING rtree(
        id,              -- Integer primary key
        minLat, maxLat,  -- Latitude bounds
        minLng, maxLng   -- Longitude bounds
      );

      CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(lat, lng);
      CREATE INDEX IF NOT EXISTS idx_locations_population ON locations(population);
    `);

    // Prepare statements
    const insertLocation = db.prepare(`
      INSERT OR REPLACE INTO locations (id, data, lat, lng, population)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertRtree = db.prepare(`
      INSERT OR REPLACE INTO locations_rtree (id, minLat, maxLat, minLng, maxLng)
      VALUES (?, ?, ?, ?, ?)
    `);

    console.log(`🚀 Starting to seed ${cities.length} cities into SQLite...`);

    // Use transaction for better performance
    const transaction = db.transaction((cities: City[]) => {
      for (const city of cities) {
        try {
          const cityId = createLocationId(
            city.city,
            city.admin_name,
            city.iso2,
          );

          insertLocation.run(
            cityId,
            JSON.stringify(city),
            city.lat,
            city.lng,
            city.population,
          );

          insertRtree.run(cityId, city.lat, city.lat, city.lng, city.lng);

          console.log(`✅ Seeded ${city.city} (${cityId})`);
        } catch (cityError) {
          console.error(`❌ Failed to seed city: ${city.city}`, cityError);
        }
      }
    });

    // Execute transaction
    transaction(cities);

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding SQLite:', error);
    process.exit(1);
  }
}

seedSqlite().catch((error) => {
  console.error('❌ Unexpected error during seeding:', error);
  process.exit(1);
});
