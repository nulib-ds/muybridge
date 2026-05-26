import { Button, Flex, Popover, SegmentedControl, Text, TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import type { ImageAnnotation } from "@annotorious/annotorious";
import { useAnnotator, type AnnotoriousOpenSeadragonAnnotator } from "@annotorious/react";

interface AnnotationToolbarProps {
  isDrawing?: boolean;
  onChange?: (drawing: boolean) => void;
  selectedAnnotation?: ImageAnnotation | null;
  onDuplicateAndOffset?: (count: number, offsetPx: number, direction: "left" | "right") => void;
  onPreviewChange?: (params: { count: number; offsetPx: number; direction: "left" | "right" } | null) => void;
}

export function AnnotationToolbar({ isDrawing, onChange, selectedAnnotation, onDuplicateAndOffset, onPreviewChange }: AnnotationToolbarProps) {
  const annotator = useAnnotator<AnnotoriousOpenSeadragonAnnotator<ImageAnnotation>>();
  const [offsetDistance, setOffsetDistance] = useState(20);
  const [duplicateCount, setDuplicateCount] = useState(1);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    if (popoverOpen && selectedAnnotation) {
      onPreviewChange?.({ count: duplicateCount, offsetPx: offsetDistance, direction });
    }
  }, [popoverOpen, duplicateCount, offsetDistance, direction, selectedAnnotation, onPreviewChange]);

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
    onDuplicateAndOffset?.(duplicateCount, offsetDistance, direction);
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
        <Popover.Root
          open={popoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open);
            if (!open) onPreviewChange?.(null);
          }}
        >
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
              <Flex direction="column" gap="1">
                <Text size="1" color="gray" weight="medium">
                  Direction
                </Text>
                <SegmentedControl.Root
                  value={direction}
                  onValueChange={(v) => setDirection(v as "left" | "right")}
                  size="1"
                >
                  <SegmentedControl.Item value="right">Right →</SegmentedControl.Item>
                  <SegmentedControl.Item value="left">← Left</SegmentedControl.Item>
                </SegmentedControl.Root>
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
