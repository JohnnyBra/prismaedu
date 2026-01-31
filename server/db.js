import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db;
const cache = new Map();

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
  if (cache.has(key)) {
    const cached = cache.get(key);
    // Return shallow copy for performance.
    // Deep clone is too slow (2ms+ for 2k users).
    // App architecture replaces full state via sockets, so shallow copy is safe enough.
    if (Array.isArray(cached)) return cached.slice();
    if (typeof cached === 'object' && cached !== null) return { ...cached };
    return cached;
  }
  const result = await db.get('SELECT value FROM store WHERE key = ?', key);
  const data = result ? JSON.parse(result.value) : defaultValue;

  if (cache.size > 50) {
    cache.clear();
  }

  cache.set(key, data);
  return data;
}

// Generic Setter
export async function setData(key, value) {
  cache.set(key, value);
  await db.run(
    'INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)',
    key,
    JSON.stringify(value)
  );
}
