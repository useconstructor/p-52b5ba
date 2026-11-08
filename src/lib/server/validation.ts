import "server-only";
import { ApiError } from "./http";

export const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export type JsonObject = Record<string, unknown>;
type FieldKind = "title" | "string" | "boolean" | "uuid" | "version";
type Shape = Record<string, FieldKind>;

export async function jsonBody(request: Request): Promise<JsonObject> {
  let value: unknown;
  try { value = await request.json(); }
  catch { throw new ApiError(400, "INVALID_JSON", "La solicitud debe contener JSON válido."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "INVALID_JSON", "La solicitud debe contener un objeto JSON.");
  }
  return value as JsonObject;
}

export function validateBody(body: JsonObject, shape: Shape, optional: readonly string[] = []): void {
  const fields: Record<string, string> = Object.create(null);
  for (const key of Object.keys(body)) {
    if (!Object.hasOwn(shape, key)) fields[key] = "Campo no permitido.";
  }
  for (const [key, kind] of Object.entries(shape)) {
    if (!Object.hasOwn(body, key)) {
      if (!optional.includes(key)) fields[key] = "Campo obligatorio.";
      continue;
    }
    const value = body[key];
    if (kind === "version") {
      if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
        fields[key] = "La versión debe ser un entero positivo.";
      }
    } else if (kind === "boolean") {
      if (typeof value !== "boolean") fields[key] = "Tipo de campo no válido.";
    } else if (typeof value !== "string") {
      fields[key] = "Tipo de campo no válido.";
    } else if (kind === "uuid" && !UUID_V4.test(value)) {
      fields[key] = "Identificador no válido.";
    } else if (kind === "title" && !value.trim().length) {
      fields[key] = "Escribe un título para guardar la nota.";
    }
  }
  if (Object.keys(fields).length) {
    throw new ApiError(400, "VALIDATION_ERROR", "Revisa los campos indicados.", fields);
  }
}

export function validateId(id: string): void {
  if (!UUID_V4.test(id)) {
    throw new ApiError(400, "INVALID_REFERENCE", "Referencia no válida.", { id: "Identificador no válido." });
  }
}

// Accepted bodies contain primitives only. Preserve optional-field presence and
// exact strings, while making property insertion order irrelevant to replay.
export function canonicalEnvelope(operation: string, id: string | null, body: JsonObject): string {
  const ordered = Object.fromEntries(Object.keys(body).sort().map((key) => [key, body[key]]));
  const path = id ? `/api/notas/${id}/${operation}` : "/api/notas";
  return JSON.stringify({ method: "POST", path, operation, target: id, body: ordered });
}
