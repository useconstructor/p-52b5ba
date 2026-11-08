'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { ArrowUpRight, Info, Menu, Plus, X, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import branding from '../../../branding.json';
import { Button } from './controls';
import { useNotes } from './provider';

export function Brand() {
  return <Link href="/" className="brand-lockup"><Image unoptimized data-brand-logo src={branding.logoImageUrl || '/brand-mark.svg'} width={32} height={32} alt="" aria-hidden="true" /><span>{branding.logoText}</span></Link>;
}
export function Header() {
  const pathname = usePathname();
  const [menu, setMenu] = useState({ path: pathname, open: false });
  const open = menu.path === pathname && menu.open;
  const setOpen = (value: boolean) => setMenu({ path: pathname, open: value });
  const toggle = useRef<HTMLButtonElement>(null);
  return <><a href="#contenido" className="skip-link">Ir al contenido</a><header className="site-header" onKeyDown={event => { if (open && event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }}>
    <div className="header-inner"><Brand /><nav aria-label="Navegación principal" className="desktop-nav"><Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>Inicio</Link><Link href="/notas" aria-current={pathname === '/notas' ? 'page' : undefined}>Notas</Link></nav><Link className="action header-new" href="/notas?nueva=1"><Plus size={18} />Nueva nota</Link><Button ref={toggle} variant="ghost" className="mobile-menu-button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button></div>
    {open && <nav id="mobile-navigation" aria-label="Navegación móvil" className="mobile-navigation" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } }}><Link href="/" aria-current={pathname === '/' ? 'page' : undefined} onClick={() => setOpen(false)}>Inicio</Link><Link href="/notas" aria-current={pathname === '/notas' ? 'page' : undefined} onClick={() => setOpen(false)}>Notas</Link><Link href="/notas?nueva=1" onClick={() => setOpen(false)}><Plus size={18} /> Nueva nota</Link></nav>}
  </header><div className="project-notice"><div><Info size={16} aria-hidden="true" /><span>Ejemplo ficticio de Esteban para probar Constructor</span></div></div></>;
}
export function Footer() {
  return <footer className="site-footer"><div><span>{branding.logoText}</span><span className="footer-purpose">Un espacio propio para escribir.</span></div><Link href="/notas">Ir a mis notas <ArrowUpRight size={16} /></Link><span className="private-caption"><ShieldCheck size={16} /> Sin cuentas</span></footer>;
}
export function SessionState() {
  const { ready, loading, error, sessionError, retry, refresh } = useNotes();
  if (loading && !ready) return <div className="load-state" role="status"><RefreshCw size={24} /><p>Preparando tu sesión…</p></div>;
  if (!error) return null;
  return <div className="error-box session-state" role="alert"><AlertCircle size={24} /><div><h2>{sessionError ? 'No se puede mantener la sesión' : 'No se ha podido cargar el resumen'}</h2><p>{error}</p><div className="action-row"><Button variant="outline" onClick={() => sessionError ? retry() : refresh()}><RefreshCw size={16} />Reintentar</Button>{sessionError && <a className="action secondary" href="/" target="_blank" rel="noopener noreferrer">Abrir aplicación directamente <ArrowUpRight size={16} /></a>}</div>{sessionError && <details><summary>Recuperar el acceso</summary><p>Si las cookies están bloqueadas, permítelas y vuelve a intentarlo. La sesión al abrir directamente puede ser distinta de la sesión dentro de otra página.</p><p>Crear una sesión nueva abre un escritorio vacío. Las notas de la sesión anterior no se trasladan y podrías perder el acceso a ellas.</p><Button variant="outline" onClick={() => { if (window.confirm('¿Crear una sesión nueva y vacía? Las notas anteriores no se trasladan.')) retry(true); }}>Crear una sesión nueva</Button></details>}</div></div>;
}
