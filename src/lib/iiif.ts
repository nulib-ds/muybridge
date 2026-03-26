/**
 * Normalizes user-provided IIIF endpoints to end with info.json.
 */
export function sanitizeIiifUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.endsWith('info.json')) {
    return trimmed;
  }

  return `${trimmed.replace(/\/$/, '')}/info.json`;
}
