import "server-only";
import { NextResponse } from "next/server";

export type ErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string> };
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function privateJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function handle(action: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError) {
      const body: ErrorBody = { error: { code: error.code, message: error.message } };
      if (error.fields) body.error.fields = error.fields;
      return privateJson(body, error.status);
    }
    // Driver exceptions may contain SQL or credentials; never echo them.
    return privateJson({ error: {
      code: "SERVICE_UNAVAILABLE",
      message: "No se puede completar la solicitud ahora. Reintenta para confirmar el resultado.",
    } }, 503);
  }
}

function normalizeTrustedOrigin(value: string): string {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("Invalid origin configuration");
  }
  return parsed.origin;
}

export function requireOrigin(request: Request): string {
  const trusted = new Set<string>();
  if (process.env.APP_ORIGIN) trusted.add(normalizeTrustedOrigin(process.env.APP_ORIGIN));
  if (process.env.VERCEL_URL) trusted.add(normalizeTrustedOrigin(`https://${process.env.VERCEL_URL}`));
  if (!trusted.size) throw new Error("Origin configuration unavailable");
  const supplied = request.headers.get("origin");
  if (!supplied || !trusted.has(supplied)) {
    throw new ApiError(403, "ORIGIN_FORBIDDEN", "Origen de la solicitud no permitido.");
  }
  return supplied;
}

export function validateQuery(request: Request, allowed: readonly string[] = []): URLSearchParams {
  const query = new URL(request.url).searchParams;
  const fields: Record<string, string> = Object.create(null);
  for (const key of query.keys()) {
    if (!allowed.includes(key)) fields[key] = "Campo no permitido.";
    else if (query.getAll(key).length !== 1) fields[key] = "El parámetro no se puede repetir.";
  }
  if (Object.keys(fields).length) {
    throw new ApiError(400, "VALIDATION_ERROR", "Revisa los campos indicados.", fields);
  }
  return query;
}
