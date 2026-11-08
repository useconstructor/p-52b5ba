'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, FileText, Pin, PinOff, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { Button } from './controls';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { api, ApiError, formatDate, ordered, UUID, isNota, type Nota } from '@/lib/notes/client';
import { useNotes } from './provider';
import { SessionState } from './shell';

type Reference = { kind: 'none' | 'new' | 'invalid' | 'note'; id?: string };
type Draft = { titulo: string; texto: string; fijada: boolean };
type Operation = 'create' | 'update' | 'pin' | 'delete';
type Envelope = Readonly<{ key: string; path: string; body: Readonly<Record<string, string | number | boolean>>; operation: Operation; draft: Draft; previous: Nota | null; subject: string | null }>;
type MobilePin = { id: string; fijada: boolean; disabled: boolean; status: string; invoke: () => void };
type Conflict = { actual: Nota; previous: Nota | null; envelope: Envelope };
const blank = (): Draft => ({ titulo: '', texto: '', fijada: false });
const sameText = (a: Draft, b: Draft) => a.titulo === b.titulo && a.texto === b.texto;
function referenceFrom(query: string): Reference {
  const params = new URLSearchParams(query);
  if ([...params.keys()].some(k => k !== 'nota' && k !== 'nueva') || params.getAll('nota').length > 1 || params.getAll('nueva').length > 1 || (params.has('nota') && params.has('nueva'))) return { kind: 'invalid' };
  if (params.has('nueva')) return { kind: params.get('nueva') === '1' ? 'new' : 'invalid' };
  if (params.has('nota')) return UUID.test(params.get('nota') || '') ? { kind: 'note', id: params.get('nota')! } : { kind: 'invalid' };
  return { kind: 'none' };
}
export function Workspace() {
  // Entering from a long home summary opens at the working edge. Subsequent
  // selections stay in this mounted workspace and scroll only the note list.
  useLayoutEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  const params = useSearchParams();
  const query = params.toString();
  const reference = useMemo(() => referenceFrom(query), [query]);
  const { ready, revision, notifyChange } = useNotes();
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [retry, setRetry] = useState(0);
  const [mobileView, setMobileView] = useState({ query, list: reference.kind === 'none' });
  const mobileList = mobileView.query === query ? mobileView.list : reference.kind === 'none';
  const setMobileList = useCallback((list: boolean) => setMobileView({ query, list }), [query]);
  const rowNodes = useRef(new Map<string, HTMLDivElement>());
  const listScroll = useRef<HTMLDivElement>(null);
  const revealedSelection = useRef<string | null>(null);
  const [mobilePin, setMobilePin] = useState<MobilePin | null>(null);
  const oldPositions = useRef<Map<string, DOMRect> | null>(null);
  const animations = useRef<Animation[]>([]);
  const pinFocus = useRef<HTMLElement | null>(null);
  const listGeneration = useRef(0);
  const newNote = useRef<HTMLAnchorElement>(null);
  const focusAfterDelete = useRef(false);
  const listTitle = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (returnFocus.current && mobileList) { listTitle.current?.focus(); returnFocus.current = false; }
  }, [mobileList]);
  useLayoutEffect(() => {
    const id = reference.id;
    if (!id) { revealedSelection.current = null; return; }
    if (revealedSelection.current === id || !matchMedia('(min-width: 640px)').matches) return;
    const row = rowNodes.current.get(id);
    const scroller = listScroll.current;
    if (!row || !scroller) return;
    // Reveal an explicitly opened subject inside the list, without moving the
    // document, replacing its row, or changing the visitor's keyboard focus.
    const bounds = row.getBoundingClientRect();
    const viewport = scroller.getBoundingClientRect();
    if (bounds.top < viewport.top || bounds.bottom > viewport.bottom) {
      scroller.scrollTop += bounds.top - viewport.top;
    }
    revealedSelection.current = id;
  }, [reference.id, notes, mobileList]);
  useEffect(() => {
    if (!ready) return;
    const generation = ++listGeneration.current;
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setListError(''); } });
    const timer = setTimeout(async () => {
      try {
        const data = await api<{ notas: Nota[] }>(`/api/notas?q=${encodeURIComponent(search)}`, { signal: controller.signal });
        if (!Array.isArray(data.notas) || !data.notas.every(isNota)) throw new Error('La respuesta de notas no es válida. Vuelve a intentarlo.');
        if (generation === listGeneration.current) setNotes(data.notas);
      } catch (e) {
        if (controller.signal.aborted || generation !== listGeneration.current) return;
        setListError(e instanceof Error ? e.message : 'No se han podido cargar las notas.');
      } finally { if (!controller.signal.aborted && generation === listGeneration.current) setLoading(false); }
    }, search ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [ready, revision, search, retry]);
  useLayoutEffect(() => {
    const positions = oldPositions.current;
    oldPositions.current = null;
    if (positions && matchMedia('(min-width: 640px)').matches) {
      const row = reference.id ? rowNodes.current.get(reference.id) : null;
      const scroller = listScroll.current;
      if (row && scroller) {
        const bounds = row.getBoundingClientRect();
        const viewport = scroller.getBoundingClientRect();
        if (bounds.top < viewport.top || bounds.bottom > viewport.bottom) {
          scroller.scrollTop += bounds.top - viewport.top;
        }
      }
    }
    // Moving a row can detach its focused mobile action during DOM insertion.
    // Restore that same control before the browser paints the confirmed move.
    if (pinFocus.current?.isConnected) {
      pinFocus.current.focus({ preventScroll: true });
      if (pinFocus.current.closest('.mobile-row-action')) pinFocus.current.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    pinFocus.current = null;
    if (positions && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const measurements = [...rowNodes.current].map(([id, node]) => ({ node, before: positions.get(id), after: node.getBoundingClientRect() }));
      animations.current = measurements.flatMap(({ node, before, after }) => {
        const delta = before ? before.top - after.top : 0;
        return delta ? [node.animate([{ transform: `translateY(${delta}px)`, zIndex: node.dataset.selected === 'true' ? 2 : 1 }, { transform: 'translateY(0)', zIndex: node.dataset.selected === 'true' ? 2 : 1 }], { duration: 180, easing: 'ease-out' })] : [];
      });
    }
    if (focusAfterDelete.current) { focusAfterDelete.current = false; newNote.current?.focus(); }
  }, [notes, reference.id]);
  useEffect(() => () => { animations.current.forEach(a => a.cancel()); }, []);
  const confirmed = useCallback((note: Nota | null, operation: Operation, deletedId?: string) => {
    listGeneration.current++;
    if (operation === 'pin') {
      pinFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      animations.current.forEach(a => a.cancel());
      oldPositions.current = new Map([...rowNodes.current].map(([id, node]) => [id, node.getBoundingClientRect()]));
    }
    setNotes(current => {
      if (operation === 'delete') return current.filter(n => n.id !== deletedId);
      if (!note) return current;
      const existing = current.find(n => n.id === note.id);
      if (existing && existing.version > note.version) return current;
      const rest = current.filter(n => n.id !== note.id);
      const text = `${note.titulo}\n${note.texto}`.toLocaleLowerCase();
      return ordered(!search || text.includes(search.toLocaleLowerCase()) ? [...rest, note] : rest);
    });
    if (operation === 'delete') { focusAfterDelete.current = true; setMobileList(true); }
    notifyChange();
    setRetry(x => x + 1);
  }, [notifyChange, search, setMobileList]);
  return <main id="contenido" tabIndex={-1} className="notes-main"><div className="notes-page-heading"><h1>Notas</h1><span>Ideas a mano. Espacio para escribir.</span></div><SessionState />{ready && <div className={`notes-workspace ${mobileList ? 'show-list' : 'show-editor'}`}>
    <aside className="notes-list" aria-label="Lista de notas"><div className="list-heading"><h2 ref={listTitle} tabIndex={-1}>Mis notas</h2><Link ref={newNote} href="/notas?nueva=1" className="action compact" onClick={() => setMobileList(false)}><Plus size={18} />Nueva nota</Link></div><div className="search-group"><label htmlFor="buscar">Buscar notas</label><div className="search-control"><Search size={18} /><input id="buscar" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Título o texto" autoComplete="off" />{search && <Button variant="ghost" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}><X size={18} /></Button>}</div></div>
    <div className="list-feedback" role="status">{loading ? 'Buscando notas…' : listError ? 'No se pudo actualizar la lista' : `${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}${search ? ' encontradas' : ''}`}</div>
    <div ref={listScroll} className="list-scroll">
    {listError && <div className="list-error" role="alert"><AlertCircle size={20} /><p>{listError}</p><Button variant="outline" onClick={() => setRetry(x => x+1)}>Reintentar</Button></div>}
    {!loading && !listError && notes.length === 0 && <div className="list-empty"><FileText size={28} /><h3>{search ? 'Sin resultados' : 'Todavía no tienes notas'}</h3><p>{search ? 'Prueba con otras palabras o vuelve a ver todas tus notas.' : 'Tu próxima idea empieza aquí.'}</p>{search ? <Button variant="outline" onClick={() => setSearch('')}>Limpiar búsqueda</Button> : <Link href="/notas?nueva=1" className="quiet-link" onClick={() => setMobileList(false)}>Crear mi primera nota <ArrowLeft className="rotate-180" size={16} /></Link>}</div>}
    <div className="note-rows" aria-busy={loading}>{notes.map(note => <div key={note.id} ref={node => { if (node) rowNodes.current.set(note.id, node); else rowNodes.current.delete(note.id); }} data-note-id={note.id} data-selected={reference.id === note.id}><Link href={`/notas?nota=${note.id}`} aria-current={reference.id === note.id ? 'true' : undefined} className={`note-row ${reference.id === note.id ? 'selected' : ''}`} onClick={() => setMobileList(false)}><div className="note-row-title"><h3>{note.titulo}</h3>{note.fijada && <Pin size={16} aria-label="Nota fijada" />}</div>{note.texto && <p>{note.texto}</p>}<div className="note-row-meta"><time dateTime={note.updated_at}>{formatDate(note.updated_at)}</time>{reference.id === note.id && <span>Abierta</span>}</div></Link>{reference.id === note.id && mobilePin?.id === note.id && <div className="mobile-row-action"><Button variant="outline" focusableWhenDisabled disabled={mobilePin.disabled} onClick={mobilePin.invoke}>{mobilePin.fijada ? <PinOff size={18} /> : <Pin size={18} />}{mobilePin.fijada ? 'Desfijar' : 'Fijar'}</Button><span role="status">{mobilePin.status}</span></div>}</div>)}</div>
    </div></aside>
    <Editor reference={reference} publishMobilePin={setMobilePin} onConfirmed={confirmed} onReturn={() => { returnFocus.current = true; setMobileList(true); }} visible={!mobileList} />
  </div>}</main>;
}

