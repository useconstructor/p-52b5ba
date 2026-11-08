import "server-only";
import { randomUUID } from "node:crypto";
import type { Row, Transaction } from "@libsql/client";
import { db } from "@/lib/db";
import { ApiError, handle, privateJson, requireOrigin, validateQuery } from "./http";
import { requireSession, type Session } from "./session";
import { canonicalEnvelope, jsonBody, validateBody, validateId, type JsonObject } from "./validation";

type Nota = {
  id: string;
  titulo: string;
  texto: string;
  fijada: boolean;
  created_at: string;
  updated_at: string;
  version: number;
};
type Operation = "crear" | "actualizar" | "fijar" | "eliminar";
type MutationResult = { status: number; body: Record<string, unknown> };

const projection = "id, titulo, texto, fijada, created_at, updated_at, version";
const order = "fijada DESC, updated_at DESC, id ASC";
const unavailable: MutationResult = {
  status: 404,
  body: { error: { code: "NOTE_UNAVAILABLE", message: "Nota no disponible" } },
};

function noteFromRow(row: Row): Nota {
  // Whitelist public columns, never spread owner or mutation/session records.
  const version = Number(row.version);
  if (!Number.isSafeInteger(version) || version < 1 || ![0, 1].includes(Number(row.fijada))) {
    throw new Error("Invalid persisted note");
  }
  return {
    id: String(row.id), titulo: String(row.titulo), texto: String(row.texto),
    fijada: Number(row.fijada) === 1,
    created_at: String(row.created_at), updated_at: String(row.updated_at), version,
  };
}

export function listNotes(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    const query = validateQuery(request, ["q"]);
    const search = query.get("q") ?? "";
    // LIKE treats %, _ and backslash literally after this escaping step.
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    const result = search === ""
      ? await db.execute({ sql: `SELECT ${projection} FROM notas WHERE propietario_id = ? ORDER BY ${order}`, args: [session.id] })
      : await db.execute({
        sql: `SELECT ${projection} FROM notas WHERE propietario_id = ? AND (titulo LIKE ? ESCAPE '\\' OR texto LIKE ? ESCAPE '\\') ORDER BY ${order}`,
        args: [session.id, pattern, pattern],
      });
    return privateJson({ notas: result.rows.map(noteFromRow) });
  });
}

export function summary(request: Request) {
  return handle(async () => {
    const session = await requireSession(request);
    validateQuery(request);
    // One authorized snapshot keeps counts and both groups mutually consistent.
    const result = await db.execute({
      sql: `SELECT ${projection} FROM notas WHERE propietario_id = ? ORDER BY ${order}`,
      args: [session.id],
    });
    const notes = result.rows.map(noteFromRow);
    const fijadas = notes.filter((note) => note.fijada);
    return privateJson({ total: notes.length, totalFijadas: fijadas.length, fijadas, recientes: notes.filter((note) => !note.fijada) });
  });
}

export function detail(request: Request, params: Promise<{ id: string }>) {
  return handle(async () => {
    const session = await requireSession(request);
    validateQuery(request);
    const { id } = await params;
    validateId(id);
    const result = await db.execute({
      sql: `SELECT ${projection} FROM notas WHERE propietario_id = ? AND id = ?`, args: [session.id, id],
    });
    return result.rows.length
      ? privateJson({ nota: noteFromRow(result.rows[0]) })
      : privateJson(unavailable.body, unavailable.status);
  });
}

function validateMutation(operation: Operation, body: JsonObject) {
  if (operation === "crear") {
    validateBody(body, { titulo: "title", texto: "string", fijada: "boolean", clave_idempotente: "uuid" }, ["texto"]);
  } else if (operation === "actualizar") {
    validateBody(body, { titulo: "title", texto: "string", version: "version", clave_idempotente: "uuid" });
  } else if (operation === "fijar") {
    validateBody(body, { fijada: "boolean", version: "version", clave_idempotente: "uuid" });
  } else {
    validateBody(body, { version: "version", clave_idempotente: "uuid" });
  }
}

async function ownedNote(tx: Transaction, owner: string, id: string): Promise<Nota | null> {
  const found = await tx.execute({
    sql: `SELECT ${projection} FROM notas WHERE propietario_id = ? AND id = ?`, args: [owner, id],
  });
  return found.rows.length ? noteFromRow(found.rows[0]) : null;
}

