'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ApiError, initializeSession, readSummary, type Resumen } from '@/lib/notes/client';

type Context = {
  summary: Resumen | null; ready: boolean; loading: boolean; error: string; sessionError: boolean;
  revision: number; retry: (recover?: boolean) => void; refresh: () => void; notifyChange: () => void;
  protect: (value: boolean) => void;
};
const NotesContext = createContext<Context | null>(null);
export function useNotes() { const c = useContext(NotesContext); if (!c) throw new Error('NotesProvider missing'); return c; }
export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<Resumen | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionError, setSessionError] = useState(false);
  const [revision, setRevision] = useState(0);
  const protectedRef = useRef(false);
  const request = useRef(0);
  const channel = useRef<BroadcastChannel | null>(null);
  const readyRef = useRef(false);
  const protect = useCallback((value: boolean) => { protectedRef.current = value; }, []);
  const retry = useCallback(async (recover = false) => {
    const id = ++request.current;
    setLoading(true); setError('');
    try {
      const result = await initializeSession(recover);
      if (id !== request.current) return;
      setSummary(result); setReady(true); readyRef.current = true; setSessionError(false); setRevision(x => x+1);
    } catch (e) {
      if (id !== request.current) return;
      setError(e instanceof Error ? e.message : 'No se puede mantener la sesión.');
      setSessionError(true);
    } finally { if (id === request.current) setLoading(false); }
  }, []);
  const refresh = useCallback(async () => {
    if (!readyRef.current) return;
    const id = ++request.current;
    setLoading(true);
    try {
      const result = await readSummary();
      if (id !== request.current) return;
      setSummary(result); setError(''); setSessionError(false); setRevision(x => x+1);
    } catch (e) {
      if (id !== request.current) return;
      setError(e instanceof Error ? e.message : 'No se ha podido cargar el resumen.');
      setSessionError(e instanceof ApiError && e.status === 401);
    } finally { if (id === request.current) setLoading(false); }
  }, []);
  const notifyChange = useCallback(() => {
    channel.current?.postMessage({ type: 'notas-cambiadas' });
    void refresh();
  }, [refresh]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void retry(); });
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('notas-de-bolsillo'); channel.current = bc;
      bc.onmessage = event => { if (event.data?.type === 'notas-cambiadas') void refresh(); };
    }
    return () => { active = false; window.removeEventListener('focus', onFocus); channel.current?.close(); };
  }, [retry, refresh]);
  useEffect(() => {
    const ask = () => !protectedRef.current || window.confirm('Hay cambios sin guardar o envíos sin confirmar. ¿Quieres descartarlos y salir?');
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = (event.target as Element).closest('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const dest = new URL(a.href, location.href);
      if (dest.origin !== location.origin || (dest.pathname === location.pathname && dest.search === location.search)) return;
      if (!ask()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (dest.pathname === '/notas' && dest.searchParams.get('nueva') === '1') {
        (window as Window & { constructorTrack?: (name: string) => void }).constructorTrack?.('Nueva nota');
      }
    };
    const unload = (event: BeforeUnloadEvent) => { if (protectedRef.current) { event.preventDefault(); event.returnValue = ''; } };
    // Preserve Next's history payload while adding an index for reversible Back/Forward guards.
    const originalPush = history.pushState;
    const originalReplace = history.replaceState;
    let index = Number(history.state?.notesHistoryIndex ?? 0);
    let restoring = false;
    let canceledFocus: HTMLElement | null = null;
    originalReplace.call(history, { ...history.state, notesHistoryIndex: index }, '');
    history.pushState = function (state, title, url) { index++; originalPush.call(this, { ...state, notesHistoryIndex: index }, title, url); };
    history.replaceState = function (state, title, url) { originalReplace.call(this, { ...state, notesHistoryIndex: index }, title, url); };
    const pop = (event: PopStateEvent) => {
      const next = Number(event.state?.notesHistoryIndex ?? 0);
      if (restoring) { restoring = false; event.stopImmediatePropagation(); canceledFocus?.focus({ preventScroll: true }); canceledFocus = null; return; }
      const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!ask()) {
        canceledFocus = previousFocus;
        event.stopImmediatePropagation(); restoring = true; history.go(index - next); return;
      }
      index = next;
    };
    document.addEventListener('click', click, true);
    window.addEventListener('beforeunload', unload);
    window.addEventListener('popstate', pop, true);
    return () => {
      document.removeEventListener('click', click, true); window.removeEventListener('beforeunload', unload); window.removeEventListener('popstate', pop, true);
      history.pushState = originalPush; history.replaceState = originalReplace;
    };
  }, []);
  return <NotesContext.Provider value={{ summary, ready, loading, error, sessionError, revision, retry, refresh, notifyChange, protect }}>{children}</NotesContext.Provider>;
}
