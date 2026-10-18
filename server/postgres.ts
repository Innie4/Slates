import { Pool, type PoolClient } from "pg";
import type { Store, StoreConnection, Value } from "./store.ts";

export class DatabaseBusyError extends Error {
  constructor() { super("The service is busy. Please try again shortly."); }
}

function databaseError(error: unknown): never {
  if (error instanceof Error && !("code" in error) && ["timeout exceeded when trying to connect", "Connection terminated due to connection timeout"].includes(error.message)) throw new DatabaseBusyError();
  throw error;
}

const migration = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL, password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'household' CHECK (role = 'household'),
    terms_version TEXT NOT NULL, terms_accepted_at TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), reference TEXT NOT NULL UNIQUE,
    payload TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('requested','cancelled')),
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS bookings_user ON bookings(user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), reference TEXT NOT NULL UNIQUE,
    booking_id TEXT REFERENCES bookings(id), payload TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS tickets_user ON tickets(user_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS idempotency (
    scope TEXT NOT NULL, key TEXT NOT NULL, payload_hash TEXT NOT NULL,
    status INTEGER NOT NULL, response TEXT NOT NULL, expires_at BIGINT NOT NULL,
    PRIMARY KEY (scope, key)
  );
  CREATE INDEX IF NOT EXISTS idempotency_expiry ON idempotency(expires_at);
  CREATE TABLE IF NOT EXISTS rate_limits (
    bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS rate_limits_expiry ON rate_limits(resets_at);
`;

function parameters(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function connection(client: Pool | PoolClient): StoreConnection {
  const query = (sql: string, values: Value[]) => client.query(parameters(sql), values).catch(databaseError);
  return {
    async get(sql, ...values) { return (await query(sql, values)).rows[0]; },
    async all(sql, ...values) { return (await query(sql, values)).rows; },
    async run(sql, ...values) { await query(sql, values); },
    async lock(key) { await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key]); },
  };
}

export function openPostgres(connectionString: string, logError: () => void): Store {
  let url: URL;
  try { url = new URL(connectionString); } catch { throw new Error("DATABASE_URL must be a PostgreSQL connection URL."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) throw new Error("DATABASE_URL must include a PostgreSQL host and database.");
  // pg lets these URL parameters replace the ssl object, including verification.
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat", "channel_binding"]) url.searchParams.delete(key);
  const pool = new Pool({
    connectionString: url.href,
    ssl: { rejectUnauthorized: true },
    enableChannelBinding: true,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    maxLifetimeSeconds: 300,
    statement_timeout: 10_000,
    lock_timeout: 5_000,
    idle_in_transaction_session_timeout: 10_000,
    application_name: "slate-api",
  });
  pool.on("error", logError);
  let closing: Promise<void> | undefined;
  const close = () => closing ??= pool.end();
  async function transaction<T>(operation: (db: StoreConnection) => Promise<T>) {
    const client = await pool.connect().catch(databaseError);
    let broken = false;
    try {
      await client.query("BEGIN");
      const result = await operation(connection(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { broken = true; }
      throw error;
    } finally { client.release(broken); }
  }
  const ready = transaction(async db => {
    await db.lock("slate:schema-migrations");
    await db.run("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
    const current = await db.get("SELECT MAX(version) AS version FROM schema_migrations");
    if (Number(current?.version ?? 0) > 1) throw new Error("Database schema is newer than this application.");
    if (!current?.version) {
      await db.run(migration);
      await db.run("INSERT INTO schema_migrations(version,applied_at) VALUES(1,?)", new Date().toISOString());
    }
  }).catch(async () => {
    await close();
    throw new Error("Database initialization failed. Check the PostgreSQL connection, TLS certificate and migration permissions.");
  });
  const queries = connection(pool);
  return {
    ready,
    async get(sql, ...values) { await ready; return queries.get(sql, ...values); },
    async all(sql, ...values) { await ready; return queries.all(sql, ...values); },
    async run(sql, ...values) { await ready; return queries.run(sql, ...values); },
    async lock() { throw new Error("Locks require a transaction."); },
    async transaction(operation) { await ready; return transaction(operation); },
    close,
  };
}
