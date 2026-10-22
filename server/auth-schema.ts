// Additive tables keep existing customer IDs, passwords and sessions intact.
export const authSchema = `
  CREATE TABLE IF NOT EXISTS external_identities (
    provider TEXT NOT NULL CHECK (provider IN ('google','apple')),
    subject TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL,
    PRIMARY KEY (provider,subject), UNIQUE (user_id,provider)
  );
  CREATE TABLE IF NOT EXISTS auth_flows (
    id TEXT PRIMARY KEY, purpose TEXT NOT NULL, browser_hash TEXT NOT NULL,
    user_id TEXT REFERENCES users(id), payload TEXT NOT NULL, expires_at BIGINT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS auth_flows_expiry ON auth_flows(expires_at);
  CREATE TABLE IF NOT EXISTS passkeys (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL,
    public_key TEXT NOT NULL, counter BIGINT NOT NULL, transports TEXT NOT NULL,
    device_type TEXT NOT NULL, backed_up INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS passkeys_user ON passkeys(user_id,created_at);
`;
