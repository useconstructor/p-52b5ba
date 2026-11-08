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
const legacySessionMarker = 'notas-session-established';
function sessionMarker(): { storage: Storage; key: string; direct: boolean } | undefined {
  try {
    if (window.top === window) return { storage: localStorage, key: `${legacySessionMarker}:direct`, direct: true };
    const ancestors = window.location.ancestorOrigins;
    // The browser supplies the outermost ancestor. A referrer identifies the
    // top-level parent only when this is not a nested frame.
    const parent = ancestors?.length ? ancestors[ancestors.length - 1] : window.parent === window.top ? document.referrer : '';
    if (parent) {
      try {
        const origin = new URL(parent).origin;
        if (origin !== 'null' && /^https?:/.test(origin)) return { storage: localStorage, key: `${legacySessionMarker}:embedded:${origin}`, direct: false };
      } catch { /* An opaque/invalid parent does not identify a partition. */ }
    }
    // Without an observable top-level origin, retain expectation in this frame
    // across reloads instead of guessing another partition's identity.
    return { storage: sessionStorage, key: `${legacySessionMarker}:embedded:context`, direct: false };
  } catch { return undefined; }
}
function markerPresent(marker: ReturnType<typeof sessionMarker>) {
  try { return marker?.storage.getItem(marker.key) === '1'; } catch { return false; }
}
function legacyMarkerPresent() {
  try { return localStorage.getItem(legacySessionMarker) === '1'; } catch { return false; }
}
function expectedSession() {
  const marker = sessionMarker();
  return sessionWasVerified || markerPresent(marker) || (marker?.direct === true && legacyMarkerPresent());
}
function rememberSession() {
  const marker = sessionMarker();
  try { marker?.storage.setItem(marker.key, '1'); } catch { /* The verified HttpOnly cookie still owns the session. */ }
}
export function initializeSession(recover = false) {
  if (initialization) return initialization;
  const run = async () => {
    if (!navigator.locks) {
      if (expectedSession()) return readSummary();
      throw new Error('Este navegador no permite preparar una sesión de forma segura. Abre la aplicación directamente en un navegador compatible.');
    }
    return navigator.locks.request('notas-de-bolsillo-session', { mode: 'exclusive' }, async () => {
      const marker = sessionMarker();
      if (!recover && marker?.direct === false && !markerPresent(marker) && legacyMarkerPresent()) {
        // The old unscoped marker could belong to either cookie partition.
        // Reuse an existing valid owner, but never create one from ambiguity.
        try {
          const summary = await readSummary();
          sessionWasVerified = true; rememberSession(); return summary;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) throw new Error('El acceso anterior no identifica esta sesión dentro de otra página. Abre la aplicación directamente o usa Recuperar el acceso para crear una sesión nueva de forma explícita.');
          throw error;
        }
      }
      await api<{ ok: true }>('/api/session', { method: 'POST', body: JSON.stringify({ esperada: expectedSession(), ...(recover ? { recuperar: true } : {}) }) });
      const summary = await readSummary();
      sessionWasVerified = true;
      rememberSession();
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
