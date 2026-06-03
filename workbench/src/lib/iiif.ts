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
 * Returns true when the URL points to the Smithsonian IDS IIIF server.
 * These plates cannot use the tiled image service due to CORS restrictions.
 */
export function isSmithsonianInfoUrl(url: string): boolean {
  return url.includes("ids.si.edu");
}

/**
 * Returns a single-image URL for a Smithsonian plate at the given pixel width.
 * e.g. https://ids.si.edu/ids/iiif/NMAH-AHB2018q007304/info.json
 *   →  https://ids.si.edu/ids/iiif/NMAH-AHB2018q007304/full/1000,/0/default.jpg
 */
export function getSmithsonianSingleImageUrl(infoUrl: string, width = 1000): string {
  const service = getIiifImageServiceUrl(infoUrl);
  return `${service}/full/${width},/0/default.jpg`;
}

/**
 * Rewrites a Smithsonian IDS IIIF URL to go through the local Vite dev proxy,
 * making it same-origin so OSD's WebGL renderer can use the image pixels.
 * The published manifest still uses the real ids.si.edu URLs.
 */
export function toSmithsonianProxyUrl(url: string): string {
  return url.replace("https://ids.si.edu/ids/iiif", "/iiif-si-proxy");
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
