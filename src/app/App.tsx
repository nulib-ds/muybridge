import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { useCallback, useMemo, useState } from "react";
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

const INITIAL_INFO_URL = defaultPlate?.imageUri ?? DEFAULT_INFO_URL;

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

function App() {
  const [infoUrl, setInfoUrl] = useState(INITIAL_INFO_URL);
  const { annotations, addAnnotation, clearAnnotations } = useAnnotationStore(infoUrl);
  const { dimensions } = useIiifDimensions(infoUrl);
  const [animationDuration, setAnimationDuration] = useState(2);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const activePlate = useMemo(() => findPlateByInfoUrl(infoUrl), [infoUrl]);
  const { exportGif, isExporting: isExportingGif, error: gifExportError } = useGifExport();

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

  const handleGifExport = useCallback(async () => {
    if (!dimensions || !frames.length) {
      return;
    }
    try {
      const result = await exportGif({
        infoUrl,
        frames,
        dimensions,
        durationSeconds: animationDuration,
      });
      const slug = toDownloadName(activePlate?.label);
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slug}-animation.gif`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("GIF export failed", error);
    }
  }, [dimensions, frames, exportGif, infoUrl, animationDuration, activePlate?.label]);

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
            height: "15rem",
            position: "absolute",
            bottom: 0,
            left: 0,
            backgroundColor: "var(--gray-a3)",
            backdropFilter: "blur(6px)", // Standard
            WebkitBackdropFilter: "blur(6px)", // Safari Support (Note the capital W)
            maskImage: "linear-gradient(to bottom, transparent, black 10rem)", // Fade out effect at the top
          }}
        />
        <Box
          style={{
            width: "100%",
            height: "5rem",
            position: "absolute",
            bottom: 0,
            left: 0,
            backgroundColor: "var(--gray-a5)",
            backdropFilter: "blur(10px)", // Standard
            WebkitBackdropFilter: "blur(10px)", // Safari Support (Note the capital W)
            maskImage: "linear-gradient(to bottom, transparent, black 3rem)", // Fade out effect at the top
          }}
        />
        <Box
          style={{
            width: "100%",
            position: "absolute",
            bottom: 0,
            left: 0,
          }}
          p="5"
        >
          <Card variant="surface" size="3">
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
          </Card>
        </Box>
      </Flex>
      <Box width={{ initial: "100%", md: "360px" }}>
        <FramesSidebar
          frames={frames}
          infoUrl={infoUrl}
          durationSeconds={animationDuration}
          onDurationChange={setAnimationDuration}
          onExportManifest={handleManifestExport}
          canExportManifest={Boolean(dimensions && frames.length)}
          onExportGif={handleGifExport}
          canExportGif={Boolean(dimensions && frames.length)}
          isExportingGif={isExportingGif}
          gifError={gifExportError}
          onClear={clearAnnotations}
          onFrameHover={handleFrameHover}
          onFrameSelect={handleFrameSelect}
          hoveredAnnotationId={hoveredAnnotationId}
          selectedAnnotationId={selectedAnnotationId}
        />
      </Box>
    </Flex>
  );
}

export default App;
