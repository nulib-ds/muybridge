import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@annotorious/react/annotorious-react.css";
import { ViewerWorkbench } from "../viewer/components/ViewerWorkbench";
import { DEFAULT_INFO_URL } from "../config/iiif";
import { sanitizeIiifUrl } from "../lib/iiif";
import { FramesSidebar } from "../workbench/frames/FramesSidebar";
import { useAnnotationStore } from "../workbench/frames/useFrameList";
import { useIiifDimensions } from "../lib/useIiifDimensions";
import { annotationToFrame } from "../annotations/annotation-utils";
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

function getPlateNumberValue(plate: PlateEntry | null) {
  if (!plate) {
    return null;
  }
  const entry = plate.metadata.find((field) => field.label.trim().toLowerCase() === "plate number");
  const digits = entry?.value?.match(/\d+/g)?.join("");
  return digits ?? null;
}

async function persistGifToDisk(blob: Blob, plateNumber: string) {
  const params = new URLSearchParams({ plateNumber });
  const response = await fetch(`${GIF_EXPORT_ENDPOINT}?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "image/gif",
    },
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
  if (!frames.length) {
    return null;
  }
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
  const { annotations, addAnnotation, clearAnnotations, removeAnnotation, reorderAnnotations } =
    useAnnotationStore(infoUrl);
  const { dimensions } = useIiifDimensions(infoUrl);
  const [animationDuration, setAnimationDuration] = useState(DEFAULT_FRAME_DURATION_SECONDS);
  const [hasCustomDuration, setHasCustomDuration] = useState(false);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const activePlate = useMemo(() => findPlateByInfoUrl(infoUrl), [infoUrl]);
  const { exportGif, isExporting: isEncodingGif, error: gifExportError } = useGifExport();
  const [gifSaveError, setGifSaveError] = useState<string | null>(null);
  const [isSavingGif, setIsSavingGif] = useState(false);
  const [pendingGifSignature, setPendingGifSignature] = useState<string | null>(null);
  const [latestGifPath, setLatestGifPath] = useState<string | null>(null);

  const frames = useMemo<FrameDescriptor[]>(() => {
    if (!dimensions) {
      return [];
    }

    return annotations.flatMap((annotation, index) => {
      const frame = annotationToFrame(annotation, dimensions);
      if (!frame) {
        return [];
      }

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

  const highlightedAnnotationId = hoveredAnnotationId ?? selectedAnnotationId ?? null;
  const framesSignature = useMemo(() => getFramesSignature(frames), [frames]);
  const lastExportedSignatureRef = useRef<string | null>(framesSignature);
  const lastFrameCountRef = useRef(frames.length);
  const autoExportTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (hasCustomDuration) {
      return;
    }
    const defaultDuration = defaultDurationForFrames(frames.length);
    setAnimationDuration((current) => (current === defaultDuration ? current : defaultDuration));
  }, [frames.length, hasCustomDuration]);

  useEffect(() => {
    if (frames.length === 0 && hasCustomDuration) {
      setHasCustomDuration(false);
    }
  }, [frames.length, hasCustomDuration]);

  const handleDurationChange = useCallback((duration: number) => {
    setAnimationDuration(duration);
    setHasCustomDuration(true);
  }, []);

  const handleManifestExport = () => {
    if (!dimensions || !frames.length) {
      return;
    }

    const manifest = buildManifestFromFrames({
      infoUrl,
      frames,
      dimensions,
      durationSeconds: animationDuration,
      label: activePlate?.label,
    });

    if (!manifest) {
      return;
    }

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = toDownloadName(activePlate?.label);
    anchor.href = url;
    anchor.download = `${slug}-animation-manifest.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportGifToFile = useCallback(async () => {
    if (!dimensions || !frames.length) {
      throw new Error("Frames unavailable for GIF export");
    }
    const plateNumber = getPlateNumberValue(activePlate);
    if (!plateNumber) {
      const message = "Missing plate number for the selected plate.";
      setGifSaveError(message);
      throw new Error(message);
    }
    setGifSaveError(null);
    let result: Awaited<ReturnType<typeof exportGif>>;
    try {
      result = await exportGif({
        infoUrl,
        frames,
        dimensions,
        durationSeconds: animationDuration,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      console.error("GIF export failed", error);
      throw error instanceof Error ? error : new Error("Failed to encode GIF");
    }
    setIsSavingGif(true);
    try {
      const publicPath = await persistGifToDisk(result.blob, plateNumber);
      const cacheBustingPath = `${publicPath}?t=${Date.now()}`;
      setLatestGifPath(cacheBustingPath);
      return getFramesSignature(frames);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
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
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      // Error surfaced via gifSaveError or console logging upstream.
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
    if (!pendingGifSignature || isEncodingGif || isSavingGif) {
      return;
    }
    autoExportTimeoutRef.current = window.setTimeout(async () => {
      autoExportTimeoutRef.current = null;
      try {
        const signature = await exportGifToFile();
        if (!signature) {
          return;
        }
        lastExportedSignatureRef.current = signature;
        setPendingGifSignature((current) => (current === signature ? null : current));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
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
          onAnnotationAdd={addAnnotation}
        />
        <Box
          style={{
            width: "100%",
            position: "absolute",
            bottom: 0,
            zIndex: 1,
          }}
        >
          <Box
            p="5"
            style={{
              background: "white",
              boxShadow: "var(--shadow-5)",
            }}
          >
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
                  {activePlate.metadata.length ? (
                    <Flex wrap="wrap" gap="4">
                      {activePlate.metadata.map((entry) => (
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
