import { useCallback, useEffect, useMemo, useState } from "react";
import type { ImageAnnotation } from "@annotorious/annotorious";

const STORAGE_PREFIX = "muybridge.annotations:";

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getStorageKey(infoUrl: string) {
  const trimmed = infoUrl.trim();
  return trimmed ? `${STORAGE_PREFIX}${encodeURIComponent(trimmed)}` : null;
}

function isValidAnnotation(candidate: unknown): candidate is ImageAnnotation {
  if (!candidate || typeof candidate !== "object") return false;
  const annotation = candidate as ImageAnnotation;
  if (!annotation.id || typeof annotation.id !== "string") return false;
  const target = annotation.target;
  if (!target || typeof target !== "object") return false;
  if (Array.isArray(target)) {
    return target.every((entry) => typeof entry === "object" && entry !== null);
  }
  const selector = (target as { selector?: unknown }).selector;
  if (!selector || typeof selector !== "object") return false;
  return true;
}

function readStoredAnnotations(key: string | null): ImageAnnotation[] {
  if (!key || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidAnnotation);
  } catch (error) {
    console.warn("[annotations] failed to parse localStorage", error);
    return [];
  }
}

function writeStoredAnnotations(key: string | null, annotations: ImageAnnotation[]) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(annotations));
  } catch (error) {
    console.warn("[annotations] failed to write localStorage", error);
  }
}

// ─── Manifest parsing ─────────────────────────────────────────────────────────

