# Converter OS UI Shell

A responsive App Router experience that showcases the Converter OS toolkit. The layout includes a persistent command bar, collapsible category sidebar, breadcrumbs, hero messaging, and dedicated workspaces for every converter family. Everything ships with Tailwind tokens that mirror the semantic palette used across the real product.

## Tech stack

- **Next.js 16** with the App Router living inside `src/app`
- **TypeScript** for type-safety
- **Tailwind CSS 3** with custom tokens for background, typography, states, and spacing
- **shadcn/ui primitives** for buttons, cards, dialogs, command palette, sheets, and breadcrumbs
- **next-themes** for light/dark mode toggling

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to interact with the UI shell.

## Structure

```
src/
  app/
    page.tsx          # Marketing hero + responsive tool grid
    tools/            # Tool index + dynamic routes per converter family
    docs/, roadmap/   # CTA destinations referenced in the shell
  components/
    layout/           # App shell + tool workspace layout
    ui/               # Reusable shadcn/ui primitives
  lib/
    navigation.ts     # Converter metadata + highlights
```

Each `/tools/[category]` route renders the shared `ToolLayout`, which already contains a readiness checklist, placeholder conversion workspace, and slots for future WASM-powered tools. The homepage and command palette are wired up to the same navigation data, so category cards, sidebar links, and quick search remain in sync.
