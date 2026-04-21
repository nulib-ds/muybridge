import {
  Box,
  Button,
  Card,
  Code,
  Flex,
  ScrollArea,
  Slider,
  Text,
  TextField,
  VisuallyHidden,
} from "@radix-ui/themes";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  DURATION_INPUT_STEP_SECONDS,
  DURATION_STEP_SECONDS,
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS,
  sanitizeDuration,
} from "./duration";
import type { FrameDescriptor } from "./types";
import { FrameThumbnail } from "./FrameThumbnail";
import { FramePreview } from "./FramePreview";

const FRAME_DRAG_DATA_TYPE = "frame";

type FrameDragData = {
  type: typeof FRAME_DRAG_DATA_TYPE;
  annotationId: string;
};

function isFrameDragData(data: Record<string, unknown> | undefined): data is FrameDragData {
  return Boolean(
    data &&
    typeof data === "object" &&
    "type" in data &&
    "annotationId" in data &&
    data.type === FRAME_DRAG_DATA_TYPE &&
    typeof data.annotationId === "string",
  );
}

function reorderAnnotationIds(order: string[], sourceId: string, targetId: string | null) {
  if (!sourceId || sourceId === targetId) {
    return null;
  }
  const sanitized = order.filter((id): id is string => Boolean(id));
  if (!sanitized.length) {
    return null;
  }
  const withoutSource: string[] = [];
  let removed = false;
  sanitized.forEach((id) => {
    if (!removed && id === sourceId) {
      removed = true;
      return;
    }
    withoutSource.push(id);
  });
  if (!removed) {
    return null;
  }
  const insertIndex = targetId ? withoutSource.indexOf(targetId) : withoutSource.length;
  const boundedIndex = insertIndex === -1 ? withoutSource.length : insertIndex;
  const nextOrder = [...withoutSource];
  nextOrder.splice(boundedIndex, 0, sourceId);
  return nextOrder;
}

interface FramesSidebarProps {
  frames: FrameDescriptor[];
  infoUrl: string;
  durationSeconds: number;
  onDurationChange?: (duration: number) => void;
  onExportManifest?: () => void;
  canExportManifest?: boolean;
  manifestUrl?: string | null;
  onExportGif?: () => void;
  canExportGif?: boolean;
  isExportingGif?: boolean;
  gifError?: string | null;
  gifPreviewSrc?: string | null;
  onClear?: () => void;
  onFrameHover?: (annotationId: string | null) => void;
  onFrameSelect?: (annotationId: string) => void;
  onFrameDelete?: (annotationId: string) => void;
  onFrameReorder?: (annotationIds: string[]) => void;
  hoveredAnnotationId?: string | null;
  selectedAnnotationId?: string | null;
}

function formatBounds(frame: FrameDescriptor) {
  return `${frame.bounds.x.toFixed(2)}, ${frame.bounds.y.toFixed(2)} / ${frame.bounds.width.toFixed(2)}, ${frame.bounds.height.toFixed(2)}`;
}

