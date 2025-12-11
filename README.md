# Browser Conversion Suite

A privacy-first recreation of the core experience on [online-convert.com](https://www.online-convert.com/). Every tool in this project runs entirely in the browser—no uploads, no servers, and no waiting for remote jobs to finish.

## Highlights

- ⚡️ **Instant processing** – Canvas, Web Audio, JSZip, and pdf-lib power all transformations locally.
- 🖼️ **Image Studio** – Convert formats (PNG, JPG, WEBP) with quality controls or resize assets with locked or freeform ratios.
- 📄 **Document Lab** – Turn text or Markdown into vector PDFs with custom titles and authors.
- 🎧 **Audio Lab** – Transcode WAV ↔ MP3 with adjustable bitrate, powered by the LAME encoder compiled to JavaScript.
- 📦 **Archive Orchestrator** – Compress arbitrary files or inspect ZIP archives without ever leaving the tab.
- ✅ **Modern UI/UX** – A polished, responsive interface inspired by the original site, with quick actions, search, status indicators, and helpful guidance for every workflow.

## Getting started

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:5173](http://localhost:5173). All conversions already work in development—there are no additional services or credentials to configure.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for lightning-fast DX
- [pdf-lib](https://pdf-lib.js.org/) for text/Markdown → PDF rendering
- [JSZip](https://stuk.github.io/jszip/) for archive creation/extraction
- [lamejs](https://github.com/zhuker/lamejs) + Web Audio API for MP3/WAV transcoding

## Project structure

```
src/
├─ components/
│  ├─ ToolSidebar.tsx         # Navigation, search, and category grouping
│  ├─ ToolWorkspace.tsx       # Renders the active tool + guidance panels
│  └─ tools/                  # Individual client-side tools
├─ data/toolRegistry.tsx      # Tool metadata and registry
├─ utils/                     # Shared helpers (file + image utilities)
└─ App.tsx                    # App shell, hero, and layout composition
```

## Accessibility & privacy considerations

- Every action surfaces status indicators (“Idle”, “Processing”, “Ready”) with eye-catching chips so users always understand what is happening.
- Drag-and-drop areas accompany traditional file inputs for keyboard accessibility.
- All object URLs are revoked to avoid leaking blob references between conversions.
- Because everything is offline-first, no files leave the user’s browser—ideal for sensitive work.

## Extending the suite

The registry pattern in `src/data/toolRegistry.tsx` makes it straightforward to add more tools:

1. Create a component under `src/components/tools`.
2. Import it into the registry and describe its metadata (category, highlights, and workflow steps).
3. The tool automatically appears in the sidebar, search results, hero quick actions, and recommendation chips.

Feel free to iterate on the styling in `App.css` and `index.css` to further match branding needs.
