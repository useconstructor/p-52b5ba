# BuildBloock Template

Starter template de Next.js con Tailwind CSS v4 y shadcn/ui. Listo para producción con dark/light mode, 37 componentes instalados y una página de demo funcional.

## Stack

- **Next.js 16** — App Router, React 19, TypeScript
- **Tailwind CSS v4** — con PostCSS
- **shadcn/ui** — sobre BaseUI (`@base-ui/react`)
- **next-themes** — dark/light/system mode sin flash
- **Recharts** — charts con colores oklch

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Componentes instalados

| Categoría | Componentes |
|---|---|
| Layout | `card` `separator` `scroll-area` `sheet` |
| Navegación | `breadcrumb` `navigation-menu` `pagination` `tabs` `command` |
| Formularios | `button` `checkbox` `input` `input-group` `label` `radio-group` `select` `slider` `switch` `textarea` |
| Feedback | `alert` `alert-dialog` `badge` `progress` `skeleton` `sonner` |
| Overlays | `dialog` `drawer` `dropdown-menu` `hover-card` `popover` `tooltip` |
| Datos | `accordion` `avatar` `calendar` `chart` `collapsible` `table` |

## Agregar componentes

```bash
npx shadcn add [nombre]
```

## Estructura

```
src/
├── app/
│   ├── globals.css          # Variables CSS y colores del tema
│   ├── layout.tsx           # ThemeProvider + TooltipProvider + Toaster
│   └── page.tsx             # Página de demo con todos los componentes
├── components/
│   ├── demo/                # Secciones de demo (buttons, forms, overlays…)
│   ├── theme-provider.tsx   # Wrapper de next-themes
│   ├── theme-toggle.tsx     # Switch Sun/Moon
│   └── ui/                  # Componentes shadcn/ui
└── lib/
    └── utils.ts             # cn() helper
```

## Personalización de colores

Edita las variables en `src/app/globals.css`. Los colores de charts usan formato oklch:

```css
:root {
  --chart-1: oklch(0.6 0.22 240);  /* azul */
  --chart-2: oklch(0.65 0.18 160); /* verde */
  --chart-3: oklch(0.72 0.19 55);  /* naranja */
  --chart-4: oklch(0.58 0.22 295); /* púrpura */
  --chart-5: oklch(0.65 0.22 15);  /* rosa */
}
```

En los `chartConfig` de tus componentes usa siempre `var(--color-chart-N)` (no `hsl(...)`).

## Notas para el agente (Claude)

Ver `CLAUDE.md` — los archivos temporales y screenshots van en `/tmp-tests/` que está en `.gitignore`.
# template
