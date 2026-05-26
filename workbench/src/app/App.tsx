import { Box, Flex, Text, TextField } from "@radix-ui/themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@annotorious/react/annotorious-react.css";
import { ViewerWorkbench } from "../viewer/components/ViewerWorkbench";
import { CANOPY_BASE_URL, DEFAULT_INFO_URL } from "../config/iiif";
import { sanitizeIiifUrl } from "../lib/iiif";
import { FramesSidebar } from "../workbench/frames/FramesSidebar";
import { useAnnotationStore } from "../workbench/frames/useFrameList";
import { useIiifDimensions } from "../lib/useIiifDimensions";
import { annotationToFrame, getAnnotationPixelBounds } from "../annotations/annotation-utils";
import type { FrameDescriptor } from "../workbench/frames/types";
import { PlateSelector } from "../workbench/plates/PlateSelector";
import { defaultPlate, findPlateByInfoUrl, plateCatalog } from "../workbench/plates/plateCatalog";
import type { PlateEntry } from "../workbench/plates/types";
import { buildManifestFromFrames } from "../workbench/frames/manifest";
import { useGifExport } from "../workbench/frames/useGifExport";
import {
  DEFAULT_FRAME_DURATION_SECONDS,
  defaultDurationForFrames,
} from "../workbench/frames/duration";

const INITIAL_INFO_URL = defaultPlate?.imageUri ?? DEFAULT_INFO_URL;
const GIF_EXPORT_ENDPOINT = "/api/export-gif";
const MANIFEST_EXPORT_ENDPOINT = "/api/iiif/manifest";
const AUTO_EXPORT_DEBOUNCE_MS = 1200;

function toDownloadName(label: string | undefined) {
  const fallback = label?.trim() || "muybridge-plate";
  return (
    fallback
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "muybridge-plate"
  );
}

