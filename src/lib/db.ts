import "server-only";
import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;

// Public /api/info does not depend on database availability.
export function getDatabase(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) throw new Error("Database configuration unavailable");
    client = createClient({ url, authToken, intMode: "number", readYourWrites: true });
  }
  return client;
}

// Preserve the existing export without opening a connection on import.
export const db: Client = new Proxy({} as Client, {
  get(_target, property) {
    const current = getDatabase();
    const value = Reflect.get(current, property, current);
    return typeof value === "function" ? value.bind(current) : value;
  },
});
