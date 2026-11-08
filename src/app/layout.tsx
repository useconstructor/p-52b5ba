import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import localFont from 'next/font/local';
import branding from '../../branding.json';
import { NotesProvider } from '@/components/notes/provider';
import { Header, Footer } from '@/components/notes/shell';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const plex = localFont({ src: [{ path: '../../public/fonts/ibm-plex-sans-400.ttf', weight: '400' }, { path: '../../public/fonts/ibm-plex-sans-500.ttf', weight: '500' }, { path: '../../public/fonts/ibm-plex-sans-600.ttf', weight: '600' }], variable: '--font-plex-local', display: 'swap' });
export const metadata: Metadata = { title: 'Inicio | Notas de Bolsillo', description: 'App ficticia de Esteban para probar Constructor. Un escritorio personal para crear, editar, fijar y encontrar tus notas.', icons: { icon: '/icon.svg' } };
const originalFontUrls: Record<string, string> = {
  'https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD6llzAA.ttf': '/fonts/ibm-plex-sans-400.ttf',
  'https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSD2FlzAA.ttf': '/fonts/ibm-plex-sans-500.ttf',
  'https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSDNF5zAA.ttf': '/fonts/ibm-plex-sans-600.ttf',
  'https://fonts.gstatic.com/s/ibmplexsans/v23/zYXGKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1swZSAXcomDVmadSDDV5zAA.ttf': '/fonts/ibm-plex-sans-700.ttf',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tokens = { '--brand-background': branding.backgroundColor, '--brand-surface': branding.secondaryColor, '--brand-primary': branding.primaryColor, '--brand-accent': branding.accentColor, '--brand-text': branding.textColor, '--brand-font-heading': JSON.stringify(branding.fontHeading), '--brand-font-body': JSON.stringify(branding.fontBody), '--radius': branding.borderRadius } as CSSProperties;
  const fonts = branding.brandbook.fontFaces.map(f => `@font-face{font-family:${JSON.stringify(f.family)};font-style:normal;font-weight:${f.weight};font-display:swap;src:url(${JSON.stringify(originalFontUrls[f.url] || f.url)})}`).join('\n');
  const api = process.env.NEXT_PUBLIC_CONSTRUCTOR_API?.replace(/\/$/, '') || 'https://constructor-api-git-dev-useconstructor.vercel.app';
  const project = process.env.NEXT_PUBLIC_PROJECT_ID || 'P-52B5BA';
  return <html lang="es" className={plex.variable} style={tokens}><head><style>{fonts}</style></head><body><TooltipProvider><NotesProvider><Header />{children}<Footer /></NotesProvider></TooltipProvider><script src={"https://constructor-api-git-dev-useconstructor.vercel.app/v1/projects/P-52B5BA/analytics/script.js"} defer></script><script src="/constructor-editor.js" defer /></body></html>;
}
