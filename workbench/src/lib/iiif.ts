/**
 * Normalizes user-provided IIIF endpoints to end with info.json.
 */
export function sanitizeIiifUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.endsWith("info.json")) {
    return trimmed;
  }

  return `${trimmed.replace(/\/$/, "")}/info.json`;
}

const INFO_SUFFIX = "/info.json";

/**
 * Returns the IIIF image service endpoint derived from an info.json URL.
 */
export function getIiifImageServiceUrl(infoUrl: string): string | null {
  const trimmed = infoUrl.trim();
  if (!trimmed) {
    return null;
  }

  const withoutTrailingSlash = trimmed.replace(/\/$/, "");
  if (withoutTrailingSlash.endsWith(INFO_SUFFIX)) {
    const base = withoutTrailingSlash.slice(0, -INFO_SUFFIX.length);
    return base || null;
  }

  return withoutTrailingSlash || null;
}

/**
 * Returns a thumbnail endpoint derived from an info.json URL.
 */
export function getIiifThumbnailUrl(infoUrl: string, width = 240): string | null {
  const serviceUrl = getIiifImageServiceUrl(infoUrl);
  if (!serviceUrl) {
    return null;
  }

  const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 240;
  return `${serviceUrl}/full/${safeWidth},/0/default.jpg`;
}
