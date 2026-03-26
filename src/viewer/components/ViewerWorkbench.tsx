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
import { AnnotationToolbar } from "../../annotations/AnnotationToolbar";

interface ViewerWorkbenchProps {
  infoUrl: string;
  annotations: ImageAnnotation[];
  onAnnotationAdd?: (annotation: ImageAnnotation) => void;
}

export const ViewerWorkbench = memo(({ infoUrl, annotations, onAnnotationAdd }: ViewerWorkbenchProps) => {
  const annotoriousRef = useRef<AnnotoriousOpenSeadragonAnnotator | null>(null);
  const [annotatorInstance, setAnnotatorInstance] =
    useState<AnnotoriousOpenSeadragonAnnotator | null>(null);
  const osdViewer = useViewer();
  const viewerInstance = osdViewer ?? null;
  const [isDrawing, setIsDrawing] = useState(false);
  const navSettingsRef = useRef<OpenSeadragon.GestureSettings | null>(null);

  useEffect(() => {
    const annotorious = annotatorInstance;
    if (!annotorious) {
      return;
    }

    annotorious.setAnnotations(annotations, true);
  }, [annotatorInstance, annotations]);

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
      onAnnotationAdd?.(annotation);
      annotoriousRef.current?.setDrawingTool("rectangle");
      annotoriousRef.current?.setDrawingEnabled(false);
      setIsDrawing(false);
    };

    annotorious.on("createAnnotation", handleCreate);
    return () => {
      annotorious.off("createAnnotation", handleCreate);
    };
  }, [annotatorInstance, onAnnotationAdd]);

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
            <h2>IIIF viewer</h2>
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
          <p>
            Click "Draw rectangle" to enter digitizing mode (crosshair cursor). Drag across the
            plate, then use Cancel to exit drawing or discard the active shape. Each completed
            rectangle populates the frame queue on the right.
          </p>
        </section>
      </OpenSeadragonAnnotator>
    </Annotorious>
  );
});

ViewerWorkbench.displayName = "ViewerWorkbench";