async function applyMutation(tx: Transaction, session: Session, operation: Operation, id: string | null, body: JsonObject): Promise<MutationResult> {
  if (operation === "crear") {
    const now = new Date().toISOString();
    const nota: Nota = {
      id: randomUUID(), titulo: body.titulo as string, texto: (body.texto as string | undefined) ?? "",
      fijada: body.fijada as boolean, created_at: now, updated_at: now, version: 1,
    };
    const result = await tx.execute({
      sql: "INSERT INTO notas(id, propietario_id, titulo, texto, fijada, created_at, updated_at, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [nota.id, session.id, nota.titulo, nota.texto, Number(nota.fijada), now, now, 1],
    });
    if (result.rowsAffected !== 1) throw new Error("Note insert failed");
    return { status: 201, body: { nota } };
  }
  if (!id) throw new Error("Missing internal target");
  const current = await ownedNote(tx, session.id, id);
  if (!current) return unavailable;
  if (current.version !== body.version) {
    return {
      status: 409,
      body: {
        error: { code: "VERSION_CONFLICT", message: "La nota cambió. Revisa la versión actual antes de continuar." },
        actual: current,
      },
    };
  }
  const version = current.version + 1;
  if (!Number.isSafeInteger(version)) throw new Error("Version cannot advance safely");
  if (operation === "eliminar") {
    const result = await tx.execute({
      sql: "DELETE FROM notas WHERE propietario_id = ? AND id = ? AND version = ?",
      args: [session.id, id, current.version],
    });
    if (result.rowsAffected !== 1) throw new Error("Note delete failed");
    return { status: 200, body: { eliminada: { id, version } } };
  }
  const previousTime = Date.parse(current.updated_at);
  if (!Number.isFinite(previousTime)) throw new Error("Invalid note timestamp");
  const updatedAt = new Date(Math.max(Date.now(), previousTime)).toISOString();
  const result = operation === "actualizar"
    ? await tx.execute({
      sql: "UPDATE notas SET titulo = ?, texto = ?, updated_at = ?, version = ? WHERE propietario_id = ? AND id = ? AND version = ?",
      args: [body.titulo as string, body.texto as string, updatedAt, version, session.id, id, current.version],
    })
    : await tx.execute({
      sql: "UPDATE notas SET fijada = ?, updated_at = ?, version = ? WHERE propietario_id = ? AND id = ? AND version = ?",
      args: [Number(body.fijada), updatedAt, version, session.id, id, current.version],
    });
  if (result.rowsAffected !== 1) throw new Error("Note update failed");
  const nota = await ownedNote(tx, session.id, id);
  if (!nota) throw new Error("Updated note unavailable");
  return { status: 200, body: { nota } };
}

async function transact(session: Session, operation: Operation, id: string | null, body: JsonObject): Promise<MutationResult> {
  const key = body.clave_idempotente as string;
  const envelope = canonicalEnvelope(operation, id, body);
  // BEGIN IMMEDIATE serializes first-use races before lookup or any note write.
  const tx = await db.transaction("write");
  try {
    const authorized = await tx.execute({
      sql: "SELECT id FROM sesiones WHERE id = ? AND secreto_hash = ?", args: [session.id, session.hash],
    });
    if (!authorized.rows.length) throw new ApiError(401, "SESSION_UNAVAILABLE", "No se puede mantener la sesión. Revisa las opciones de recuperación.");
    const replay = await tx.execute({
      sql: "SELECT operacion, nota_id, payload_inmutable, resultado_json, estado_http FROM mutaciones WHERE propietario_id = ? AND clave_idempotente = ?",
      args: [session.id, key],
    });
    if (replay.rows.length) {
      const previous = replay.rows[0];
      // Creation stores its resulting note id; the original target remains null
      // in the canonical envelope. Every retry is checked before note lookup.
      if (previous.operacion !== operation || previous.payload_inmutable !== envelope || (operation !== "crear" && previous.nota_id !== id)) {
        throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "Este envío ya se utilizó con otros datos. Recupera el envío original o inicia uno distinto.");
      }
      const result = { status: Number(previous.estado_http), body: JSON.parse(String(previous.resultado_json)) as Record<string, unknown> };
      await tx.commit();
      return result;
    }
    const result = await applyMutation(tx, session, operation, id, body);
    const created = result.body.nota as Nota | undefined;
    await tx.execute({
      sql: "INSERT INTO mutaciones(id, propietario_id, clave_idempotente, operacion, nota_id, payload_inmutable, resultado_json, estado_http, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [randomUUID(), session.id, key, operation, id ?? created?.id ?? null, envelope, JSON.stringify(result.body), result.status, new Date().toISOString()],
    });
    await tx.commit();
    return result;
  } finally {
    if (!tx.closed) {
      try { await tx.rollback(); } finally { tx.close(); }
    }
  }
}

export function mutate(request: Request, operation: Operation, params?: Promise<{ id: string }>) {
  return handle(async () => {
    requireOrigin(request);
    const session = await requireSession(request);
    validateQuery(request);
    const id = params ? (await params).id : null;
    if (id !== null) validateId(id);
    const body = await jsonBody(request);
    validateMutation(operation, body);
    const result = await transact(session, operation, id, body);
    return privateJson(result.body, result.status);
  });
}
