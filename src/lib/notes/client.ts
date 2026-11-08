export type Nota = { id: string; titulo: string; texto: string; fijada: boolean; created_at: string; updated_at: string; version: number };
export type Resumen = { total: number; totalFijadas: number; fijadas: Nota[]; recientes: Nota[] };
export type ApiErrorBody = { error: { code: string; message: string; fields?: Record<string, string> }; actual?: Nota };
export class ApiError extends Error {
  constructor(public status: number, public data: ApiErrorBody) { super(data.error.message); }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } });
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error('No se ha podido interpretar la respuesta.'); }
  if (!response.ok) {
    const error = body as ApiErrorBody;
    if (!error?.error?.code || !error.error.message) throw new Error('No se ha podido interpretar la respuesta.');
    throw new ApiError(response.status, error);
  }
  return body as T;
}
let initialization: Promise<Resumen> | undefined;
let sessionWasVerified = false;
function expectedSession() {
  try { return sessionWasVerified || localStorage.getItem('notas-session-established') === '1'; } catch { return sessionWasVerified; }
}
export function initializeSession(recover = false) {
  if (initialization) return initialization;
  const run = async () => {
    if (!navigator.locks) {
      if (expectedSession()) return readSummary();
      throw new Error('Este navegador no permite preparar una sesión de forma segura. Abre la aplicación directamente en un navegador compatible.');
    }
    return navigator.locks.request('notas-de-bolsillo-session', { mode: 'exclusive' }, async () => {
      await api<{ ok: true }>('/api/session', { method: 'POST', body: JSON.stringify({ esperada: expectedSession(), ...(recover ? { recuperar: true } : {}) }) });
      const summary = await readSummary();
      sessionWasVerified = true;
      try { localStorage.setItem('notas-session-established', '1'); } catch { /* The verified HttpOnly cookie still owns the session. */ }
      return summary;
    });
  };
  initialization = run().finally(() => { initialization = undefined; });
  return initialization;
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function formatDate(value: string) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
export function ordered(notes: Nota[]) { return [...notes].sort((a,b) => Number(b.fijada) - Number(a.fijada) || b.updated_at.localeCompare(a.updated_at) || a.id.localeCompare(b.id)); }

export function isNota(value: unknown): value is Nota {
  if (!value || typeof value !== 'object') return false;
  const n = value as Nota;
  return typeof n.id === 'string' && UUID.test(n.id) && typeof n.titulo === 'string' && typeof n.texto === 'string' && typeof n.fijada === 'boolean' && Number.isSafeInteger(n.version) && n.version > 0 && typeof n.created_at === 'string' && Number.isFinite(Date.parse(n.created_at)) && typeof n.updated_at === 'string' && Number.isFinite(Date.parse(n.updated_at));
}

export async function readSummary(): Promise<Resumen> {
  const value = await api<Resumen>('/api/resumen');
  if (!Number.isSafeInteger(value.total) || value.total < 0 || !Number.isSafeInteger(value.totalFijadas) || value.totalFijadas < 0 || !Array.isArray(value.fijadas) || !value.fijadas.every(isNota) || !Array.isArray(value.recientes) || !value.recientes.every(isNota)) throw new Error('No se ha podido interpretar el resumen. Vuelve a intentarlo.');
  return value;
}
