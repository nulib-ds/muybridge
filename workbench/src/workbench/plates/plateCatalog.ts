import { sanitizeIiifUrl, getIiifThumbnailUrl } from "../../lib/iiif";
import { parsePlateCsv } from "./plateParser";
import type { PlateEntry } from "./types";
import source from "../../../data/plates.csv?raw";

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

const parsed = parsePlateCsv(source);

export const plateCatalog: PlateEntry[] = parsed.map((entry, index) => {
  const imageUri = sanitizeIiifUrl(entry.imageUri);
  const id = `${slugify(entry.label, `plate-${index + 1}`)}-${index + 1}`;
  const thumbnailUrl = getIiifThumbnailUrl(imageUri, 240);
  return {
    ...entry,
    id,
    imageUri,
    thumbnailUrl,
  };
});

export const defaultPlate = plateCatalog[0] ?? null;

export function findPlateByInfoUrl(infoUrl: string): PlateEntry | null {
  const normalized = sanitizeIiifUrl(infoUrl);
  return plateCatalog.find((plate) => plate.imageUri === normalized) ?? null;
}
