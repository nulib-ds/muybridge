# Repository Guidelines

## Project Structure & Module Organization
This Vite + React workbench renders IIIF Image API v2 resources and records annotations for Muybridge plates. Keep sources in `src/`: viewer wiring (`src/app/`), OpenSeadragon + Annotorious composition (`src/viewer/`), Annotorious helpers (`src/annotations/`), and GIF assembly helpers (`src/workbench/frames/`). Shared parsing utilities live in `src/lib/`. Tests mirror this hierarchy under `tests/`. Cross-functional “skills” live under `skills/` (e.g., `skills/styling.md`) so collaborators can see workflow expectations at a glance.

## Build, Test, and Development Commands
`npm install` / `npm ci` sync dependencies (Annotorious, OpenSeadragon bindings, gif encoder). `npm run dev` starts Vite at `http://localhost:5173`. `npm run build` produces the optimized bundle in `dist/`; verify with `npm run preview`. `npm test` (or `npm run test:ci`) runs Vitest suites. `npm run lint` and `npm run format` apply ESLint + Prettier rules; both must pass before commits.
`npm run generate:plates` ingests `data/nga_data.csv`, normalizes each `title` + `image_iiifurl` into IIIF `info.json` endpoints, and emits a sorted `data/plates.csv` with derived `Plate Number` and NGA `Object ID` metadata so the workbench always mirrors the upstream catalog. Update `data/nga_data.csv` before running the generator.

## Coding Style & Naming Conventions
TypeScript strict mode, 2-space indentation, and trailing commas are mandatory. Components/hooks use PascalCase (`PlateViewer`) or camelCase (`useGifFrames`); utility files use kebab-case. Keep one exported component per file and prefer named exports. Name Annotorious overlays `<target>.overlay.ts`. IIIF endpoints live in `src/config/iiif.ts`; never commit `.env*`, `dist/`, or generated GIFs.

## Testing Guidelines
Vitest with React Testing Library exercises UI, while pure utilities get unit coverage. Name specs `<module>.spec.ts` and colocate inside `tests/` mirroring the source path. Fixtures from `assets/info-json/` pin IIIF inputs. Add integration tests for every new annotation workflow to ensure rectangle events update the frame list and GIF encoder. Maintain ≥80% coverage for `src/annotations/` and `src/workbench/frames/` because they control exported sequences.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat(annotations): snap panes`, `fix(workbench): guard empty lists`). Scope each PR to a single workflow, summarize manual verification (IIIF URL used, tools run), and attach screenshots or short clips when UI or GIF output changes. Reference issues with `Closes #123`. Before review run `npm run lint`, `npm test`, `npm run build`, and spot-check GIF playback via `npm run preview`.

## IIIF & Annotation Workflow Tips
Validate every `info.json` against Image API v2 before relying on it in the workbench. Annotorious boots once OpenSeadragon emits the `open` event; ensure tileSources resolve or the annotator will not mount. When rectangles finish, push `{ paneId, bounds, order }` entries into the frame list, then debounce GIF regeneration so dragging stays responsive. Keep a short list of trusted IIIF endpoints in repo docs (or the README) for quick regression testing.
