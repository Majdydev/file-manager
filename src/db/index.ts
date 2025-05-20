import { useEffect, useState } from "react";

// Define interface for database operations
interface DbOperations {
  // Update return types to reflect Promise values
  execute: (sql: string, params?: any[]) => Promise<any>;
  query: (sql: string, params?: any[]) => Promise<any[]>;
  get: (sql: string, params?: any[]) => Promise<any>;
}

// Mock implementation
let db: DbOperations | null = null;

// Initialize database through Electron IPC
export const initDb = async (): Promise<DbOperations> => {
  if (db) return db;

  const dbPath = await window.electron.getDbPath();

  // Instead of directly using better-sqlite3 in the renderer,
  // create a proxy object that will communicate with the main process
  db = {
    execute: async (sql: string, params: any[] = []) => {
      // We'll need to implement these IPC methods in the main process
      return await window.electron.dbExecute(sql, params);
    },
    query: async (sql: string, params: any[] = []) => {
      return await window.electron.dbQuery(sql, params);
    },
    get: async (sql: string, params: any[] = []) => {
      return await window.electron.dbGet(sql, params);
    },
  };

  // Create tables
  await db?.execute(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  )`);

  await db?.execute(`CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    display_name TEXT,
    description TEXT,
    category TEXT,
    file_path TEXT,
    register_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db?.execute(`CREATE TABLE IF NOT EXISTS passions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    register_date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await db?.execute(`CREATE TABLE IF NOT EXISTS rendezvous (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passion_id INTEGER,
    date DATETIME NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    notification_state TEXT DEFAULT 'pending',
    FOREIGN KEY(passion_id) REFERENCES passions(id)
  )`);

  await db?.execute(`CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passion_id INTEGER,
    date DATETIME NOT NULL,
    notes TEXT,
    next_visit_date DATETIME,
    FOREIGN KEY(passion_id) REFERENCES passions(id)
  )`);

  return db;
};

// Get database
export const getDb = (): DbOperations => {
  if (!db) {
    throw new Error("Database not initialized - call initDb() first");
  }
  return db;
};

// Custom hook to initialize the database
export const useDatabase = () => {
  const [database, setDatabase] = useState<DbOperations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initDb()
      .then((db) => {
        setDatabase(db);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { db: database, loading, error };
};
