import { Button, Flex, Popover, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import type { ImageAnnotation } from "@annotorious/annotorious";
import { useAnnotator, type AnnotoriousOpenSeadragonAnnotator } from "@annotorious/react";

interface AnnotationToolbarProps {
  isDrawing?: boolean;
  onChange?: (drawing: boolean) => void;
  selectedAnnotation?: ImageAnnotation | null;
  onDuplicateAndOffset?: (count: number, offsetPx: number) => void;
}

export function AnnotationToolbar({ isDrawing, onChange, selectedAnnotation, onDuplicateAndOffset }: AnnotationToolbarProps) {
  const annotator = useAnnotator<AnnotoriousOpenSeadragonAnnotator<ImageAnnotation>>();
  const [offsetDistance, setOffsetDistance] = useState(20);
  const [duplicateCount, setDuplicateCount] = useState(1);

  const handleDrawRectangle = () => {
    if (isDrawing) {
      annotator?.setDrawingEnabled(false);
      onChange?.(false);
    } else {
      console.log("[toolbar] draw rectangle clicked");
      annotator?.setDrawingTool("rectangle");
      annotator?.setDrawingEnabled(true);
      onChange?.(true);
    }
  };

  const handleDuplicate = () => {
    onDuplicateAndOffset?.(duplicateCount, offsetDistance);
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
      <Button
        type="button"
        variant={isDrawing ? "outline" : "solid"}
        color={isDrawing ? "red" : undefined}
        onClick={handleDrawRectangle}
      >
        {isDrawing ? "Cancel drawing (Esc)" : "Draw rectangle"}
      </Button>
      {selectedAnnotation && (
        <Popover.Root>
          <Popover.Trigger>
            <Button type="button" variant="solid">
              Duplicate &amp; Offset
            </Button>
          </Popover.Trigger>
          <Popover.Content style={{ minWidth: "200px" }}>
            <Flex direction="column" gap="3">
              <Flex direction="column" gap="1">
                <Text as="label" size="1" color="gray" weight="medium">
                  Offset distance (px)
                </Text>
                <TextField.Root
                  type="number"
                  min="0"
                  value={String(offsetDistance)}
                  onChange={(e) => setOffsetDistance(Math.max(0, Number(e.target.value)))}
                />
              </Flex>
              <Flex direction="column" gap="1">
                <Text as="label" size="1" color="gray" weight="medium">
                  Number of duplicates
                </Text>
                <TextField.Root
                  type="number"
                  min="1"
                  value={String(duplicateCount)}
                  onChange={(e) => setDuplicateCount(Math.max(1, Number(e.target.value)))}
                />
              </Flex>
              <Popover.Close>
                <Button type="button" variant="solid" onClick={handleDuplicate} style={{ width: "100%" }}>
                  Duplicate
                </Button>
              </Popover.Close>
            </Flex>
          </Popover.Content>
        </Popover.Root>
      )}
    </Flex>
  );
}
