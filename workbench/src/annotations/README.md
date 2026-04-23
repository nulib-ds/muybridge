# Annotations module

Wire Annotorious or custom tooling inside this directory. Suggested entry points:

- `annotorious-hooks.ts` – register OpenSeadragon events and emit rectangles.
- `annotation-store.ts` – normalize annotations before sending them to the frame queue.
- `gif-encoder-worker.ts` – optional web worker for client-side GIF assembly.
