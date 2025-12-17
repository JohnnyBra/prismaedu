import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;

// Initialize Database
export async function initDB() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Create a Key-Value store table to persist the app state sections
  await db.exec(`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  console.log('Database initialized');
}

// Generic Getter
export async function getData(key, defaultValue) {
  const result = await db.get('SELECT value FROM store WHERE key = ?', key);
  return result ? JSON.parse(result.value) : defaultValue;
}

// Generic Setter
export async function setData(key, value) {
  await db.run(
    'INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)',
    key,
    JSON.stringify(value)
  );
}
