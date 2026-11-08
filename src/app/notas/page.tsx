import { Suspense } from 'react';
import { Workspace } from '@/components/notes/workspace';
export const metadata = { title: 'Notas | Notas de Bolsillo' };
export default function Page() { return <Suspense fallback={<main className="load-state">Cargando notas…</main>}><Workspace /></Suspense>; }
