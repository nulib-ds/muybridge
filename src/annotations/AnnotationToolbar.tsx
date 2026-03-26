import type { ImageAnnotation } from "@annotorious/annotorious";
import { useAnnotator, type AnnotoriousOpenSeadragonAnnotator } from "@annotorious/react";

interface AnnotationToolbarProps {
  onChange?: (drawing: boolean) => void;
  onConfirm?: () => void;
}

export function AnnotationToolbar({ onChange, onConfirm }: AnnotationToolbarProps) {
  const annotator = useAnnotator<AnnotoriousOpenSeadragonAnnotator<ImageAnnotation>>();

  const handleDrawRectangle = () => {
    console.log('[toolbar] draw rectangle clicked');
    annotator?.setDrawingTool("rectangle");
    annotator?.setDrawingEnabled(true);
    onChange?.(true);
  };

  const handleConfirm = () => {
    console.log('[toolbar] create frame clicked');
    onConfirm?.();
  };

  return (
    <div className="annotation-toolbar">
      <button type="button" onClick={handleDrawRectangle}>
        Draw rectangle
      </button>
      <button type="button" onClick={handleConfirm}>
        Create frame
      </button>
    </div>
  );
}
