# Skill: Styling

This workbench prefers utilitarian, document-like styling to keep focus on the IIIF imagery.
Follow these baseline rules when adding or editing UI:

1. Avoid decorative affordances. Do not use box shadows, borders (except unobtrusive focus outlines), or rounded corners.
2. Use flat color fills or subtle background steps (e.g., #fff / #f5f5f5) to separate sections instead of outlines.
3. Favor system fonts, medium weights, and compact spacing. Typography should feel like technical documentation, not marketing UI.
4. Preserve accessible focus states with solid outlines or underlines instead of colored glows or drop shadows.
5. Keep iconography minimal. Lean on text labels and structured layout before introducing new graphics.
6. If depth is required, use layout (stacking, white space) rather than gradients, shadows, or glossy effects.
7. Prefer grayscale or muted accent colors inspired by archival materials.
8. Author Sass partials for every sub-component and place them inside `src/styles/` (one file per piece) so the entire styling system lives in a single directory.
9. Use shared variables broadly throughout selectors (color tokens, spacing scales, typography sizes) but never duplicate variable names—centralize tokens once and reference them everywhere.
10. Skip variables for true one-off values; only promote a variable when the token will be reused.
11. Avoid arbitrary background fills; only introduce a background when it communicates state or hierarchy, and document the rationale inline.

Document any deviations inside component-level comments so future contributors understand why an exception exists.