async function persistGifToDisk(blob: Blob, slug: string) {
  const params = new URLSearchParams({ slug });
  const response = await fetch(`${GIF_EXPORT_ENDPOINT}?${params.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "image/gif" },
    body: blob,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => null);
    throw new Error(message || "Failed to write GIF to disk");
  }
  const payload = await response.json().catch(() => null);
  if (!payload || typeof payload.publicPath !== "string") {
    throw new Error("GIF saved but response was malformed");
  }
  return payload.publicPath as string;
}

function getFramesSignature(frames: FrameDescriptor[]): string | null {
  if (!frames.length) return null;
  return frames
    .map((frame) => {
      const { x, y, width, height } = frame.bounds;
      const key = frame.paneId || frame.id;
      return `${key}:${x.toFixed(4)},${y.toFixed(4)},${width.toFixed(4)},${height.toFixed(4)}`;
    })
    .join("|");
}

function App() {
  const [infoUrl, setInfoUrl] = useState(INITIAL_INFO_URL);
  const activePlate = useMemo(() => findPlateByInfoUrl(infoUrl), [infoUrl]);
  const activePlateProvider = useMemo(
    () =>
      activePlate?.metadata.find((entry) => entry.label.trim().toLowerCase() === "provider")
        ?.value,
    [activePlate],
  );
  const slug = useMemo(
    () => (activePlate ? toDownloadName(activePlate.label) : null),
    [activePlate],
  );
  const {
    annotations,
    loadedDuration,
    loadedGifPath,
    loadedAnimal,
    loadedMovement,
    addAnnotation,
    clearAnnotations,
    removeAnnotation,
    reorderAnnotations,
  } = useAnnotationStore(infoUrl, slug);
  const { dimensions } = useIiifDimensions(infoUrl);
  const [animationDuration, setAnimationDuration] = useState(DEFAULT_FRAME_DURATION_SECONDS);
  const [hasCustomDuration, setHasCustomDuration] = useState(false);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const { exportGif, isExporting: isEncodingGif, error: gifExportError } = useGifExport();
  const [latestManifestUrl, setLatestManifestUrl] = useState<string | null>(null);
  const [gifSaveError, setGifSaveError] = useState<string | null>(null);
  const [isSavingGif, setIsSavingGif] = useState(false);
  const [pendingGifSignature, setPendingGifSignature] = useState<string | null>(null);
  const [latestGifPath, setLatestGifPath] = useState<string | null>(null);
  const [animal, setAnimal] = useState("");
  const [movement, setMovement] = useState("");

  const frames = useMemo<FrameDescriptor[]>(() => {
    if (!dimensions) return [];
    return annotations.flatMap((annotation, index) => {
      const frame = annotationToFrame(annotation, dimensions);
      if (!frame) return [];
      return [
        {
          id: frame.id ?? annotation.id ?? `frame-${index + 1}`,
          paneId: frame.paneId ?? annotation.id ?? `pane-${index + 1}`,
          order: index + 1,
          bounds: frame.bounds,
        },
      ];
    });
  }, [annotations, dimensions]);
  const activePlateMetadata = useMemo(() => {
    if (!activePlate) {
      return [];
    }

    const metadata = [...activePlate.metadata];
    const providerIndex = metadata.findIndex(
      (entry) => entry.label.trim().toLowerCase() === "provider",
    );
    const framesEntry = { label: "Frames", value: String(frames.length) };

    if (providerIndex >= 0) {
      metadata.splice(providerIndex + 1, 0, framesEntry);
      return metadata;
    }

    return [...metadata, framesEntry];
  }, [activePlate, frames.length]);

  const highlightedAnnotationId = hoveredAnnotationId ?? selectedAnnotationId ?? null;
  const framesSignature = useMemo(() => getFramesSignature(frames), [frames]);
  const lastExportedSignatureRef = useRef<string | null>(framesSignature);
  const lastFrameCountRef = useRef(frames.length);
  const autoExportTimeoutRef = useRef<number | null>(null);
  const manifestSaveTimerRef = useRef<number | null>(null);

  // ─── Plate / frame / duration handlers ───────────────────────────────────

  const handlePlateSelect = (plate: PlateEntry) => {
    const nextUrl = sanitizeIiifUrl(plate.imageUri);
    setInfoUrl(nextUrl);
    setHoveredAnnotationId(null);
    setSelectedAnnotationId(null);
  };

  const handleFrameHover = useCallback((annotationId: string | null) => {
    setHoveredAnnotationId(annotationId);
  }, []);

  const handleFrameSelect = useCallback((annotationId: string) => {
    setSelectedAnnotationId((current) => (current === annotationId ? null : annotationId));
  }, []);

  const handleFrameDelete = useCallback(
    (annotationId: string) => {
      removeAnnotation(annotationId);
      setHoveredAnnotationId((current) => (current === annotationId ? null : current));
      setSelectedAnnotationId((current) => (current === annotationId ? null : current));
    },
    [removeAnnotation],
  );

  const handleFrameReorder = useCallback(
    (annotationIds: string[]) => {
      reorderAnnotations(annotationIds);
    },
    [reorderAnnotations],
  );

  const handleAnnotationSelect = useCallback((id: string | null) => {
    setSelectedAnnotationId(id);
  }, []);

  const handleDuplicateAndOffset = useCallback(
    (count: number, offsetPx: number) => {
      if (!selectedAnnotationId) return;
      const source = annotations.find((a) => a.id === selectedAnnotationId);
      if (!source) return;
      const pixelBounds = getAnnotationPixelBounds(source);
      if (!pixelBounds) return;
      const { x, y, width: w, height: h } = pixelBounds;
      for (let i = 0; i < count; i++) {
        const newX = x + (i + 1) * (w + offsetPx);
        const newId = crypto.randomUUID();
        const newAnnotation = {
          id: newId,
          bodies: [],
          target: {
            annotation: newId,
            selector: {
              type: "RECTANGLE",
              geometry: {
                x: newX,
                y,
                w,
                h,
                rot: 0,
                bounds: { minX: newX, minY: y, maxX: newX + w, maxY: y + h },
              },
            },
          },
        } as unknown as import("@annotorious/annotorious").ImageAnnotation;
        addAnnotation(newAnnotation);
      }
    },
    [selectedAnnotationId, annotations, addAnnotation],
  );

  // Apply loaded duration from persisted manifest when switching plates.
  useEffect(() => {
    if (loadedDuration !== null) {
      setAnimationDuration(loadedDuration);
      setHasCustomDuration(true);
    }
  }, [loadedDuration]);

  // Restore GIF preview from persisted manifest thumbnail on plate load.
  useEffect(() => {
    if (loadedGifPath !== null) {
      setLatestGifPath(`${loadedGifPath}?t=${Date.now()}`);
    } else {
      setLatestGifPath(null);
    }
  }, [loadedGifPath]);

  // Reset animal/movement on every plate switch, then populate from manifest if present.
  useEffect(() => {
    setAnimal("");
    setMovement("");
  }, [slug]);

  useEffect(() => {
    if (loadedAnimal !== null) setAnimal(loadedAnimal);
  }, [loadedAnimal]);

  useEffect(() => {
    if (loadedMovement !== null) setMovement(loadedMovement);
  }, [loadedMovement]);

  // Default duration tracks frame count unless the user has set a custom value
  // or a saved duration has been loaded.
  useEffect(() => {
    if (hasCustomDuration || loadedDuration !== null) return;
    const defaultDuration = defaultDurationForFrames(frames.length);
    setAnimationDuration((current) => (current === defaultDuration ? current : defaultDuration));
  }, [frames.length, hasCustomDuration, loadedDuration]);

  useEffect(() => {
    if (frames.length === 0 && hasCustomDuration) {
      setHasCustomDuration(false);
    }
  }, [frames.length, hasCustomDuration]);

  const handleDurationChange = useCallback((duration: number) => {
    setAnimationDuration(duration);
    setHasCustomDuration(true);
  }, []);

  // ─── Manifest save ────────────────────────────────────────────────────────

  const saveManifestToDisk = useCallback(async () => {
    if (!frames.length || !dimensions || !slug) return;

    const manifestUrl = `${CANOPY_BASE_URL}/iiif/${slug}.json`;
    const thumbnailUrl = `${CANOPY_BASE_URL}/images/thumbnails/${slug}.gif`;
    const plateNumber = activePlate?.metadata.find(
      (f) => f.label.trim().toLowerCase() === "plate number",
    )?.value;

    const manifest = buildManifestFromFrames({
      infoUrl,
      frames,
      dimensions,
      durationSeconds: animationDuration,
      label: activePlate?.label,
      manifestId: manifestUrl,
      thumbnailUrl,
      plateNumber,
      provider: activePlateProvider,
      animal: animal || undefined,
      movement: movement || undefined,
    });

    if (!manifest) return;

    try {
      const params = new URLSearchParams({ slug });
      const response = await fetch(`${MANIFEST_EXPORT_ENDPOINT}?${params}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest, null, 2),
      });
      if (!response.ok) {
        console.error("Failed to save manifest", await response.text().catch(() => null));
        return;
      }
      setLatestManifestUrl(manifestUrl);
    } catch (error) {
      console.error("Manifest save failed", error);
    }
  }, [frames, dimensions, slug, animationDuration, infoUrl, activePlate, activePlateProvider, animal, movement]);

  // Auto-save manifest whenever frames or duration change (debounced).
  useEffect(() => {
    if (!framesSignature || !dimensions || !slug) return;

    if (manifestSaveTimerRef.current !== null) {
      window.clearTimeout(manifestSaveTimerRef.current);
    }

    manifestSaveTimerRef.current = window.setTimeout(() => {
      manifestSaveTimerRef.current = null;
      saveManifestToDisk();
    }, AUTO_EXPORT_DEBOUNCE_MS);

    return () => {
      if (manifestSaveTimerRef.current !== null) {
        window.clearTimeout(manifestSaveTimerRef.current);
        manifestSaveTimerRef.current = null;
      }
    };
  }, [framesSignature, animationDuration, dimensions, slug, saveManifestToDisk]);

  const handleManifestExport = useCallback(() => {
    saveManifestToDisk();
  }, [saveManifestToDisk]);

  // ─── GIF export ───────────────────────────────────────────────────────────

  const exportGifToFile = useCallback(async () => {
    if (!dimensions || !frames.length) {
      throw new Error("Frames unavailable for GIF export");
    }
    const gifSlug = toDownloadName(activePlate?.label);
    setGifSaveError(null);
    let result: Awaited<ReturnType<typeof exportGif>>;
    try {
      result = await exportGif({ infoUrl, frames, dimensions, durationSeconds: animationDuration });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      console.error("GIF export failed", error);
      throw error instanceof Error ? error : new Error("Failed to encode GIF");
    }
    setIsSavingGif(true);
    try {
      const publicPath = await persistGifToDisk(result.blob, gifSlug);
      setLatestGifPath(`${publicPath}?t=${Date.now()}`);
      return getFramesSignature(frames);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      const message = error instanceof Error ? error.message : "Failed to write GIF to disk";
      setGifSaveError(message);
      console.error("GIF save failed", error);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setIsSavingGif(false);
    }
  }, [dimensions, frames, exportGif, infoUrl, animationDuration, activePlate]);

  const handleGifExport = useCallback(async () => {
    try {
      const signature = await exportGifToFile();
      if (signature) {
        lastExportedSignatureRef.current = signature;
        setPendingGifSignature((current) => (current === signature ? null : current));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }, [exportGifToFile]);

  useEffect(() => {
    if (!frames.length) {
      setPendingGifSignature(null);
      lastExportedSignatureRef.current = null;
      lastFrameCountRef.current = 0;
      return;
    }
    const previousCount = lastFrameCountRef.current;
    lastFrameCountRef.current = frames.length;
    if (
      frames.length > previousCount &&
      framesSignature &&
      framesSignature !== lastExportedSignatureRef.current
    ) {
      setPendingGifSignature(framesSignature);
    }
  }, [frames.length, framesSignature]);

  useEffect(() => {
    return () => {
      if (autoExportTimeoutRef.current !== null) {
        window.clearTimeout(autoExportTimeoutRef.current);
        autoExportTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingGifSignature || isEncodingGif || isSavingGif) return;
    autoExportTimeoutRef.current = window.setTimeout(async () => {
      autoExportTimeoutRef.current = null;
      try {
        const signature = await exportGifToFile();
        if (!signature) return;
        lastExportedSignatureRef.current = signature;
        setPendingGifSignature((current) => (current === signature ? null : current));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Automatic GIF export failed", error);
        setPendingGifSignature(null);
      }
    }, AUTO_EXPORT_DEBOUNCE_MS);
    return () => {
      if (autoExportTimeoutRef.current !== null) {
        window.clearTimeout(autoExportTimeoutRef.current);
        autoExportTimeoutRef.current = null;
      }
    };
  }, [pendingGifSignature, isEncodingGif, isSavingGif, exportGifToFile]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Flex direction={{ initial: "column", md: "row" }} height="100%">
      <Flex
        direction="column"
        flexGrow="1"
        style={{
          flexBasis: 0,
          height: "100vh",
          position: "relative",
          backgroundColor: "var(--gray-4)",
        }}
      >
        <ViewerWorkbench
          infoUrl={infoUrl}
          annotations={annotations}
          highlightedAnnotationId={highlightedAnnotationId}
          selectedAnnotationId={selectedAnnotationId}
          onAnnotationAdd={addAnnotation}
          onDuplicateAndOffset={handleDuplicateAndOffset}
          onAnnotationSelect={handleAnnotationSelect}
        />
        <Box
          style={{ width: "100%", position: "absolute", bottom: 0, zIndex: 1, pointerEvents: "none" }}
        >
          <Box p="5" style={{ background: "white", boxShadow: "var(--shadow-5)", pointerEvents: "auto" }}>
            <Flex direction="column" gap="4">
              <Flex direction={{ initial: "column", sm: "row" }} gap="3" align="start">
                <Flex direction="column" gap="1" flexGrow="1">
                  <PlateSelector
                    plates={plateCatalog}
                    selectedInfoUrl={infoUrl}
                    onSelect={handlePlateSelect}
                  />
                </Flex>
              </Flex>
              {activePlate ? (
                <Flex direction="column" gap="3">
                  {activePlateMetadata.length ? (
                    <Flex wrap="wrap" gap="4">
                      {activePlateMetadata.map((entry) => (
                        <Flex
                          key={`${entry.label}-${entry.value}`}
                          direction="column"
                          gap="1"
                          minWidth="140px"
                        >
                          <Text size="1" color="gray" weight="medium">
                            {entry.label}
                          </Text>
                          <Text>{entry.value}</Text>
                        </Flex>
                      ))}
                    </Flex>
                  ) : null}
                  <Flex wrap="wrap" gap="4">
                    <Flex direction="column" gap="1" style={{ minWidth: "160px" }}>
                      <Text as="label" size="1" color="gray" weight="medium" htmlFor="field-animal">
                        Animal
                      </Text>
                      <TextField.Root
                        id="field-animal"
                        value={animal}
                        onChange={(e) => setAnimal(e.target.value)}
                        placeholder="e.g. Human, Dog"
                      />
                    </Flex>
                    <Flex direction="column" gap="1" style={{ minWidth: "160px" }}>
                      <Text as="label" size="1" color="gray" weight="medium" htmlFor="field-movement">
                        Movement
                      </Text>
                      <TextField.Root
                        id="field-movement"
                        value={movement}
                        onChange={(e) => setMovement(e.target.value)}
                        placeholder="e.g. Walking, Jumping"
                      />
                    </Flex>
                  </Flex>
                </Flex>
              ) : null}
            </Flex>
          </Box>
        </Box>
      </Flex>
      <Box width={{ initial: "100%", md: "360px" }}>
        <FramesSidebar
          frames={frames}
          infoUrl={infoUrl}
          durationSeconds={animationDuration}
          onDurationChange={handleDurationChange}
          onExportManifest={handleManifestExport}
          canExportManifest={Boolean(dimensions && frames.length)}
          manifestUrl={latestManifestUrl}
          onExportGif={handleGifExport}
          canExportGif={Boolean(dimensions && frames.length)}
          isExportingGif={isEncodingGif || isSavingGif}
          gifError={gifExportError ?? gifSaveError}
          gifPreviewSrc={latestGifPath}
          onClear={clearAnnotations}
          onFrameHover={handleFrameHover}
          onFrameSelect={handleFrameSelect}
          onFrameDelete={handleFrameDelete}
          onFrameReorder={handleFrameReorder}
          hoveredAnnotationId={hoveredAnnotationId}
          selectedAnnotationId={selectedAnnotationId}
        />
      </Box>
    </Flex>
  );
}

export default App;
