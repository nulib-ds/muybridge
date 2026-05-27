import { Card, Flex, Text, VisuallyHidden } from "@radix-ui/themes";
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
import { getAnnotationPixelBounds } from "../../annotations/annotation-utils";

interface ViewerWorkbenchProps {
  infoUrl: string;
  annotations: ImageAnnotation[];
  highlightedAnnotationId?: string | null;
  selectedAnnotationId?: string | null;
  onAnnotationAdd?: (annotation: ImageAnnotation) => void;
  onDuplicateAndOffset?: (count: number, offsetPx: number) => void;
  onAnnotationSelect?: (id: string | null) => void;
}

function resolveCssColor(value: string | null | undefined) {
  if (!value || typeof window === "undefined" || !document.body) {
    return value ?? null;
  }
  const probe = document.createElement("div");
  probe.style.color = value;
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return resolved || value;
}

// useViewer() must be called inside <OpenSeadragonAnnotator>'s context tree.
// ViewerWorkbench renders that provider itself, so it can't call useViewer()
// at its own level — the context isn't there yet. This bridge component lives
// inside the annotator tree and passes the viewer up via a callback.
function ViewerConsumer({ onViewer }: { onViewer: (v: OpenSeadragon.Viewer | null) => void }) {
  const viewer = useViewer();
  const onViewerRef = useRef(onViewer);
  onViewerRef.current = onViewer;
  useEffect(() => {
    onViewerRef.current(viewer ?? null);
  }, [viewer]);
  return null;
}

