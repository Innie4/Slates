import { DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { authSchema } from "./auth-schema.ts";

export type Row = Record<string, string | number | null>;
export type Value = string | number | null;

export interface StoreConnection {
  get(sql: string, ...values: Value[]): Promise<Row | undefined>;
  all(sql: string, ...values: Value[]): Promise<Row[]>;
  run(sql: string, ...values: Value[]): Promise<void>;
  lock(key: string): Promise<void>;
}

export interface Store extends StoreConnection {
  ready: Promise<void>;
  transaction<T>(operation: (connection: StoreConnection) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export function openStore(path: string): Store {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  if (path !== ":memory:") chmodSync(path, 0o600);
  const version = Number((db.prepare("PRAGMA user_version").get() as { user_version: number }).user_version);
  if (version > 2) { db.close(); throw new Error("Database schema is newer than this application."); }
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'household' CHECK (role = 'household'),
      terms_version TEXT NOT NULL, terms_accepted_at TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL,
      authenticated_at INTEGER
    ) STRICT;
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), reference TEXT NOT NULL UNIQUE,
      payload TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('requested','cancelled')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS bookings_user ON bookings(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), reference TEXT NOT NULL UNIQUE,
      booking_id TEXT REFERENCES bookings(id), payload TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS tickets_user ON tickets(user_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS idempotency (
      scope TEXT NOT NULL, key TEXT NOT NULL, payload_hash TEXT NOT NULL,
      status INTEGER NOT NULL, response TEXT NOT NULL, expires_at INTEGER NOT NULL,
      PRIMARY KEY (scope, key)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idempotency_expiry ON idempotency(expires_at);
    CREATE TABLE IF NOT EXISTS rate_limits (
      bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(resets_at);
    ${authSchema}
  `);
  if (!(db.prepare("PRAGMA table_info(sessions)").all() as { name: string }[]).some(column => column.name === "authenticated_at")) {
    db.exec("ALTER TABLE sessions ADD COLUMN authenticated_at INTEGER");
  }
  db.exec("PRAGMA user_version = 2");
  const connection: StoreConnection = {
    async get(sql, ...values) { return db.prepare(sql).get(...values) as Row | undefined; },
    async all(sql, ...values) { return db.prepare(sql).all(...values) as Row[]; },
    async run(sql, ...values) { db.prepare(sql).run(...values); },
    async lock() {},
  };
  // One SQLite connection must not interleave requests while a transaction awaits.
  let queue = Promise.resolve();
  async function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { return await operation(); } finally { release(); }
  }
  return {
    ready: Promise.resolve(),
    get: (sql, ...values) => exclusive(() => connection.get(sql, ...values)),
    all: (sql, ...values) => exclusive(() => connection.all(sql, ...values)),
    run: (sql, ...values) => exclusive(() => connection.run(sql, ...values)),
    async lock() { throw new Error("Locks require a transaction."); },
    transaction: operation => exclusive(async () => {
      db.exec("BEGIN IMMEDIATE");
      try {
        const result = await operation(connection);
        db.exec("COMMIT");
        return result;
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    }),
    close: () => exclusive(async () => { db.close(); }),
  };
}
