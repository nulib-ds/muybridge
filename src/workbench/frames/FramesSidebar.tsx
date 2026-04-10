import {
  Button,
  Card,
  Code,
  Flex,
  ScrollArea,
  Separator,
  Slider,
  Text,
  TextField,
  VisuallyHidden,
} from "@radix-ui/themes";
import type { ChangeEvent, KeyboardEvent } from "react";
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

interface FramesSidebarProps {
  frames: FrameDescriptor[];
  infoUrl: string;
  durationSeconds: number;
  onDurationChange?: (duration: number) => void;
  onExportManifest?: () => void;
  canExportManifest?: boolean;
  onExportGif?: () => void;
  canExportGif?: boolean;
  isExportingGif?: boolean;
  gifError?: string | null;
  onClear?: () => void;
  onFrameHover?: (annotationId: string | null) => void;
  onFrameSelect?: (annotationId: string) => void;
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
  onExportGif,
  canExportGif,
  isExportingGif,
  gifError,
  onClear,
  onFrameHover,
  onFrameSelect,
  hoveredAnnotationId,
  selectedAnnotationId,
}: FramesSidebarProps) {
  const safeDurationSeconds = sanitizeDuration(durationSeconds);
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

  return (
    <Card
      variant="surface"
      size="3"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        borderRadius: 0,
      }}
    >
      <VisuallyHidden asChild>
        <span>Frame queue ({frames.length} items)</span>
      </VisuallyHidden>
      <Flex align="center" justify="between">
        <Text size="2" weight="medium">
          Frames ({frames.length})
        </Text>
        <Button type="button" variant="ghost" color="gray" onClick={onClear} disabled={!onClear}>
          Clear list
        </Button>
      </Flex>
      <ScrollArea style={{ flex: 1 }}>
        <Flex asChild direction="column" gap="2" pr="2">
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
                  <li key={frame.id}>
                    <Card
                      variant="surface"
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
                        cursor: "pointer",
                        borderLeft: `3px solid ${isSelected ? "var(--accent-10)" : "transparent"}`,
                        backgroundColor: isHovered ? "var(--gray-a2, rgba(0,0,0,0.04))" : undefined,
                      }}
                    >
                      <Flex gap="3" align="center">
                        <FrameThumbnail infoUrl={infoUrl} frame={frame} />
                        <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
                          <Text weight="medium">Frame {frame.order}</Text>
                          <Code color="gray">{formatBounds(frame)}</Code>
                        </Flex>
                      </Flex>
                    </Card>
                  </li>
                );
              })
            )}
          </ol>
        </Flex>
      </ScrollArea>
      <Separator size="4" />
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
          {gifError ? (
            <Text size="1" color="crimson">
              {gifError}
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </Card>
  );
}
