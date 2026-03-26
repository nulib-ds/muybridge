# Muybridge Workbench

A Vite + React + TypeScript playground for loading IIIF Image API v2 endpoints, drawing Annotorious
rectangles over a vanilla OpenSeadragon viewer, and exporting the annotated panes as an animated GIF.

## Getting started

```bash
npm install
npm run dev
```

The dev server boots on [http://localhost:5173](http://localhost:5173). Paste any Image API v2
`info.json` URL into the header form to hydrate the viewer. By default the input points to the NGA
sample `https://api.nga.gov/iiif/b1317e06-3732-4ff7-921f-c3dbedb9ee84/info.json`, which stays public
and unblocked now that the viewer declares `isTiledImage`. Placeholder buttons in the sidebar create
mock frames until the Annotorious hooks are wired up.

## Available scripts

- `npm run dev` – Start Vite with HMR for the workbench.
- `npm run build` – Type-check and emit the production bundle.
- `npm run preview` – Serve the built bundle locally.
- `npm run lint` / `npm run lint:fix` – Run ESLint across the repo.
- `npm run test` / `npm run test:ci` – Execute Vitest in watch or CI mode.
- `npm run format` / `npm run format:write` – Validate or apply Prettier across `src/`.

## Directory layout

```
src/
├── app/            # Shell, layout, and form controls
├── annotations/    # Annotorious adapters and hooks
├── config/         # IIIF defaults, environment-driven settings
├── lib/            # Shared helpers (e.g., info.json sanitizers)
├── viewer/         # OpenSeadragon + Annotorious composition
└── workbench/      # Frame queue + GIF prep utilities
```

Keep sensitive configuration in `.env.local` as documented in `AGENTS.md`.
