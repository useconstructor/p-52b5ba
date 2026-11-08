import "server-only";
import { createHash } from "node:crypto";
import type { Transaction } from "@libsql/client";
import { db } from "@/lib/db";

const migrationId = "notas-de-bolsillo-v1";
const statements = [
  `CREATE TABLE IF NOT EXISTS sesiones (
    id TEXT PRIMARY KEY NOT NULL,
    secreto_hash TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS notas (
    id TEXT PRIMARY KEY NOT NULL,
    propietario_id TEXT NOT NULL REFERENCES sesiones(id),
    titulo TEXT NOT NULL,
    texto TEXT NOT NULL,
    fijada INTEGER NOT NULL CHECK(fijada IN (0,1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL CHECK(version >= 1)
  )`,
  `CREATE TABLE IF NOT EXISTS mutaciones (
    id TEXT PRIMARY KEY NOT NULL,
    propietario_id TEXT NOT NULL REFERENCES sesiones(id),
    clave_idempotente TEXT NOT NULL,
    operacion TEXT NOT NULL,
    nota_id TEXT,
    payload_inmutable TEXT NOT NULL,
    resultado_json TEXT NOT NULL,
    estado_http INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(propietario_id, clave_idempotente)
  )`,
  "CREATE INDEX IF NOT EXISTS notas_propietario_orden ON notas(propietario_id, fijada DESC, updated_at DESC, id ASC)",
  "CREATE UNIQUE INDEX IF NOT EXISTS sesiones_secreto_unico ON sesiones(secreto_hash)",
  "CREATE UNIQUE INDEX IF NOT EXISTS mutaciones_propietario_clave ON mutaciones(propietario_id, clave_idempotente)",
] as const;
const checksum = createHash("sha256").update(statements.join("\n")).digest("hex");
let readiness: Promise<void> | undefined;

async function verifySchema(tx: Transaction): Promise<void> {
  const tables = [
    { name: "sesiones", columns: ["id", "secreto_hash", "created_at"] },
    { name: "notas", columns: ["id", "propietario_id", "titulo", "texto", "fijada", "created_at", "updated_at", "version"] },
    { name: "mutaciones", columns: ["id", "propietario_id", "clave_idempotente", "operacion", "nota_id", "payload_inmutable", "resultado_json", "estado_http", "created_at"] },
  ];
  // These identifiers are fixed migration constants, never supplied by callers.
  for (const table of tables) {
    const info = await tx.execute(`PRAGMA table_info(${table.name})`);
    for (const column of table.columns) {
      const found = info.rows.find((row) => row.name === column);
      const type = ["fijada", "version", "estado_http"].includes(column) ? "INTEGER" : "TEXT";
      if (!found || found.type !== type ||
        (column !== "nota_id" && column !== "id" && Number(found.notnull) !== 1) ||
        (column === "id" && Number(found.pk) !== 1)) {
        throw new Error("Incompatible notes schema");
      }
    }
    if (table.name !== "sesiones") {
      const fks = await tx.execute(`PRAGMA foreign_key_list(${table.name})`);
      if (!fks.rows.some((row) => row.table === "sesiones" && row.from === "propietario_id" && row.to === "id")) {
        throw new Error("Missing ownership constraint");
      }
      if (table.name === "mutaciones" && fks.rows.some((row) => row.from === "nota_id")) {
        throw new Error("Mutation history must survive deletion");
      }
    }
  }
  for (const [table, index, expected, unique] of [
    ["sesiones", "sesiones_secreto_unico", "secreto_hash", true],
    ["mutaciones", "mutaciones_propietario_clave", "propietario_id,clave_idempotente", true],
    ["notas", "notas_propietario_orden", "propietario_id,fijada,updated_at,id", false],
  ] as const) {
    const indexes = await tx.execute(`PRAGMA index_list(${table})`);
    const match = indexes.rows.find((row) => row.name === index);
    const columns = await tx.execute(`PRAGMA index_info(${index})`);
    if (!match || (unique && Number(match.unique) !== 1) || columns.rows.map((row) => row.name).join(",") !== expected) {
      throw new Error("Missing notes index");
    }
  }
  const definition = await tx.execute({ sql: "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?", args: ["notas"] });
  const compact = String(definition.rows[0]?.sql ?? "").toLowerCase().replace(/\s+/g, "");
  if (!compact.includes("check(fijadain(0,1))") || !compact.includes("check(version>=1)")) {
    throw new Error("Missing notes constraints");
  }
}

async function migrate(): Promise<void> {
  // libSQL enables foreign keys by default; assert this on the actual transaction
  // connection as well, since PRAGMA on a separate connection is insufficient.
  await db.execute("PRAGMA foreign_keys = ON");
  const tx = await db.transaction("write");
  try {
    const foreignKeys = await tx.execute("PRAGMA foreign_keys");
    if (Number(foreignKeys.rows[0]?.foreign_keys) !== 1) throw new Error("Foreign keys unavailable");
    await tx.execute(`CREATE TABLE IF NOT EXISTS notas_migraciones (
      id TEXT PRIMARY KEY NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL
    )`);
    const marker = await tx.execute({ sql: "SELECT checksum FROM notas_migraciones WHERE id = ?", args: [migrationId] });
    if (!marker.rows.length) {
      await tx.batch([...statements]);
      await verifySchema(tx);
      await tx.execute({
        sql: "INSERT INTO notas_migraciones(id, checksum, applied_at) VALUES (?, ?, ?)",
        args: [migrationId, checksum, new Date().toISOString()],
      });
    } else {
      if (marker.rows[0].checksum !== checksum) throw new Error("Migration mismatch");
      await verifySchema(tx);
    }
    await tx.commit();
  } finally {
    if (!tx.closed) {
      try { await tx.rollback(); } finally { tx.close(); }
    }
  }
}

export function ensureSchema(): Promise<void> {
  if (!readiness) {
    readiness = migrate().catch((error: unknown) => {
      readiness = undefined;
      throw error;
    });
  }
  return readiness;
}
