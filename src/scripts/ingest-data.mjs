import Database from 'better-sqlite3';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.resolve(process.cwd(), 'water-data.db');

// Remove the old database file if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);

console.log('Database created successfully.'); 