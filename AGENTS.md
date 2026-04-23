# Muybridge in Motion — Repository Guide

This repository has two distinct but tightly coupled parts: a **Canopy IIIF exhibit** at the root and a **workbench application** under `workbench/`. They share a single git history and a unified purpose — publishing Eadweard Muybridge's *Animal Locomotion* (781 plates) as an annotated, animated digital collection.

---

## Repository Layout

```
muybridge/
├── app/            Canopy: Tailwind entrypoint, build scripts, custom MDX components
├── assets/         Canopy: static files copied verbatim into site/
├── content/        Canopy: MDX pages, layouts, navigation, and exhibit copy
├── canopy.yml      Canopy: primary configuration (collection URI, metadata, theme)
├── package.json    Canopy: dependencies and build scripts
├── site/           Canopy: generated output — never edit by hand
├── .cache/iiif/    Canopy: fetched manifest cache — delete to force refetch
└── workbench/      Workbench: Vite + React annotation and GIF export tool
    ├── src/
    ├── public/iiif/    ← manifests and GIFs exported by the workbench
    ├── data/           ← NGA plate catalog (CSV)
    └── ...
```

---

## The Workflow

The two halves of this repository form a production pipeline:

1. **Workbench → annotation** — Load an NGA plate's IIIF Image API endpoint in the workbench, draw rectangles over individual frames using Annotorious, and order them in the frame queue.
2. **Workbench → export** — Export the frame sequence as an animated GIF and a IIIF Presentation 3 manifest. Both land in `workbench/public/iiif/`.
3. **Workbench → publish** — Commit or deploy the contents of `workbench/public/iiif/` so manifests are reachable at a stable public URL.
4. **Canopy → ingest** — Add the manifest URL to `canopy.yml` (`collection` or `manifest`) or reference it in an MDX page. On the next `npm run build` (run from the repo root), Canopy fetches and caches it, generates a work page, and folds it into the exhibit index and search.
5. **Canopy → exhibit** — The finished `site/` is deployed as a static site. Visitors browse the collection, view animated plates, and read editorial content authored in `content/`.

The animated GIF is embedded directly in the IIIF manifest as a canvas resource; Canopy's Clover viewer renders it. No custom Canopy components are required for basic playback.

---

## Canopy (root)

### Purpose
The public-facing exhibit and collection browser for all 781 Muybridge plates. Built with the [Canopy IIIF](https://canopy-iiif.github.io/app/) static site generator (Next.js-based, MDX authoring, IIIF-first).

### Commands (run from repo root)
| Command | Effect |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Watch + rebuild; preview server on port 5001 |
| `npm run build` | Production build into `site/` |

`npm run dev` and `npm run build` both require network access to resolve IIIF endpoints.

### Key Configuration
- **`canopy.yml`** — `collection`, `manifest`, `metadata` facets, `featured` hero manifests, `theme`, and `search` behavior. This is the primary control surface.
- **`content/`** — MDX pages for editorial sections (About, essays, work narratives). `content/_app.mdx` is the global wrapper; `content/works/_layout.mdx` receives `props.manifest` for work pages.
- **`app/components/mdx.tsx`** — Register custom SSR-safe or client-side MDX components here.
- **`.cache/iiif/`** — Delete this directory to force Canopy to re-fetch all manifests on the next build. Always required after updating manifest URLs.

### Adding a Workbench-produced Manifest to the Exhibit
Add the public manifest URL to `canopy.yml` under `collection` or `manifest`, then run `npm run build`. If the manifest is a new animated plate, also consider adding it to `featured` in `canopy.yml` so it appears in the hero carousel.

---

## Workbench (`workbench/`)

### Purpose
An interactive tool for annotating Muybridge plates and assembling animated GIFs. Consumes IIIF Image API v2 endpoints from the NGA catalog, lets the user draw frame boundaries with Annotorious, and exports both a GIF and a IIIF Presentation 3 manifest.

### Commands (run from `workbench/`)
| Command | Effect |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server at `http://localhost:5173` |
| `npm run build` | Production bundle into `workbench/dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest suites |
| `npm run lint` / `npm run format` | ESLint + Prettier |
| `npm run generate:plates` | Ingest `data/nga_data.csv` → `data/plates.csv` + `public/plates/chunks/*.json` |

### Key Paths
- `src/workbench/frames/` — GIF assembly, IIIF manifest builder, frame queue state.
- `src/workbench/plates/` — NGA plate catalog loader (chunked JSON, 60 plates per chunk).
- `src/viewer/` — OpenSeadragon + Annotorious composition.
- `src/annotations/` — Annotorious rectangle-to-frame-descriptor conversion utilities.
- `public/iiif/` — **Output directory.** Exported `.json` manifests and `.gif` animations land here. These are the artifacts Canopy consumes.
- `data/nga_data.csv` — Source of truth for all 781 plates. Run `generate:plates` after updating it.

### Export Artifacts
Every completed annotation session produces two files in `workbench/public/iiif/`:
- `plate-number-<N>-<slug>.json` — IIIF Presentation 3 manifest with the animated GIF as its primary canvas resource.
- `plate-number-<N>-<slug>.gif` — The exported animation.

Slug format: `plate-number-{plate-number}-{lowercase-title-with-hyphens}`.

### Coding Conventions
- TypeScript strict mode, 2-space indentation, trailing commas.
- Components use PascalCase; hooks use camelCase with `use` prefix; utility files use kebab-case.
- One exported component per file; prefer named exports.
- Tests mirror source paths under `tests/` with `.spec.ts` / `.spec.tsx` naming.
- Maintain ≥ 80 % coverage for `src/annotations/` and `src/workbench/frames/`.

---

## Cross-Project Conventions

- **Never edit `site/`** — it is overwritten on every Canopy build.
- **Never commit `workbench/dist/`** — it is a local build artifact.
- **Manifests are the handoff point.** The workbench writes JSON; Canopy reads JSON. Keep manifest URLs stable once published.
- **IIIF cache invalidation** — after updating or replacing a manifest, delete `.cache/iiif/` and rebuild Canopy to pick up changes.
- **Conventional Commits** — scope to `canopy`, `workbench`, or `data` as appropriate (e.g., `feat(workbench): add duration slider`, `content(canopy): add plate 626 essay`).
