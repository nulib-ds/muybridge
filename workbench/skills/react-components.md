# Skill: React Components

These conventions help new view modules look and behave consistently across the workbench. Follow them whenever you add a component under `src/`:

1. Default to function components written in TypeScript. Export a single named component per file and co-locate related hooks (e.g., `usePlateZoom.ts`) nearby.
2. Keep components pure and render-focused; push data fetching, IIIF parsing, and Annotorious wiring into `src/lib/` or dedicated hooks inside `src/app/` or `src/viewer/`.
3. Accept plain props objects with explicit interfaces. Required values go first, followed by optional configuration objects with sensible defaults.
4. Derive state from props whenever possible. When local state is needed, prefer `useReducer` for multi-field workflows (annotations, frame queues) so updates stay predictable.
5. Collapse reusable behaviors into hooks (`useViewportPan`, `useIiifInfo`) and colocate tests in `tests/` mirroring the source path.
6. Keep component trees shallow by extracting focused child components once JSX exceeds ~40 lines or mixes distinct responsibilities (e.g., toolbar vs. canvas overlays).
7. Annotate layout blocks with short comments explaining non-obvious structure (e.g., why a wrapper exists for OpenSeadragon sizing). Omit comments for straightforward markup.
8. Memoize derived values with `useMemo` / `useCallback` when they guard expensive work (GIF frame calculation, annotation transforms) or stabilize props passed into Annotorious.
9. Wire DOM refs carefully: `useRef` for persistent values, callback refs when OpenSeadragon or Annotorious expects immediate DOM access. Clean up listeners in `useEffect` return callbacks.
10. For conditional rendering, prefer early returns over deeply nested ternaries. When showing loading/error states, share skeleton or alert components so styling stays uniform.
11. Lean on Radix UI theme primitives from `@radix-ui/themes` (Stack, Flex, Text, Button, Accordion, Dialog, Tabs, TextField, TextArea, Radio Group/Cards, etc.) for structure whenever possible so the styled theme components handle spacing, focus, and accessibility rules without us reinventing low-level elements, and always scan the available theme components before introducing a new layout wrapper.
12. Keep side effects inside `useEffect` blocks with explicit dependency arrays. Guard IIIF requests and annotation event wiring so they only run after tile sources open.
13. Mirror prop names and casing between components, hooks, and tests. When a prop maps to a IIIF term, reuse that term exactly to minimize translation bugs.
14. Write basic interaction tests with React Testing Library whenever a component exposes callbacks (e.g., annotation `onChange`). For pure view helpers, cover rendering logic with snapshot-free, assertion-based tests.
15. Re-export frequently used components from `src/app/index.ts` or feature-specific barrels to keep import statements short yet explicit.

Document any necessary deviations inline so future contributors can reason about component structure quickly.
