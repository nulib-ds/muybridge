import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type OpenSeadragon from "openseadragon";
import {
  Annotorious,
  OpenSeadragonAnnotator,
  OpenSeadragonViewer,
  useViewer,
  type AnnotoriousOpenSeadragonAnnotator,
} from "@annotorious/react";
import type { ImageAnnotation } from "@annotorious/annotorious";
import type { FrameInput } from "../../workbench/frames/types";
import { annotationToFrame } from "../../annotations/annotation-utils";
import { AnnotationToolbar } from "../../annotations/AnnotationToolbar";

interface ViewerWorkbenchProps {
  infoUrl: string;
  onFrameAdd?: (frame: FrameInput) => void;
}

interface ImageDimensions {
  width: number;
  height: number;
}

const FALLBACK_DIMENSIONS: ImageDimensions = { width: 1, height: 1 };

export const ViewerWorkbench = memo(({ infoUrl, onFrameAdd }: ViewerWorkbenchProps) => {
  const annotoriousRef = useRef<AnnotoriousOpenSeadragonAnnotator | null>(null);
  const [annotatorInstance, setAnnotatorInstance] =
    useState<AnnotoriousOpenSeadragonAnnotator | null>(null);
  const pendingAnnotationsRef = useRef<ImageAnnotation[]>([]);
  const osdViewer = useViewer();
  const viewerInstance = osdViewer ?? null;
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [dimensionsReady, setDimensionsReady] = useState(false);
  const [infoRequestVersion, setInfoRequestVersion] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const navSettingsRef = useRef<OpenSeadragon.GestureSettings | null>(null);

  const requestIiifInfo = useCallback(() => {
    setInfoRequestVersion((previous) => previous + 1);
  }, []);

  useEffect(() => {
    pendingAnnotationsRef.current = [];
    setDimensionsReady(false);
    setImageDimensions(null);
  }, [infoUrl]);

  useEffect(() => {
    const trimmed = infoUrl.trim();
    if (!trimmed) {
      setImageDimensions(null);
      setDimensionsReady(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadInfo = async () => {
      try {
        const response = await fetch(trimmed, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { width?: number; height?: number } & Record<string, unknown>;
        const width = Number(payload.width ?? (payload as Record<string, unknown>)["@width"]);
        const height = Number(payload.height ?? (payload as Record<string, unknown>)["@height"]);
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          throw new Error('IIIF info missing width/height');
        }
        if (!cancelled) {
          setImageDimensions({ width, height });
          setDimensionsReady(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.warn('[viewer] failed to load IIIF info', error);
        setDimensionsReady(false);
        setImageDimensions(null);
      }
    };

    loadInfo();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [infoUrl, infoRequestVersion]);

  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    if (!viewerInstance) {
      navSettingsRef.current = null;
      return undefined;
    }

    const settings = (
      viewerInstance as unknown as { gestureSettingsMouse: OpenSeadragon.GestureSettings }
    ).gestureSettingsMouse;
    if (!navSettingsRef.current) {
      navSettingsRef.current = {
        clickToZoom: settings.clickToZoom,
        dragToPan: settings.dragToPan,
        scrollToZoom: settings.scrollToZoom,
      };
    }

    const enableNav = !isDrawing;
    settings.clickToZoom = enableNav;
    settings.dragToPan = enableNav;
    settings.scrollToZoom = enableNav;

    return () => {
      if (navSettingsRef.current) {
        settings.clickToZoom = navSettingsRef.current.clickToZoom;
        settings.dragToPan = navSettingsRef.current.dragToPan;
        settings.scrollToZoom = navSettingsRef.current.scrollToZoom;
      }
    };
  }, [viewerInstance, isDrawing]);
  /* eslint-enable react-hooks/immutability */

  useEffect(() => {
    const annotorious = annotatorInstance;
    if (!annotorious) {
      return undefined;
    }

    const handleCreate = (annotation: ImageAnnotation) => {
      console.log("[annotorious] createAnnotation", { id: annotation.id });
      const dims = imageDimensions;
      const hasTrustedDimensions = Boolean(dims);
      const usableDimensions = dims ?? FALLBACK_DIMENSIONS;

      if (!hasTrustedDimensions) {
        console.log("[annotorious] using fallback dimensions", FALLBACK_DIMENSIONS);
        pendingAnnotationsRef.current = [...pendingAnnotationsRef.current, annotation];
        requestIiifInfo();
      }

      const frame = annotationToFrame(annotation, usableDimensions);
      if (!frame) {
        console.log("[annotorious] skipping annotation: invalid bounds");
        return;
      }

      if (onFrameAdd) {
        onFrameAdd(frame);
      }
      annotoriousRef.current?.setDrawingTool("rectangle");
      annotoriousRef.current?.setDrawingEnabled(false);
      setIsDrawing(false);
    };

    annotorious.on("createAnnotation", handleCreate);
    return () => {
      annotorious.off("createAnnotation", handleCreate);
    };
  }, [annotatorInstance, imageDimensions, onFrameAdd, requestIiifInfo]);

  useEffect(() => {
    if (
      !dimensionsReady ||
      !imageDimensions ||
      !onFrameAdd ||
      pendingAnnotationsRef.current.length === 0
    ) {
      return;
    }

    const queuedCount = pendingAnnotationsRef.current.length;
    console.log("[annotorious] processing queued annotations", {
      count: queuedCount,
      dimensions: imageDimensions,
    });

    const queued = pendingAnnotationsRef.current;
    pendingAnnotationsRef.current = [];

    queued.forEach((annotation) => {
      const frame = annotationToFrame(annotation, imageDimensions);
      if (frame) {
        onFrameAdd(frame);
      } else {
        console.log("[annotorious] queued annotation dropped: invalid bounds", {
          id: annotation.id,
        });
      }
    });
  }, [dimensionsReady, imageDimensions, onFrameAdd]);

  const viewerOptions = useMemo(() => {
    const trimmed = infoUrl?.trim();
    if (!trimmed) {
      return null;
    }

    return {
      tileSources: trimmed,
      gestureSettingsMouse: {
        clickToZoom: false,
        dblClickToZoom: false,
        pinchToZoom: false,
        scrollToZoom: true,
      },
    };
  }, [infoUrl]);

  const handleToolbarChange = (drawing: boolean) => {
    console.log("[toolbar] drawing state change", { drawing });
    setIsDrawing(drawing);
  };

  useEffect(() => {
    if (!viewerInstance) {
      return undefined;
    }

    const canvas = viewerInstance.canvas as HTMLCanvasElement | undefined;
    if (!canvas) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      console.log("[viewer] pointer down", {
        x: event.offsetX,
        y: event.offsetY,
        drawing: isDrawing,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      console.log("[viewer] pointer up", {
        x: event.offsetX,
        y: event.offsetY,
        drawing: isDrawing,
      });
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, [viewerInstance, isDrawing]);

  const handleAnnotoriousRef = useCallback((instance: AnnotoriousOpenSeadragonAnnotator | null) => {
    annotoriousRef.current = instance;
    setAnnotatorInstance(instance);
  }, []);

  return (
    <Annotorious>
      <OpenSeadragonAnnotator
        ref={handleAnnotoriousRef}
        drawingEnabled={isDrawing}
        drawingMode="click"
        tool="rectangle"
        theme="light"
      >
        <section className="viewer-panel">
          <div className="panel-heading">
            <span>{infoUrl}</span>
          </div>
          <div className={`viewer-stage${isDrawing ? " drawing" : ""}`} data-annotatable>
            {viewerOptions ? (
              <OpenSeadragonViewer className="osd-viewer" options={viewerOptions} />
            ) : (
              <p className="viewer-placeholder">Paste an info.json to begin.</p>
            )}
          </div>
          <AnnotationToolbar onChange={handleToolbarChange} />
        </section>
      </OpenSeadragonAnnotator>
    </Annotorious>
  );
});

ViewerWorkbench.displayName = "ViewerWorkbench";