export function FramesSidebar({
  frames,
  infoUrl,
  durationSeconds,
  onDurationChange,
  onExportManifest,
  canExportManifest,
  manifestUrl,
  onExportGif,
  canExportGif,
  isExportingGif,
  gifError,
  gifPreviewSrc,
  onClear,
  onFrameHover,
  onFrameSelect,
  onFrameDelete,
  onFrameReorder,
  hoveredAnnotationId,
  selectedAnnotationId,
}: FramesSidebarProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const safeDurationSeconds = sanitizeDuration(durationSeconds);
  const annotationOrder = useMemo(() => frames.map((frame) => frame.paneId || frame.id), [frames]);
  const handleDurationInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!onDurationChange) {
      return;
    }
    const value = Number(event.target.value);
    onDurationChange(sanitizeDuration(value));
  };
  const handleDurationSliderChange = (values: number[]) => {
    if (!onDurationChange) {
      return;
    }
    const [value] = values;
    onDurationChange(sanitizeDuration(value ?? safeDurationSeconds));
  };
  const frameSequenceKey = frames.map((frame) => frame.id).join("|");
  const previewKey = `${infoUrl}-${frameSequenceKey}-${durationSeconds}`;
  const activeAnnotationId = hoveredAnnotationId ?? selectedAnnotationId ?? null;
  const gifButtonLabel = isExportingGif ? "Exporting GIF..." : "Export animated GIF";
  const durationLabelId = "animationDurationLabel";
  const durationInputId = "animationDurationInput";
  const handleDragStart = useCallback((annotationId: string) => {
    setDraggingId(annotationId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  return (
    <Box
      p="5"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        borderRadius: 0,
        background: "white",
        boxShadow: "var(--shadow-5)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <VisuallyHidden asChild>
        <span>Frame queue ({frames.length} items)</span>
      </VisuallyHidden>
      <Flex align="center" justify="between">
        <Text size="5" weight="light" color="gray">
          Frames ({frames.length})
        </Text>
        <Button type="button" onClick={onClear} disabled={!onClear}>
          Clear list
        </Button>
      </Flex>
      <ScrollArea style={{ flex: 1 }}>
        <Flex asChild direction="column" pr="2">
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {frames.length === 0 ? (
              <li>
                <Card variant="surface" size="1">
                  <Text color="gray">No frames yet — draw a rectangle to get started.</Text>
                </Card>
              </li>
            ) : (
              frames.map((frame) => {
                const annotationId = frame.paneId || frame.id;
                const isHovered = Boolean(
                  hoveredAnnotationId && hoveredAnnotationId === annotationId,
                );
                const isSelected = Boolean(
                  selectedAnnotationId && selectedAnnotationId === annotationId,
                );
                return (
                  <Fragment key={frame.id}>
                    <FrameDropZone
                      annotationOrder={annotationOrder}
                      onFrameReorder={onFrameReorder}
                      targetAnnotationId={annotationId}
                      testId={`dropzone-before-${annotationId}`}
                    />
                    <FrameListItem
                      frame={frame}
                      infoUrl={infoUrl}
                      annotationId={annotationId}
                      isHovered={isHovered}
                      isSelected={isSelected}
                      isDragging={draggingId === annotationId}
                      onFrameHover={onFrameHover}
                      onFrameSelect={onFrameSelect}
                      onFrameDelete={onFrameDelete}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      canReorder={Boolean(onFrameReorder)}
                      annotationOrder={annotationOrder}
                      onFrameReorder={onFrameReorder}
                    />
                  </Fragment>
                );
              })
            )}
            {frames.length ? (
              <FrameDropZone
                annotationOrder={annotationOrder}
                onFrameReorder={onFrameReorder}
                targetAnnotationId={null}
                testId="dropzone-end"
              />
            ) : null}
          </ol>
        </Flex>
      </ScrollArea>
      <Flex direction="column" gap="3">
        <div role="region" aria-label="Animation preview">
          {frames.length ? (
            <FramePreview
              key={previewKey}
              infoUrl={infoUrl}
              frames={frames}
              durationSeconds={durationSeconds}
              activeAnnotationId={activeAnnotationId}
            />
          ) : (
            <Text color="gray">Draw a rectangle to see the animation loop.</Text>
          )}
        </div>
        {gifPreviewSrc ? (
          <figure style={{ margin: 0 }}>
            <img
              src={gifPreviewSrc}
              alt="Latest GIF export preview"
              style={{
                width: "100%",
                maxHeight: "160px",
                objectFit: "contain",
                backgroundColor: "#111",
                borderRadius: "var(--radius-2)",
              }}
            />
            <Text asChild size="1" color="gray">
              <figcaption>Auto-exported GIF</figcaption>
            </Text>
          </figure>
        ) : null}
        <Flex direction="column" gap="2">
          <Text asChild size="2" weight="medium">
            <label id={durationLabelId} htmlFor={durationInputId}>
              Duration (seconds)
            </label>
          </Text>
          <Flex gap="3" align="center">
            <Slider
              min={MIN_DURATION_SECONDS}
              max={MAX_DURATION_SECONDS}
              step={DURATION_STEP_SECONDS}
              value={[safeDurationSeconds]}
              onValueChange={handleDurationSliderChange}
              aria-labelledby={durationLabelId}
              style={{ flexGrow: 1 }}
            />
            <TextField.Root
              id={durationInputId}
              type="number"
              min={`${MIN_DURATION_SECONDS}`}
              max={`${MAX_DURATION_SECONDS}`}
              step={DURATION_INPUT_STEP_SECONDS}
              inputMode="decimal"
              value={safeDurationSeconds}
              onChange={handleDurationInputChange}
              style={{ width: "88px" }}
            />
          </Flex>
        </Flex>
        <Flex direction="column" gap="2">
          <Button
            type="button"
            onClick={onExportGif}
            disabled={!onExportGif || !canExportGif || Boolean(isExportingGif)}
          >
            {gifButtonLabel}
          </Button>
          <Button
            type="button"
            onClick={onExportManifest}
            disabled={!onExportManifest || !canExportManifest}
          >
            Export IIIF manifest
          </Button>
          {manifestUrl ? (
            <Text asChild size="1" color="gray">
              <a href={manifestUrl} target="_blank" rel="noopener noreferrer">
                {manifestUrl}
              </a>
            </Text>
          ) : null}
          {gifError ? (
            <Text size="1" color="crimson">
              {gifError}
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </Box>
  );
}

interface FrameListItemProps {
  frame: FrameDescriptor;
  infoUrl: string;
  annotationId: string;
  isHovered: boolean;
  isSelected: boolean;
  isDragging: boolean;
  canReorder: boolean;
  annotationOrder: string[];
  onFrameHover?: (annotationId: string | null) => void;
  onFrameSelect?: (annotationId: string) => void;
  onFrameDelete?: (annotationId: string) => void;
  onFrameReorder?: (annotationIds: string[]) => void;
  onDragStart: (annotationId: string) => void;
  onDragEnd: () => void;
}

function FrameListItem({
  frame,
  infoUrl,
  annotationId,
  isHovered,
  isSelected,
  isDragging,
  canReorder,
  annotationOrder,
  onFrameHover,
  onFrameSelect,
  onFrameDelete,
  onFrameReorder,
  onDragStart,
  onDragEnd,
}: FrameListItemProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canReorder) {
      return;
    }
    const element = cardRef.current;
    if (!element) {
      return;
    }
    return draggable({
      element,
      getInitialData: () => ({ type: FRAME_DRAG_DATA_TYPE, annotationId }),
      canDrag: () => canReorder,
      onDragStart: () => onDragStart(annotationId),
      onDrop: () => onDragEnd(),
      onDragEnd: () => onDragEnd(),
    });
  }, [annotationId, canReorder, onDragEnd, onDragStart]);

  useEffect(() => {
    if (!canReorder || !onFrameReorder) {
      return;
    }
    const element = cardRef.current;
    if (!element) {
      return;
    }
    return dropTargetForElements({
      element,
      getData: () => ({ type: FRAME_DRAG_DATA_TYPE, annotationId }),
      canDrop: ({ source }) => isFrameDragData(source.data),
      onDrop: ({ source }) => {
        if (!isFrameDragData(source.data)) {
          return;
        }
        const nextOrder = reorderAnnotationIds(
          annotationOrder,
          source.data.annotationId,
          annotationId,
        );
        if (nextOrder) {
          onFrameReorder(nextOrder);
        }
      },
    });
  }, [annotationId, annotationOrder, canReorder, onFrameReorder]);

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onFrameDelete?.(annotationId);
  };

  return (
    <li>
      <Card
        ref={cardRef}
        size="1"
        onMouseEnter={() => onFrameHover?.(annotationId)}
        onMouseLeave={() => onFrameHover?.(null)}
        onClick={() => onFrameSelect?.(annotationId)}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onFrameSelect?.(annotationId);
          }
        }}
        role="button"
        tabIndex={0}
        style={{
          cursor: canReorder ? "grab" : "pointer",
          opacity: isDragging ? 0.5 : 1,
          position: "relative",
          borderRadius: 0,
        }}
      >
        <Flex align="center" justify="between">
          <Flex align="center" gap="3" style={{ flex: 1, minWidth: 0 }}>
            <FrameThumbnail infoUrl={infoUrl} frame={frame} />
            <Code
              color="gray"
              size="2"
              style={{
                backgroundColor: "transparent",
              }}
            >
              {formatBounds(frame)}
            </Code>
          </Flex>
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "8px",
              transform: "translateY(-50%)",
              opacity: isHovered ? 1 : 0,
              pointerEvents: isHovered ? "auto" : "none",
              transition: "opacity 120ms ease",
            }}
          >
            <Button
              type="button"
              size="1"
              variant="ghost"
              color="red"
              onClick={handleDeleteClick}
              aria-label={`Delete frame ${frame.order}`}
            >
              Delete
            </Button>
          </div>
        </Flex>
      </Card>
    </li>
  );
}