function Editor({ reference, onConfirmed, onReturn, visible, publishMobilePin }: { publishMobilePin: (control: MobilePin | null) => void; reference: Reference; onConfirmed: (note: Nota | null, operation: Operation, deletedId?: string) => void; onReturn: () => void; visible: boolean }) {
  const router = useRouter();
  const { revision, protect, ready } = useNotes();
  const [baseline, setBaseline] = useState<Nota | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailRetry, setDetailRetry] = useState(0);
  const [validation, setValidation] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [pending, setPending] = useState<Operation | null>(null);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState('');
  const [recoveries, setRecoveries] = useState<Envelope[]>([]);
  const [newIntent, setNewIntent] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [remote, setRemote] = useState(false);
  const draftRef = useRef(draft);
  const baselineRef = useRef(baseline);
  const pendingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const recoveriesRef = useRef(recoveries);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const cancelDelete = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);
  const detailGeneration = useRef(0);
  const adoptedId = useRef<string | null>(null);
  const activeReference = useRef('');
  const firstDetail = useRef(true);
  const contextHeading = useRef<HTMLHeadingElement>(null);
  const recoveryHeading = useRef<HTMLHeadingElement>(null);
  const conflictHeading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<HTMLElement | null>(null);
  const mobilePinAction = useRef<() => void>(() => {});
  const dirty = baseline ? !sameText(draft, baseline) : reference.kind === 'new' && (draft.titulo !== '' || draft.texto !== '' || draft.fijada);
  const dirtyRef = useRef(dirty);
  useLayoutEffect(() => { draftRef.current = draft; baselineRef.current = baseline; recoveriesRef.current = recoveries; dirtyRef.current = dirty; }, [draft, baseline, recoveries, dirty]);
  const protectedState = dirty || recoveries.length > 0 || pending !== null;
  useLayoutEffect(() => { protect(protectedState); return () => protect(false); }, [protectedState, protect]);
  useLayoutEffect(() => {
    const control = titleRef.current;
    if (control) { control.style.height = 'auto'; control.style.height = `${Math.max(48, control.scrollHeight + control.offsetHeight - control.clientHeight)}px`; }
  }, [draft.titulo, detailLoading, visible]);
  useEffect(() => { if (validation && validationAttempt) titleRef.current?.focus(); }, [validation, validationAttempt]);
  useEffect(() => { if (recoveries.length) recoveryHeading.current?.focus(); }, [recoveries.length]);
  useEffect(() => { if (conflict) conflictHeading.current?.focus(); }, [conflict]);
  useLayoutEffect(() => {
    if (!pending && pendingFocus.current) {
      const target = pendingFocus.current; pendingFocus.current = null;
      if (target.isConnected && (document.activeElement === document.body || document.activeElement === target)) target.focus({ preventScroll: true });
    }
  }, [pending]);
  const refKey = reference.kind === 'note' ? reference.id! : reference.kind;
  useEffect(() => {
    if (!ready) return;
    const changed = activeReference.current !== refKey;
    activeReference.current = refKey;
    const generation = ++detailGeneration.current;
    const controller = new AbortController();
    if (adoptedId.current === reference.id && reference.kind === 'note') { adoptedId.current = null; firstDetail.current = false; return; }
    queueMicrotask(() => {
    if (controller.signal.aborted) return;
    if (changed) {
      setBaseline(null); setDraft(blank()); setSaved(false); setFailure(''); setValidation(false); setMessage(''); setConflict(null); setRecoveries([]); setNewIntent(false); setRemote(false); setDetailError(''); firstDetail.current = true;
    }
    if (reference.kind !== 'note') { setDetailLoading(false); return; }
    if (firstDetail.current) setDetailLoading(true);
    const load = async () => {
      try {
        const { nota } = await api<{ nota: Nota }>(`/api/notas/${reference.id}`, { signal: controller.signal });
        if (!isNota(nota)) throw new Error('La respuesta de la nota no es válida. Vuelve a intentarlo.');
        if (generation !== detailGeneration.current) return;
        if (firstDetail.current || (!dirtyRef.current && !pendingRef.current && !recoveriesRef.current.length)) {
          setBaseline(nota); setDraft({ titulo: nota.titulo, texto: nota.texto, fijada: nota.fijada }); setDetailError(''); setRemote(false);
        } else if (baselineRef.current?.version !== nota.version) setRemote(true);
        firstDetail.current = false;
      } catch (e) {
        if (controller.signal.aborted || generation !== detailGeneration.current) return;
        setDetailError(e instanceof Error ? e.message : 'No se ha podido abrir la nota.');
        if (e instanceof ApiError && e.status === 404 && !dirtyRef.current && !recoveriesRef.current.length && !pendingRef.current) { setBaseline(null); setDraft(blank()); }
      } finally { if (!controller.signal.aborted && generation === detailGeneration.current) setDetailLoading(false); }
    };
    void load();
    });
    return () => controller.abort();
  }, [refKey, reference.id, reference.kind, ready, revision, detailRetry]);
  useEffect(() => { if (reference.kind === 'invalid' || (detailError && !baseline)) contextHeading.current?.focus(); }, [reference.kind, detailError, baseline]);

  function makeEnvelope(operation: Operation, current: Nota | null = baselineRef.current): Envelope {
    const key = crypto.randomUUID();
    const d = { ...draftRef.current };
    let path = '/api/notas';
    let body: Record<string, string | number | boolean> = { titulo: d.titulo, texto: d.texto, fijada: d.fijada, clave_idempotente: key };
    if (operation !== 'create' && current) {
      const route = { update: 'actualizar', pin: 'fijar', delete: 'eliminar' }[operation];
      path = `/api/notas/${current.id}/${route}`;
      body = { version: current.version, clave_idempotente: key, ...(operation === 'update' ? { titulo: d.titulo, texto: d.texto } : operation === 'pin' ? { fijada: !current.fijada } : {}) };
    }
    return Object.freeze({ key, path, body: Object.freeze(body), operation, draft: Object.freeze(d), previous: current, subject: current?.id || null });
  }
  async function send(envelope: Envelope) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    pendingFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPending(envelope.operation); setFailure(''); setSaved(false); setMessage('');
    ++detailGeneration.current;
    const selectionAtSend = activeReference.current;
    try {
      const result = await api<{ nota?: Nota; eliminada?: { id: string; version: number } }>(envelope.path, { method: 'POST', body: JSON.stringify(envelope.body) });
      if (envelope.operation === 'delete' ? !result.eliminada?.id || !UUID.test(result.eliminada.id) || !Number.isSafeInteger(result.eliminada.version) : !isNota(result.nota)) throw new Error('Respuesta sin confirmar.');
      if (!mounted.current || selectionAtSend !== activeReference.current) { onConfirmed(result.nota || null, envelope.operation, result.eliminada?.id); return; }
      setRecoveries(current => current.filter(e => e.key !== envelope.key)); setNewIntent(false); setConflict(null); setRemote(false);
      if (envelope.operation === 'delete') {
        setBaseline(null); setDraft(blank()); setDeleteOpen(false); setMessage('Nota eliminada');
        protect(false); onConfirmed(null, 'delete', result.eliminada!.id); router.replace('/notas');
        return;
      }
      const note = result.nota!;
      if (baselineRef.current?.id === note.id && baselineRef.current.version > note.version) {
        setMessage('Envío original recuperado. Se conserva la versión más reciente confirmada.');
        onConfirmed(baselineRef.current, 'update');
        return;
      }
      if (envelope.operation === 'create' && baselineRef.current && baselineRef.current.id !== note.id) {
        setMessage('Envío original recuperado. La nota está disponible en la lista.');
        onConfirmed(note, envelope.operation);
        return;
      }
      setBaseline(note);
      if (envelope.operation === 'pin') {
        setDraft(current => ({ ...current, fijada: note.fijada }));
        setMessage(note.fijada ? 'Nota fijada' : 'Nota desfijada');
      } else {
        const unchanged = sameText(draftRef.current, envelope.draft);
        setDraft(current => ({ ...(unchanged ? { titulo: note.titulo, texto: note.texto } : { titulo: current.titulo, texto: current.texto }), fijada: note.fijada }));
        setSaved(unchanged); setValidation(false);
      }
      if (envelope.operation === 'create') { adoptedId.current = note.id; router.replace(`/notas?nota=${note.id}`); }
      onConfirmed(note, envelope.operation);
    } catch (e) {
      if (!mounted.current || selectionAtSend !== activeReference.current) return;
      if (e instanceof ApiError && e.status < 500) {
        setRecoveries(current => current.filter(item => item.key !== envelope.key));
        if (e.status === 409 && e.data.actual) setConflict({ actual: e.data.actual, previous: envelope.previous, envelope });
        else {
          setFailure(e.message);
          if (e.data.error.fields?.titulo) { setValidation(true); setValidationAttempt(x => x+1); }
        }
      } else {
        setRecoveries(current => current.some(item => item.key === envelope.key) ? current : [...current, envelope]);
        setNewIntent(false); setMessage('Resultado sin confirmar');
      }
    } finally { pendingRef.current = false; setPending(null); }
  }
  function save() {
    if (pendingRef.current) return;
    if (!draftRef.current.titulo.trim()) { setValidation(true); setValidationAttempt(x => x + 1); return; }
    setValidation(false);
    if (recoveries.length && !newIntent) { setMessage('Elige cómo continuar con el envío sin confirmar.'); return; }
    if (conflict) return;
    void send(makeEnvelope(baselineRef.current ? 'update' : 'create'));
  }
  function change(field: 'titulo' | 'texto', value: string) {
    setDraft(current => ({ ...current, [field]: value })); setSaved(false); setFailure('');
  }
  function adoptCurrent() {
    if (!conflict) return;
    const n = conflict.actual;
    setBaseline(n); setDraft({ titulo: n.titulo, texto: n.texto, fijada: n.fijada }); setConflict(null); setFailure(''); setSaved(false); setRemote(false); setMessage('Versión actual cargada');
  }
  function overwrite() {
    if (!conflict) return;
    if (conflict.envelope.operation === 'update' && !draft.titulo.trim()) { setValidation(true); setValidationAttempt(x => x+1); return; }
    let envelope = makeEnvelope(conflict.envelope.operation, conflict.actual);
    // A pin conflict retries the explicitly requested state, even if another view already set it.
    if (envelope.operation === 'pin') envelope = Object.freeze({ ...envelope, body: Object.freeze({ ...envelope.body, fijada: conflict.envelope.body.fijada }) });
    void send(envelope);
  }
  useLayoutEffect(() => { mobilePinAction.current = () => { void send(makeEnvelope('pin')); }; });
  useEffect(() => {
    publishMobilePin(baseline ? {
      id: baseline.id, fijada: baseline.fijada,
      disabled: pending !== null || !!conflict || recoveries.length > 0,
      status: pending ? 'Actualizando nota…' : conflict ? 'Revisa el conflicto en la nota' : recoveries.length ? 'Resultado sin confirmar' : baseline.fijada ? 'Nota fijada' : 'Nota sin fijar',
      invoke: () => mobilePinAction.current(),
    } : null);
  }, [baseline, pending, conflict, recoveries.length, publishMobilePin]);
  const status = pending ? (pending === 'delete' ? 'Eliminando…' : pending === 'pin' ? 'Actualizando fijado…' : 'Guardando…') : recoveries.length ? 'Resultado sin confirmar' : conflict ? 'Conflicto de versiones' : dirty ? 'Cambios sin guardar' : saved ? 'Guardada' : baseline ? 'Sin cambios pendientes' : 'Borrador nuevo';
  const editable = reference.kind === 'new' || !!baseline;
  return <section className={`editor ${editable ? 'has-note' : ''}`} aria-label="Editor de notas"><div className="editor-context"><Button variant="ghost" className="mobile-back" onClick={onReturn}><ArrowLeft size={18} />Volver a la lista</Button><span className="desktop-context"><FileText size={17} />{reference.kind === 'new' ? 'Nueva nota' : baseline ? 'Nota abierta' : 'Tu espacio de escritura'}</span>{baseline?.fijada && <span className="pinned-label"><Pin size={14} />Fijada</span>}</div>
    {reference.kind === 'invalid' ? <div className="editor-placeholder error-placeholder"><AlertCircle size={32} /><h2 ref={contextHeading} tabIndex={-1}>Referencia no válida</h2><p>El enlace no identifica una nota. Vuelve a la lista para elegirla.</p><Link className="action secondary" href="/notas">Volver a la lista</Link></div> : reference.kind === 'none' ? <div className="editor-placeholder"><div className="empty-icon"><FileText size={36} strokeWidth={1.5} /></div><h2>Selecciona una nota</h2><p>Abre una nota de la lista para seguir escribiendo.<br />O deja espacio a una idea nueva.</p><Link href="/notas?nueva=1" className="action"><Plus size={18} />Nueva nota</Link></div> : detailLoading ? <div className="load-state" role="status"><RefreshCw size={24} />Abriendo nota…</div> : !editable && detailError ? <div className="editor-placeholder error-placeholder"><AlertCircle size={32} /><h2 ref={contextHeading} tabIndex={-1}>{detailError === 'Nota no disponible' ? 'Nota no disponible' : 'No se ha podido abrir la nota'}</h2><p>{detailError === 'Nota no disponible' ? 'Puedes volver a la lista y elegir otra nota.' : detailError}</p><div className="action-row"><Button variant="outline" onClick={() => setDetailRetry(x => x+1)}>Reintentar</Button><Link className="action secondary" href="/notas">Volver a la lista</Link></div></div> : editable && <>
      <form className="note-form" onSubmit={e => { e.preventDefault(); save(); }} noValidate><div className="editor-save-edge"><div className="editor-state"><span className="editor-subject"><FileText size={17} />{baseline ? 'Nota abierta' : 'Nueva nota'}{baseline?.fijada && <span className="pinned-label"><Pin size={14} /> Nota fijada</span>}</span><div className="save-status" role="status" aria-live="polite"><span>{saved && !dirty && !pending && !recoveries.length ? <Check size={18} /> : pending ? <RefreshCw size={18} /> : recoveries.length || conflict ? <AlertCircle size={18} /> : <span className="status-dot" />}{status}</span>{baseline && !dirty && !pending && <small><time dateTime={baseline.updated_at}>{formatDate(baseline.updated_at)}</time> · Versión {baseline.version}</small>}</div></div><Button type="submit" disabled={pending !== null || conflict !== null || (!!recoveries.length && !newIntent)} className="save-button"><Save size={17} />Guardar nota</Button></div>
      <div className="editor-fields">
        {validation && <div className="error-box validation-summary" role="alert"><AlertCircle size={20} /><div><p>No se pudo guardar la nota.</p><a href="#titulo" onClick={e => { e.preventDefault(); titleRef.current?.focus(); }}>Escribe un título para guardar la nota.</a></div></div>}
        {failure && <div className="error-box" role="alert"><AlertCircle size={20} /><div><p>{failure}</p><p>Tu borrador sigue aquí. Revisa los datos o vuelve a intentarlo.</p><Button variant="outline" onClick={() => { if (baseline) setDetailRetry(x => x+1); else setFailure(''); }}>Reintentar lectura</Button></div></div>}
        {detailError && baseline && <div className="error-box" role="alert"><AlertCircle size={20} /><div><p>{detailError}. Se conserva tu borrador.</p><Button variant="outline" onClick={() => setDetailRetry(x => x+1)}>Reintentar</Button></div></div>}
        {remote && !conflict && <p className="inline-notice"><InfoSymbol />Esta nota cambió en otra vista. Tu borrador se conserva; al guardar se comprobará la versión.</p>}
        {recoveries.length > 0 && <section className="recovery-box" aria-label="Recuperación de envíos"><h2 ref={recoveryHeading} tabIndex={-1}><AlertCircle size={20} />Resultado sin confirmar</h2><p>{recoveries.length === 1 ? recoveries[0].operation === 'delete' ? 'No sabemos si se eliminó la nota.' : recoveries[0].operation === 'pin' ? 'No sabemos si se cambió el fijado de la nota.' : 'No sabemos si se guardó la nota.' : 'Hay envíos pendientes de confirmar.'} Recupera el envío original para conocer el resultado. Tu borrador actual se conserva.</p>{recoveries.map((envelope, index) => <div key={envelope.key} className="recovery-item"><p>{envelope.operation === 'delete' ? 'Eliminación' : envelope.operation === 'pin' ? 'Cambio de fijado' : 'Guardado'} pendiente de confirmar{recoveries.length > 1 ? ` (${index + 1})` : ''}</p><details><summary>Ver el envío original</summary><dl>{envelope.operation === 'create' || envelope.operation === 'update' ? <><dt>Título enviado</dt><dd>{envelope.draft.titulo}</dd><dt>Texto enviado</dt><dd>{envelope.draft.texto || 'Sin texto'}</dd></> : <><dt>Nota</dt><dd>{envelope.previous?.titulo}</dd><dt>Acción solicitada</dt><dd>{envelope.operation === 'delete' ? 'Eliminar nota' : envelope.body.fijada ? 'Fijar nota' : 'Desfijar nota'}</dd></>}</dl></details><Button disabled={pending !== null} variant="outline" onClick={() => void send(envelope)}><RefreshCw size={16} />Recuperar envío</Button></div>)}{!newIntent ? <Button disabled={pending !== null} variant="outline" onClick={() => { setNewIntent(true); setMessage('Nuevo envío habilitado. La recuperación original sigue disponible.'); }}>Iniciar un envío distinto</Button> : <p>El próximo guardado será un envío distinto. Puedes recuperar los anteriores aquí.</p>}</section>}
        {conflict && <section className="conflict-box" role="alert"><h2 ref={conflictHeading} tabIndex={-1}><AlertCircle size={20} />Esta nota ha cambiado</h2><p>Otra vista guardó una versión más reciente. Revisa las diferencias antes de continuar.</p><div className="conflict-comparisons"><Comparison title="Tu borrador" note={draft} /><Comparison title="Última versión confirmada" note={conflict.previous} /><Comparison title="Versión actual" note={conflict.actual} /></div><div className="action-row"><Button disabled={pending !== null} variant="outline" onClick={adoptCurrent}>Usar versión actual</Button><Button disabled={pending !== null} onClick={overwrite}>{conflict.envelope.operation === 'delete' ? 'Eliminar la versión actual' : conflict.envelope.operation === 'pin' ? 'Aplicar mi cambio de fijado' : 'Sobrescribir con mi borrador'}</Button></div></section>}
        <div className="title-group"><label htmlFor="titulo">Título <span>Obligatorio</span></label><textarea ref={titleRef} id="titulo" name="titulo" rows={1} value={draft.titulo} onChange={e => change('titulo', e.target.value)} placeholder="Dale un título a tu idea" aria-invalid={validation || undefined} aria-describedby={validation ? 'titulo-error' : undefined} />{validation && <p id="titulo-error" className="field-error">Escribe un título para guardar la nota.</p>}</div>
        <div className="text-group"><label htmlFor="texto">Texto <span>Opcional</span></label><textarea id="texto" name="texto" value={draft.texto} onChange={e => change('texto', e.target.value)} placeholder="Empieza a escribir aquí…" /></div>

      </div></form>
      <div className="editor-secondary">{baseline ? <><Button variant="outline" disabled={pending !== null || !!conflict || recoveries.length > 0} onClick={() => void send(makeEnvelope('pin'))}>{baseline.fijada ? <PinOff size={18} /> : <Pin size={18} />}{baseline.fijada ? 'Desfijar' : 'Fijar'}</Button><Button ref={deleteTrigger} variant="ghost" className="delete-button" disabled={pending !== null || !!conflict || recoveries.length > 0} onClick={() => setDeleteOpen(true)}><Trash2 size={18} />Eliminar</Button></> : <label className="pin-new"><input type="checkbox" checked={draft.fijada} onChange={e => setDraft(current => ({ ...current, fijada: e.target.checked }))} /><Pin size={18} />Fijar al guardar</label>}<span className="secondary-hint">{baseline ? 'Sólo se guardan los cambios que confirmas.' : recoveries.some(envelope => envelope.operation === 'create') || pending === 'create' ? 'La creación está pendiente de confirmar.' : 'El borrador aún no cuenta como nota.'}</span></div><p className="editor-announcement" role="status">{message}</p>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="note-dialog" showCloseButton={false} initialFocus={cancelDelete} finalFocus={deleteTrigger} onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')].filter(n => n.getClientRects().length > 0);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }}><div className="dialog-icon"><Trash2 size={24} /></div><DialogTitle>¿Eliminar esta nota?</DialogTitle><DialogDescription>Vas a eliminar <strong className="dialog-note-title">«{baseline?.titulo}»</strong>. Esta acción no se puede deshacer.{dirty ? ' También se descartarán los cambios de este borrador.' : ''}</DialogDescription><div className="dialog-actions"><Button ref={cancelDelete} variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button className="confirm-delete bg-destructive text-white hover:bg-[#8e2a1d] active:bg-[#762318]" onClick={() => { setDeleteOpen(false); void send(makeEnvelope('delete')); }}>Eliminar nota</Button></div></DialogContent></Dialog>
    </>}
  </section>;
}
function InfoSymbol() { return <AlertCircle size={18} aria-hidden="true" />; }
function Comparison({ title, note }: { title: string; note: Draft | Nota | null }) {
  return <div><h3>{title}</h3>{note ? <><dl><dt>Título</dt><dd>{note.titulo}</dd><dt>Texto</dt><dd>{note.texto || 'Sin texto'}</dd><dt>Fijado</dt><dd>{note.fijada ? 'Fijada' : 'No fijada'}</dd>{'version' in note && <><dt>Versión</dt><dd>{note.version}</dd></>}</dl></> : <p>No había una nota guardada.</p>}</div>;
}
