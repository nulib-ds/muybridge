import { Button, Flex } from "@radix-ui/themes";
import type { ImageAnnotation } from "@annotorious/annotorious";
import { useAnnotator, type AnnotoriousOpenSeadragonAnnotator } from "@annotorious/react";

interface AnnotationToolbarProps {
  onChange?: (drawing: boolean) => void;
}

export function AnnotationToolbar({ onChange }: AnnotationToolbarProps) {
  const annotator = useAnnotator<AnnotoriousOpenSeadragonAnnotator<ImageAnnotation>>();

  const handleDrawRectangle = () => {
    console.log("[toolbar] draw rectangle clicked");
    annotator?.setDrawingTool("rectangle");
    annotator?.setDrawingEnabled(true);
    onChange?.(true);
  };

  return (
    <Flex
      gap="2"
      wrap="wrap"
      style={{
        position: "absolute",
        zIndex: 1,
      }}
    >
      <Button type="button" variant="solid" onClick={handleDrawRectangle}>
        Draw rectangle
      </Button>
    </Flex>
  );
}