interface FrameDropZoneProps {
  annotationOrder: string[];
  onFrameReorder?: (annotationIds: string[]) => void;
  targetAnnotationId: string | null;
  testId?: string;
}

function FrameDropZone({
  annotationOrder,
  onFrameReorder,
  targetAnnotationId,
  testId,
}: FrameDropZoneProps) {
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);

  useEffect(() => {
    if (!onFrameReorder) {
      return;
    }
    const element = dropZoneRef.current;
    if (!element) {
      return;
    }
    const cleanup = dropTargetForElements({
      element,
      getData: () => ({ type: "frame-dropzone", targetAnnotationId }),
      canDrop: ({ source }) => isFrameDragData(source.data),
      onDragEnter: ({ source }) => {
        if (isFrameDragData(source.data)) {
          setIsDropTarget(true);
        }
      },
      onDragLeave: () => {
        setIsDropTarget(false);
      },
      onDrop: ({ source }) => {
        if (!isFrameDragData(source.data)) {
          return;
        }
        const nextOrder = reorderAnnotationIds(
          annotationOrder,
          source.data.annotationId,
          targetAnnotationId,
        );
        if (nextOrder) {
          onFrameReorder(nextOrder);
        }
        setIsDropTarget(false);
      },
    });
    return () => {
      cleanup();
      setIsDropTarget(false);
    };
  }, [annotationOrder, onFrameReorder, targetAnnotationId]);

  return (
    <li aria-hidden="true">
      <div
        ref={dropZoneRef}
        data-testid={testId}
        style={{
          width: "100%",
          padding: `${isDropTarget ? 15 : 5}px 0`,
          transition: "padding 150ms ease",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "5px",
            borderRadius: 0,
            backgroundColor: isDropTarget ? "var(--accent-9)" : "transparent",
            transition: "background-color 120ms ease",
          }}
        />
      </div>
    </li>
  );
}
