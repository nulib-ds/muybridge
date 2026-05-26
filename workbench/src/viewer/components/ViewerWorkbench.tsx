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

export const ViewerWorkbench = memo(
  ({ infoUrl, annotations, highlightedAnnotationId, selectedAnnotationId, onAnnotationAdd, onDuplicateAndOffset, onAnnotationSelect }: ViewerWorkbenchProps) => {
    const annotoriousRef = useRef<AnnotoriousOpenSeadragonAnnotator | null>(null);
    const [annotatorInstance, setAnnotatorInstance] =
      useState<AnnotoriousOpenSeadragonAnnotator | null>(null);
    const osdViewer = useViewer();
    const viewerInstance = osdViewer ?? null;
    const [isDrawing, setIsDrawing] = useState(false);
    const [accentStrokeColor, setAccentStrokeColor] = useState("#d92d20");

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
    const navSettingsRef = useRef<OpenSeadragon.GestureSettings | null>(null);
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
            />
            <div data-annotatable>
              <OpenSeadragonViewer options={viewerOptions} />
            </div>
            <VisuallyHidden>{infoUrl}</VisuallyHidden>
          </div>
        </OpenSeadragonAnnotator>
      </Annotorious>
    );
  },
);

ViewerWorkbench.displayName = "ViewerWorkbench";
