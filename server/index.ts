import { resolve } from "node:path";
import { createServer } from "./server.ts";

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be between 1 and 65535.");
const production = process.env.NODE_ENV === "production";
const origin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || (production ? "" : "http://localhost:5173");
if (!origin) throw new Error("Set APP_ORIGIN to the public HTTPS origin.");
const server = createServer({
  databasePath: resolve(process.env.DATABASE_PATH || "data/slate.sqlite"),
  databaseUrl: process.env.DATABASE_URL || undefined,
  origin,
  trustedProxyIPs: (process.env.TRUSTED_PROXY_IPS || "").split(",").map(address => address.trim()).filter(Boolean),
  oauth: {
    ...(process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET ? { google: { clientId: process.env.AUTH_GOOGLE_CLIENT_ID, clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET } } : {}),
    ...(process.env.AUTH_APPLE_CLIENT_ID && process.env.AUTH_APPLE_TEAM_ID && process.env.AUTH_APPLE_KEY_ID && process.env.AUTH_APPLE_PRIVATE_KEY ? { apple: { clientId: process.env.AUTH_APPLE_CLIENT_ID, teamId: process.env.AUTH_APPLE_TEAM_ID, keyId: process.env.AUTH_APPLE_KEY_ID, privateKey: process.env.AUTH_APPLE_PRIVATE_KEY } } : {}),
  },
  ...(production ? { staticDirectory: resolve(process.env.STATIC_DIRECTORY || "dist") } : {}),
});
try { await server.ready; }
catch {
  process.stderr.write(`${JSON.stringify({ event: "database_startup_failed", message: "Check DATABASE_URL, TLS trust and database migration permissions." })}\n`);
  process.exit(1);
}
server.listen(port, process.env.HOST || "127.0.0.1", () => {
  process.stdout.write(`${JSON.stringify({ event: "server_started", port, mode: production ? "production" : "development" })}\n`);
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(async () => {
      try { await server.databaseClosed; process.exit(0); }
      catch { process.exit(1); }
    });
    setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 10_000).unref();
  });
}
