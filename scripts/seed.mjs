import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");

const vars = Object.fromEntries(
  env
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => l.split("=").map((s) => s.trim()))
    .map(([k, ...v]) => [k, v.join("=")])
);

const db = createClient({
  url: vars.TURSO_DATABASE_URL,
  authToken: vars.TURSO_AUTH_TOKEN,
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS items (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    description TEXT NOT NULL,
    status    TEXT NOT NULL DEFAULT 'active',
    amount    REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Clear existing seed data and re-insert
await db.execute(`DELETE FROM items WHERE id <= 6`);

const rows = [
  ["Plan Starter",    "Acceso básico a todas las funciones del template", "active",   29.00],
  ["Plan Pro",        "Componentes avanzados, soporte prioritario y actualizaciones",  "active",  79.00],
  ["Plan Enterprise", "Licencia de equipo ilimitada con SLA garantizado",             "active", 299.00],
  ["Add-on Analytics","Dashboard de métricas en tiempo real",                         "active",  19.00],
  ["Add-on AI",       "Integración con modelos de lenguaje vía AI SDK",               "pending", 49.00],
  ["Legacy Starter",  "Plan anterior — migrado a Plan Starter",                       "inactive", 0.00],
];

for (const [name, description, status, amount] of rows) {
  await db.execute({
    sql: `INSERT INTO items (name, description, status, amount) VALUES (?, ?, ?, ?)`,
    args: [name, description, status, amount],
  });
}

console.log("Seed completado:", rows.length, "items insertados.");
await db.close();
