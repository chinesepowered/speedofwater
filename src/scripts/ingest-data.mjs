import { MongoClient } from 'mongodb';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dataDir = path.resolve(process.cwd(), 'data');
const mongoUri = process.env.MONGO_URI_STRING;
const dbName = 'speedofwater';

if (!mongoUri) {
  console.error('Error: MONGO_URI_STRING is not defined in your .env file.');
  process.exit(1);
}

const client = new MongoClient(mongoUri);

const fileMapping = {
  'SDWA_EVENTS_MILESTONES.csv': 'events_milestones',
  'SDWA_FACILITIES.csv': 'facilities',
  'SDWA_GEOGRAPHIC_AREAS.csv': 'geographic_areas',
  'SDWA_LCR_SAMPLES.csv': 'lcr_samples',
  'SDWA_PN_VIOLATION_ASSOC.csv': 'pn_violation_assoc',
  'SDWA_PUB_WATER_SYSTEMS.csv': 'pub_water_systems',
  'SDWA_REF_CODE_VALUES.csv': 'ref_code_values',
  'SDWA_SERVICE_AREAS.csv': 'service_areas',
  'SDWA_SITE_VISITS.csv': 'site_visits',
  'SDWA_VIOLATIONS_ENFORCEMENT.csv': 'violations_enforcement',
  'contaminant-health-effects.csv': 'contaminant_health_effects',
};

async function ingestData() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db(dbName);

    // Drop the database to start fresh - COMMENTED OUT
    // await db.dropDatabase();
    // console.log(`Dropped database: ${dbName}`);

    for (const [fileName, collectionName] of Object.entries(fileMapping)) {
      const filePath = path.join(dataDir, fileName);

      if (!fs.existsSync(filePath)) {
        console.warn(`File not found, skipping: ${filePath}`);
        continue;
      }

      console.log(`Processing ${filePath}...`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const result = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (result.errors.length > 0) {
        console.error(`Errors parsing ${filePath}:`, result.errors);
        continue;
      }

      if (result.data.length === 0) {
        console.warn(`No data found in ${filePath}, skipping.`);
        continue;
      }

      const collection = db.collection(collectionName);
      
      // Drop the collection if it exists
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length > 0) {
        await db.dropCollection(collectionName);
        console.log(`Dropped collection: ${collectionName}`);
      }
      
      await collection.insertMany(result.data);
      console.log(`Inserted ${result.data.length} documents into collection '${collectionName}'.`);
    }

  } catch (err) {
    console.error('An error occurred during data ingestion:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

ingestData(); 