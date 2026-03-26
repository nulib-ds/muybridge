import type { ImageAnnotation } from "@annotorious/annotorious";
import { useAnnotator, type AnnotoriousOpenSeadragonAnnotator } from "@annotorious/react";

interface AnnotationToolbarProps {
  onChange?: (drawing: boolean) => void;
}

export function AnnotationToolbar({ onChange }: AnnotationToolbarProps) {
  const annotator = useAnnotator<AnnotoriousOpenSeadragonAnnotator<ImageAnnotation>>();

  const handleDrawRectangle = () => {
    console.log('[toolbar] draw rectangle clicked');
    annotator?.setDrawingTool("rectangle");
    annotator?.setDrawingEnabled(true);
    onChange?.(true);
  };

  return (
    <div className="annotation-toolbar">
      <button type="button" onClick={handleDrawRectangle}>
        Draw rectangle
      </button>
    </div>
  );
}
