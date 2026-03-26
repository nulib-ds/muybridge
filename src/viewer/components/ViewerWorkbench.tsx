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

export const ViewerWorkbench = memo(({ infoUrl, onFrameAdd }: ViewerWorkbenchProps) => {
  const annotoriousRef = useRef<AnnotoriousOpenSeadragonAnnotator | null>(null);
  const handlersRef = useRef<{
    open?: OpenSeadragon.EventHandler<OpenSeadragon.OpenEvent>;
    close?: OpenSeadragon.EventHandler<OpenSeadragon.ViewerEvent>;
  }>({});
  const frameCounterRef = useRef(0);
  const pendingFrameRef = useRef<FrameInput | null>(null);
  const osdViewer = useViewer();
  const viewerInstance = osdViewer ?? null;
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const navSettingsRef = useRef<OpenSeadragon.GestureSettings | null>(null);

  const readViewerDimensions = useCallback((): ImageDimensions | null => {
    if (!viewerInstance) {
      return null;
    }

    const firstItem = viewerInstance.world.getItemAt(0);
    if (!firstItem) {
      return null;
    }

    const size = firstItem.getContentSize();
    return { width: size.x, height: size.y };
  }, [viewerInstance]);

  const updateDimensions = useCallback(() => {
    const dims = readViewerDimensions();
    if (dims) {
      setImageDimensions(dims);
      console.log("[viewer] updated dimensions", dims);
    }
  }, [readViewerDimensions]);

  useEffect(() => {
    if (!viewerInstance) {
      return undefined;
    }

    const openHandler: OpenSeadragon.EventHandler<OpenSeadragon.OpenEvent> = () =>
      updateDimensions();
    const closeHandler: OpenSeadragon.EventHandler<OpenSeadragon.ViewerEvent> = () =>
      setImageDimensions(null);

    viewerInstance.addHandler("open", openHandler);
    viewerInstance.addHandler("close", closeHandler);
    handlersRef.current = { open: openHandler, close: closeHandler };
    const rAF = requestAnimationFrame(() => updateDimensions());

    return () => {
      cancelAnimationFrame(rAF);
      if (handlersRef.current.open) {
        viewerInstance.removeHandler("open", handlersRef.current.open);
      }
      if (handlersRef.current.close) {
        viewerInstance.removeHandler("close", handlersRef.current.close);
      }
      handlersRef.current = {};
      setImageDimensions(null);
    };
  }, [viewerInstance, updateDimensions]);

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
    const annotorious = annotoriousRef.current;
    if (!annotorious) {
      return undefined;
    }

    const handleCreate = (annotation: ImageAnnotation) => {
      console.log("[annotorious] createAnnotation", { id: annotation.id });
      const dims = imageDimensions ?? readViewerDimensions();
      if (!dims) {
        console.log("[annotorious] skipping annotation: image dimensions unknown");
        return;
      }

      const frame = annotationToFrame(annotation, dims);
      if (!frame) {
        console.log("[annotorious] skipping annotation: invalid bounds");
        return;
      }

      pendingFrameRef.current = frame;
      annotoriousRef.current?.setDrawingTool("rectangle");
      annotoriousRef.current?.setDrawingEnabled(false);
      setIsDrawing(false);
    };

    annotorious.on("createAnnotation", handleCreate);
    return () => {
      annotorious.off("createAnnotation", handleCreate);
    };
  }, [imageDimensions, readViewerDimensions]);

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

  const handleConfirmFrame = () => {
    const annotorious = annotoriousRef.current;
    if (!annotorious) {
      console.log("[toolbar] confirm frame ignored: annotorious not ready");
      return;
    }
    if (!onFrameAdd) {
      console.log("[toolbar] confirm frame ignored: onFrameAdd missing");
      return;
    }

    const dims = imageDimensions ?? readViewerDimensions();
    const selection = annotorious.getSelected?.() ?? [];
    let frame: FrameInput | null = null;

    if (selection[0] && dims) {
      frame = annotationToFrame(selection[0] as ImageAnnotation, dims);
      console.log("[toolbar] confirm frame from selection", { frame });
    } else if (selection[0] && !dims) {
      console.log(
        "[toolbar] selection present but dimensions unknown, falling back to pending frame",
      );
    }

    if (!frame) {
      frame = pendingFrameRef.current;
      console.log("[toolbar] confirm frame using pending cache", { frame });
    }

    if (!frame) {
      console.log("[toolbar] confirm frame ignored: no selection or pending frame");
      return;
    }

    frameCounterRef.current += 1;
    const sequence = frameCounterRef.current;
    const enrichedFrame: FrameInput = {
      ...frame,
      id: frame.id ?? `frame-${sequence}`,
      paneId: frame.paneId ?? `pane-${sequence}`,
      order: sequence,
    };

    console.log("[toolbar] confirm frame", { frame: enrichedFrame });
    onFrameAdd(enrichedFrame);
    annotorious.cancelSelected?.();
    pendingFrameRef.current = null;
    annotoriousRef.current?.setDrawingEnabled(false);
    setIsDrawing(false);
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

  useEffect(() => {
    console.log(annotoriousRef);
  }, [annotoriousRef, isDrawing]);

  return (
    <Annotorious>
      <OpenSeadragonAnnotator
        ref={annotoriousRef}
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
          <AnnotationToolbar onChange={handleToolbarChange} onConfirm={handleConfirmFrame} />
        </section>
      </OpenSeadragonAnnotator>
    </Annotorious>
  );
});

ViewerWorkbench.displayName = "ViewerWorkbench";