export const ViewerWorkbench = memo(
  ({ infoUrl, annotations, highlightedAnnotationId, selectedAnnotationId, onAnnotationAdd, onDuplicateAndOffset, onAnnotationSelect }: ViewerWorkbenchProps) => {
    const annotoriousRef = useRef<AnnotoriousOpenSeadragonAnnotator | null>(null);
    const [annotatorInstance, setAnnotatorInstance] =
      useState<AnnotoriousOpenSeadragonAnnotator | null>(null);
    const [viewerInstance, setViewerInstance] = useState<OpenSeadragon.Viewer | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [accentStrokeColor, setAccentStrokeColor] = useState("#d92d20");
    const [previewParams, setPreviewParams] = useState<{ count: number; offsetPx: number; direction: "left" | "right" } | null>(null);
    const [previewRects, setPreviewRects] = useState<Array<{ x: number; y: number; width: number; height: number }>>([]);

    useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }
      const themeRoot = document.querySelector<HTMLElement>(".radix-themes");
      const target = themeRoot ?? document.documentElement;
      const computed = window.getComputedStyle(target).getPropertyValue("--accent-10");
      if (computed?.trim()) {
        const normalized = resolveCssColor(computed.trim());
        if (normalized) {
          setAccentStrokeColor(normalized);
        }
      }
    }, []);
    const navSettingsRef = useRef<Pick<OpenSeadragon.GestureSettings, "dragToPan" | "scrollToZoom"> | null>(null);
    const updateTimerRef = useRef<number | null>(null);

    useEffect(() => {
      const annotorious = annotatorInstance;
      if (!annotorious) {
        return;
      }

      annotorious.setAnnotations(annotations, true);
    }, [annotatorInstance, annotations]);

    useEffect(() => {
      const annotorious = annotatorInstance;
      if (!annotorious) return undefined;

      const handleSelectionChanged = (selected: ImageAnnotation[]) => {
        onAnnotationSelect?.(selected.length > 0 ? selected[0].id : null);
      };

      annotorious.on("selectionChanged", handleSelectionChanged);
      return () => {
        annotorious.off("selectionChanged", handleSelectionChanged);
      };
    }, [annotatorInstance, onAnnotationSelect]);

    useEffect(() => {
      const annotorious = annotatorInstance;
      if (!annotorious) {
        return undefined;
      }

      if (!highlightedAnnotationId) {
        annotorious.setStyle(() => undefined);
        return undefined;
      }

      annotorious.setStyle((annotation) => {
        if (annotation.id === highlightedAnnotationId) {
          return { stroke: accentStrokeColor, strokeWidth: 2.5 };
        }
        return undefined;
      });

      return () => {
        annotorious.setStyle(() => undefined);
      };
    }, [annotatorInstance, highlightedAnnotationId, accentStrokeColor]);

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
          dragToPan: settings.dragToPan,
          scrollToZoom: settings.scrollToZoom,
        };
      }

      const enableNav = !isDrawing;
      settings.dragToPan = enableNav;
      settings.scrollToZoom = enableNav;

      return () => {
        if (navSettingsRef.current) {
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

      const handleUpdate = (annotation: ImageAnnotation) => {
        if (updateTimerRef.current) {
          window.cancelAnimationFrame(updateTimerRef.current);
          updateTimerRef.current = null;
        }

        updateTimerRef.current = window.requestAnimationFrame(() => {
          console.log("[annotorious] updateAnnotation", { id: annotation.id });
          onAnnotationAdd?.(annotation);
          updateTimerRef.current = null;
        });
      };

      annotorious.on("createAnnotation", handleCreate);
      annotorious.on("updateAnnotation", handleUpdate);
      return () => {
        annotorious.off("createAnnotation", handleCreate);
        annotorious.off("updateAnnotation", handleUpdate);
        if (updateTimerRef.current) {
          window.cancelAnimationFrame(updateTimerRef.current);
          updateTimerRef.current = null;
        }
      };
    }, [annotatorInstance, onAnnotationAdd]);

    const viewerOptions = useMemo(() => {
      const trimmed = infoUrl?.trim();
      if (!trimmed) {
        return null;
      }

      return {
        tileSources: trimmed,
        showNavigationControl: false,
        showHomeControl: false,
        showFullPageControl: false,
        showRotationControl: false,
        showFlipControl: false,
        showZoomControl: false,
        gestureSettingsMouse: {
          clickToZoom: false,
          dblClickToZoom: false,
          pinchToZoom: false,
          scrollToZoom: true,
        },
      };
    }, [infoUrl]);

    const selectedAnnotation = useMemo(
      () => (selectedAnnotationId ? (annotations.find((a) => a.id === selectedAnnotationId) ?? null) : null),
      [annotations, selectedAnnotationId],
    );

    useEffect(() => {
      if (!annotatorInstance) return;
      if (selectedAnnotationId) {
        annotatorInstance.setSelected(selectedAnnotationId, false);
      } else {
        annotatorInstance.setSelected();
      }
    }, [annotatorInstance, selectedAnnotationId]);

    const handlePreviewChange = useCallback(
      (params: { count: number; offsetPx: number } | null) => {
        setPreviewParams(params);
      },
      [],
    );

    const computePreviewRects = useCallback(() => {
      if (!previewParams || !selectedAnnotation || !viewerInstance) {
        setPreviewRects([]);
        return;
      }
      const bounds = getAnnotationPixelBounds(selectedAnnotation);
      if (!bounds) {
        setPreviewRects([]);
        return;
      }
      const { x, y, width: w, height: h } = bounds;
      const { count, offsetPx, direction } = previewParams;
      const rects: Array<{ x: number; y: number; width: number; height: number }> = [];
      for (let i = 0; i < count; i++) {
        const step = (i + 1) * (w + offsetPx);
        const newX = direction === "left" ? x - step : x + step;
        try {
          const vpRect = viewerInstance.viewport.imageToViewportRectangle(newX, y, w, h);
          const elemRect = viewerInstance.viewport.viewportToViewerElementRectangle(vpRect);
          rects.push({ x: elemRect.x, y: elemRect.y, width: elemRect.width, height: elemRect.height });
        } catch {
          // viewport not ready
        }
      }
      setPreviewRects(rects);
    }, [previewParams, selectedAnnotation, viewerInstance]);

    useEffect(() => {
      computePreviewRects();
    }, [computePreviewRects]);

    useEffect(() => {
      if (!viewerInstance) return undefined;
      viewerInstance.addHandler("update-viewport", computePreviewRects);
      return () => viewerInstance.removeHandler("update-viewport", computePreviewRects);
    }, [viewerInstance, computePreviewRects]);

    const handleToolbarChange = (drawing: boolean) => {
      console.log("[toolbar] drawing state change", { drawing });
      setIsDrawing(drawing);
    };

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isDrawing) {
          annotoriousRef.current?.setDrawingEnabled(false);
          setIsDrawing(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isDrawing]);

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

    const handleAnnotoriousRef = useCallback(
      (instance: AnnotoriousOpenSeadragonAnnotator | null) => {
        annotoriousRef.current = instance;
        setAnnotatorInstance(instance);
      },
      [],
    );

    return (
      <Annotorious>
        <OpenSeadragonAnnotator
          ref={handleAnnotoriousRef}
          drawingEnabled={isDrawing}
          drawingMode="click"
          tool="rectangle"
          theme="light"
        >
          <ViewerConsumer onViewer={setViewerInstance} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minHeight: "100%",
              position: "relative",
            }}
          >
            <AnnotationToolbar
              isDrawing={isDrawing}
              onChange={handleToolbarChange}
              selectedAnnotation={selectedAnnotation}
              onDuplicateAndOffset={onDuplicateAndOffset}
              onPreviewChange={handlePreviewChange}
            />
            <div data-annotatable>
              <OpenSeadragonViewer options={viewerOptions} />
              {previewRects.length > 0 && (
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    overflow: "visible",
                    zIndex: 10,
                  }}
                >
                  {previewRects.map((rect, i) => (
                    <rect
                      key={i}
                      x={rect.x}
                      y={rect.y}
                      width={Math.max(0, rect.width)}
                      height={Math.max(0, rect.height)}
                      fill="rgba(255, 0, 0, 0.2)"
                      stroke="red"
                      strokeWidth={2}
                    />
                  ))}
                </svg>
              )}
            </div>
            <VisuallyHidden>{infoUrl}</VisuallyHidden>
          </div>
        </OpenSeadragonAnnotator>
      </Annotorious>
    );
  },
);

ViewerWorkbench.displayName = "ViewerWorkbench";
