import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { ApiError, handle, privateJson, requireOrigin, validateQuery } from "./http";
import { ensureSchema } from "./schema";
import { jsonBody, validateBody } from "./validation";

const COOKIE_NAME = "notas_session";
const SECRET_PATTERN = /^[0-9a-f]{64}$/;
type CookieState = { present: boolean; token?: string };
export type Session = { id: string; hash: string };

function sessionCookie(request: Request): CookieState {
  const matches = (request.headers.get("cookie") ?? "").split(";")
    .map((part) => part.trim()).filter((part) => part.split("=", 1)[0] === COOKIE_NAME);
  if (!matches.length) return { present: false };
  if (matches.length !== 1) return { present: true };
  const token = matches[0].slice(COOKIE_NAME.length + 1);
  return { present: true, token: SECRET_PATTERN.test(token) ? token : undefined };
}

function hashSecret(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function lookup(token: string): Promise<Session | null> {
  await ensureSchema();
  const hash = hashSecret(token);
  const result = await db.execute({ sql: "SELECT id FROM sesiones WHERE secreto_hash = ?", args: [hash] });
  return result.rows.length ? { id: String(result.rows[0].id), hash } : null;
}

export async function requireSession(request: Request): Promise<Session> {
  const cookie = sessionCookie(request);
  if (!cookie.present) throw new ApiError(401, "SESSION_REQUIRED", "Prepara tu sesión para acceder a tus notas.");
  const session = cookie.token ? await lookup(cookie.token) : null;
  if (!session) throw new ApiError(401, "SESSION_UNAVAILABLE", "No se puede mantener la sesión. Revisa las opciones de recuperación.");
  return session;
}

export function initializeSession(request: Request) {
  return handle(async () => {
    const origin = requireOrigin(request);
    validateQuery(request);
    const body = await jsonBody(request);
    validateBody(body, { esperada: "boolean", recuperar: "boolean" }, ["recuperar"]);
    const cookie = sessionCookie(request);
    const existing = cookie.token ? await lookup(cookie.token) : null;
    // Never replace a valid cookie, including an explicit recovery request.
    if (existing) return privateJson({ ok: true });
    if ((cookie.present || body.esperada) && body.recuperar !== true) {
      throw new ApiError(401, "SESSION_UNAVAILABLE", "No se puede mantener la sesión. Revisa las opciones de recuperación.");
    }
    await ensureSchema();
    const token = randomBytes(32).toString("hex");
    const tx = await db.transaction("write");
    try {
      await tx.execute({
        sql: "INSERT INTO sesiones(id, secreto_hash, created_at) VALUES (?, ?, ?)",
        args: [randomUUID(), hashSecret(token), new Date().toISOString()],
      });
      await tx.commit();
    } finally {
      if (!tx.closed) {
        try { await tx.rollback(); } finally { tx.close(); }
      }
    }
    const response = privateJson({ ok: true });
    const secure = origin.startsWith("https://");
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
      partitioned: secure,
      path: "/",
      maxAge: 31536000,
    });
    return response;
  });
}