// Parses the temporal fragment "#t=0.000,1.000" from a canvas target string.
function parseStartTime(target: unknown): number {
  if (typeof target !== "string") return Infinity;
  const match = target.match(/#t=([0-9.]+)/);
  return match ? parseFloat(match[1]) : Infinity;
}

// Parses the pct region from a IIIF image body URL:
// "{imageService}/pct:{x},{y},{w},{h}/full/0/default.jpg" → {x,y,w,h} (0–100)
function parsePctRegionFromBodyUrl(
  url: string,
): { x: number; y: number; w: number; h: number } | null {
  const match = url.match(/\/pct:([0-9.]+),([0-9.]+),([0-9.]+),([0-9.]+)\//);
  if (!match) return null;
  const [x, y, w, h] = match.slice(1).map(Number);
  if ([x, y, w, h].some(Number.isNaN)) return null;
  return { x, y, w, h };
}

// Extracts ImageAnnotation[] and duration from the manifest's first (animation) canvas.
// Uses the static canvas (second item) to recover full image dimensions and the
// image service URL so annotations can be reconstructed with pixel coordinates.
function parseManifestFirstCanvas(
  manifest: Record<string, unknown>,
): [ImageAnnotation[], number | null] {
  const canvases = manifest.items;
  if (!Array.isArray(canvases) || canvases.length === 0) return [[], null];

  const firstCanvas = canvases[0] as Record<string, unknown>;
  if (firstCanvas.type !== "Canvas") return [[], null];

  const duration = typeof firstCanvas.duration === "number" ? firstCanvas.duration : null;

  // Pull full image dimensions from the static canvas (second item).
  let imageWidth = 0;
  let imageHeight = 0;
  if (canvases.length >= 2) {
    const staticCanvas = canvases[1] as Record<string, unknown>;
    if (typeof staticCanvas.width === "number") imageWidth = staticCanvas.width;
    if (typeof staticCanvas.height === "number") imageHeight = staticCanvas.height;
  }

  const canvasItems = firstCanvas.items;
  if (!Array.isArray(canvasItems) || canvasItems.length === 0) return [[], duration];

  const annotationPage = canvasItems[0] as Record<string, unknown>;
  if (annotationPage.type !== "AnnotationPage") return [[], duration];

  const frameAnnotations = annotationPage.items;
  if (!Array.isArray(frameAnnotations)) return [[], duration];

  // Restore frame order via temporal target sort.
  const sorted = [...frameAnnotations].sort((a, b) =>
    parseStartTime((a as Record<string, unknown>).target) -
    parseStartTime((b as Record<string, unknown>).target),
  );

  const hasDimensions = imageWidth > 0 && imageHeight > 0;

  const imageAnnotations: ImageAnnotation[] = sorted
    .map((item, index): ImageAnnotation | null => {
      const annotation = item as Record<string, unknown>;
      const body = annotation.body as Record<string, unknown> | undefined;
      const bodyId = typeof body?.id === "string" ? body.id : null;
      if (!bodyId) return null;

      const region = parsePctRegionFromBodyUrl(bodyId);
      if (!region) return null;

      const id =
        typeof annotation.id === "string" ? annotation.id : `frame-${index + 1}`;
      const { x, y, w, h } = region;

      if (hasDimensions) {
        // Reconstruct in Annotorious' internal RECTANGLE format so setAnnotations
        // renders the overlays without requiring a W3C adapter.
        const pixelX = Math.round((x / 100) * imageWidth);
        const pixelY = Math.round((y / 100) * imageHeight);
        const pixelW = Math.round((w / 100) * imageWidth);
        const pixelH = Math.round((h / 100) * imageHeight);
        return {
          id,
          bodies: [],
          target: {
            annotation: id,
            selector: {
              type: "RECTANGLE",
              geometry: {
                x: pixelX,
                y: pixelY,
                w: pixelW,
                h: pixelH,
                rot: 0,
                bounds: {
                  minX: pixelX,
                  minY: pixelY,
                  maxX: pixelX + pixelW,
                  maxY: pixelY + pixelH,
                },
              },
            },
          },
        } as unknown as ImageAnnotation;
      }

      // Fallback when static canvas dimensions are absent.
      return {
        id,
        bodies: [],
        target: {
          annotation: id,
          selector: {
            type: "FragmentSelector",
            value: `xywh=pct:${x},${y},${w},${h}`,
          },
        },
      } as unknown as ImageAnnotation;
    })
    .filter((a): a is ImageAnnotation => a !== null);

  return [imageAnnotations, duration];
}

// ─── Disk read ────────────────────────────────────────────────────────────────

type DiskReadResult =
  | { status: "found"; annotations: ImageAnnotation[]; duration: number | null; gifPath: string | null }
  | { status: "not_found" }
  | { status: "unavailable" };

function extractGifPath(manifest: Record<string, unknown>, slug: string): string | null {
  const thumbnail = manifest.thumbnail;
  if (!Array.isArray(thumbnail) || !thumbnail.length) return null;
  const first = thumbnail[0] as Record<string, unknown> | undefined;
  if (!first || typeof first.id !== "string") return null;
  return `/api/iiif/${slug}.gif`;
}

async function readManifestFromDisk(slug: string): Promise<DiskReadResult> {
  try {
    const response = await fetch(`/api/iiif/${slug}.json`);
    if (response.status === 404) return { status: "not_found" };
    if (!response.ok) return { status: "unavailable" };
    const data = await response.json();
    if (!data || typeof data !== "object") return { status: "unavailable" };
    const manifest = data as Record<string, unknown>;
    if (manifest.type !== "Manifest") return { status: "unavailable" };
    const [annotations, duration] = parseManifestFirstCanvas(manifest);
    const gifPath = extractGifPath(manifest, slug);
    return { status: "found", annotations, duration, gifPath };
  } catch {
    return { status: "unavailable" };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnnotationStore(infoUrl: string, slug: string | null) {
  const storageKey = useMemo(() => getStorageKey(infoUrl), [infoUrl]);
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>(() =>
    readStoredAnnotations(storageKey),
  );
  const [loadedDuration, setLoadedDuration] = useState<number | null>(null);
  const [loadedGifPath, setLoadedGifPath] = useState<string | null>(null);

  // Per slug: load localStorage immediately, then async manifest read (takes priority).
  useEffect(() => {
    setLoadedDuration(null);
    setLoadedGifPath(null);
    setAnnotations(readStoredAnnotations(storageKey));

    if (!slug) return;

    let cancelled = false;

    readManifestFromDisk(slug).then((result) => {
      if (cancelled) return;
      if (result.status === "found") {
        setAnnotations(result.annotations);
        writeStoredAnnotations(storageKey, result.annotations);
        setLoadedDuration(result.duration);
        setLoadedGifPath(result.gifPath);
      } else if (result.status === "unavailable") {
        console.warn("[annotations] manifest unavailable, using localStorage");
      }
      // not_found → manifest not saved yet, localStorage stands
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey, slug]);

  // Keep localStorage in sync as a backup on every change.
  useEffect(() => {
    writeStoredAnnotations(storageKey, annotations);
  }, [annotations, storageKey]);

  const addAnnotation = useCallback((annotation: ImageAnnotation) => {
    setAnnotations((previous) => {
      const index = previous.findIndex((item) => item.id === annotation.id);
      if (index !== -1) {
        const copy = [...previous];
        copy[index] = annotation;
        return copy;
      }
      return [...previous, annotation];
    });
  }, []);

  const removeAnnotation = useCallback((annotationId: string) => {
    setAnnotations((previous) =>
      previous.filter((annotation) => annotation.id !== annotationId),
    );
  }, []);

  const reorderAnnotations = useCallback((orderedAnnotationIds: string[]) => {
    setAnnotations((previous) => {
      const idSet = new Set(orderedAnnotationIds);
      const ordered = orderedAnnotationIds
        .map((id) => previous.find((annotation) => annotation.id === id))
        .filter((annotation): annotation is ImageAnnotation => Boolean(annotation));
      const remaining = previous.filter((annotation) => !idSet.has(annotation.id));
      return [...ordered, ...remaining];
    });
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    annotations,
    loadedDuration,
    loadedGifPath,
    addAnnotation,
    clearAnnotations,
    removeAnnotation,
    reorderAnnotations,
  } as const;
}
