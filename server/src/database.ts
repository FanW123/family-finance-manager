import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For Vercel serverless: use /tmp directory (writable)
// For local dev: use project directory
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const dbPath = isVercel 
  ? '/tmp/finance.db'
  : path.join(__dirname, '../finance.db');

// Ensure /tmp directory exists in Vercel
if (isVercel) {
  try {
    if (!fs.existsSync('/tmp')) {
      fs.mkdirSync('/tmp', { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create /tmp directory:', error);
  }
}

let db: Database.Database;
try {
  db = new Database(dbPath);
  console.log(`Database initialized at: ${dbPath}`);
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export function initDatabase() {
  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Budgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL UNIQUE,
      monthly_limit REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Investments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('stocks', 'bonds', 'cash', 'crypto')),
      symbol TEXT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL,
      quantity REAL,
      account TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add account column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE investments ADD COLUMN account TEXT`);
  } catch (error: any) {
    // Column already exists, ignore error
    if (!error.message.includes('duplicate column name')) {
      console.warn('Could not add account column:', error.message);
    }
  }

  // Target allocation table
  db.exec(`
    CREATE TABLE IF NOT EXISTS target_allocation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL UNIQUE CHECK(type IN ('stocks', 'bonds', 'cash')),
      percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default target allocation if not exists
  const existing = db.prepare('SELECT COUNT(*) as count FROM target_allocation').get() as { count: number };
  if (existing.count === 0) {
    const insert = db.prepare('INSERT INTO target_allocation (type, percentage) VALUES (?, ?)');
    insert.run('stocks', 60);
    insert.run('bonds', 30);
    insert.run('cash', 10);
  }

  console.log('Database initialized');
}

export default db;

