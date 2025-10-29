import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'brickyard.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  familyName TEXT NOT NULL,
  contactName TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  emergencyContact TEXT,
  emergencyPhone TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS animals (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  name TEXT NOT NULL,
  animalType TEXT NOT NULL,
  breed TEXT,
  age TEXT,
  weight TEXT,
  gender TEXT,
  color TEXT,
  foodRequirements TEXT,
  medications TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
);
`);

export default db;


