import { db } from './db';

let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = db
      .batch(
        [
          {
            sql: `CREATE TABLE IF NOT EXISTS products (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT NOT NULL DEFAULT '',
              price REAL NOT NULL DEFAULT 0,
              category TEXT NOT NULL DEFAULT '',
              stock INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            )`,
            args: [],
          },
          {
            sql: `CREATE TABLE IF NOT EXISTS posts (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              body TEXT NOT NULL,
              author TEXT NOT NULL DEFAULT 'Admin',
              published INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            )`,
            args: [],
          },
          {
            sql: `CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              name TEXT NOT NULL,
              created_at TEXT NOT NULL
            )`,
            args: [],
          },
          {
            sql: `CREATE TABLE IF NOT EXISTS sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT NOT NULL
            )`,
            args: [],
          },
        ],
        'write',
      )
      .then(() => {});
  }
  return ready;
}
