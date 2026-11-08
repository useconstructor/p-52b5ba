'use client';
import Link from 'next/link';
import { ArrowRight, Clock3, FileText, Pin, Plus, LockKeyhole } from 'lucide-react';
import { useEffect } from 'react';
import { useNotes } from './provider';
import { SessionState } from './shell';
import { formatDate, type Nota } from '@/lib/notes/client';

function SummaryNotes({ notes, title, pinned }: { notes: Nota[]; title: string; pinned?: boolean }) {
  return <section className={pinned ? 'summary-notes pinned-notes' : 'summary-notes recent-notes'}><div className="section-edge"><h2>{pinned ? <Pin size={20} /> : <Clock3 size={20} />}{title}</h2><Link href="/notas">Ver todas <ArrowRight size={16} /></Link></div><div>{notes.map(note => <Link className="home-note" key={note.id} href={`/notas?nota=${note.id}`}><div><h3>{note.titulo}</h3><ArrowRight size={18} aria-hidden="true" /></div>{note.texto && <p>{note.texto}</p>}<time dateTime={note.updated_at}>{formatDate(note.updated_at)}</time></Link>)}</div></section>;
}
export function Home() {
  const { summary, ready, loading, error, refresh } = useNotes();
  useEffect(() => { refresh(); }, [refresh]);
  return <main id="contenido" tabIndex={-1} className="home-main">
    <div className="workspace-heading"><div><p className="context-label">Tu escritorio personal</p><h1>Inicio</h1></div><Link href="/notas?nueva=1" className="action"><Plus size={18} />Nueva nota</Link></div>
    <p className="home-intro">Un lugar para tus ideas. Retoma una nota o empieza algo nuevo.</p>
    <SessionState />
    {ready && summary && <><section aria-label="Resumen de tus notas" className="summary-strip" aria-busy={loading}><div><FileText size={22} /><span>Total de notas</span><strong>{summary.total}</strong></div><div><Pin size={22} /><span>Notas fijadas</span><strong>{summary.totalFijadas}</strong></div><span className="summary-caption">{loading ? 'Actualizando resumen…' : error ? 'Último resumen confirmado' : 'Tu escritorio, al día'}</span></section>
      {summary.total === 0 ? <section className="empty-desk"><div className="empty-icon"><FileText size={36} strokeWidth={1.5} /></div><h2>Todavía no tienes notas</h2><p>Una idea, una lista, algo que no quieres olvidar.<br className="desktop-break" /> Crea tu primera nota y continúa cuando vuelvas.</p><Link href="/notas?nueva=1" className="action"><Plus size={18} />Crear mi primera nota</Link><Link className="quiet-link" href="/notas">Ver todas las notas <ArrowRight size={16} /></Link></section> : <div className={`home-notes-grid ${!summary.fijadas.length || !summary.recientes.length ? 'single-region' : ''}`}>{summary.fijadas.length > 0 && <SummaryNotes notes={summary.fijadas} title="Notas fijadas" pinned />}{summary.recientes.length > 0 && <SummaryNotes notes={summary.recientes} title="Notas recientes" />}</div>}
      <aside className="desk-help"><LockKeyhole size={20} /><div><h2>Tu espacio, sin cuentas</h2><p>Crea, edita y guarda tus notas. Fija lo importante para tenerlo a mano y busca cuando lo necesites.</p></div><Link href="/notas">Abrir mis notas <ArrowRight size={16} /></Link></aside>
    </>}
  </main>;
}
