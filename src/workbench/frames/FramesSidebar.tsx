import { Button, Card, Code, Flex, Text, TextField } from "@radix-ui/themes";
import type { ChangeEvent } from "react";
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
  onClear?: () => void;
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
  onClear,
}: FramesSidebarProps) {
  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!onDurationChange) {
      return;
    }
    onDurationChange(Number.isFinite(value) ? value : 0);
  };
  const frameSequenceKey = frames.map((frame) => frame.id).join("|");
  const previewKey = `${infoUrl}-${frameSequenceKey}-${durationSeconds}`;

  return (
    <aside className="frames-panel">
      <div className="panel-heading" role="region" aria-label="Frame queue">
        <span>{frames.length} items</span>
      </div>
      <Flex
        className="frame-panel-actions"
        align="center"
        justify="between"
        wrap="wrap"
        gap="3"
      >
        <Text size="2" weight="medium">
          Frame queue ({frames.length})
        </Text>
        <Button type="button" variant="ghost" color="gray" onClick={onClear} disabled={!onClear}>
          Clear list
        </Button>
      </Flex>
      <ol className="frame-list">
        {frames.length === 0 ? (
          <li className="frame-placeholder">
            <Text color="gray">
              No frames yet — draw a rectangle to get started.
            </Text>
          </li>
        ) : (
          frames.map((frame) => (
            <li key={frame.id}>
              <Card variant="surface" size="1">
                <Flex gap="3" align="center">
                  <FrameThumbnail infoUrl={infoUrl} frame={frame} />
                  <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
                    <Text weight="medium">Frame {frame.order}</Text>
                    <Code color="gray">{formatBounds(frame)}</Code>
                  </Flex>
                </Flex>
              </Card>
            </li>
          ))
        )}
      </ol>
      <div className="frame-preview-panel">
        <div role="region" aria-label="Animation preview">
          {frames.length ? (
            <FramePreview
              key={previewKey}
              infoUrl={infoUrl}
              frames={frames}
              durationSeconds={durationSeconds}
            />
          ) : (
            <Text color="gray">Draw a rectangle to see the animation loop.</Text>
          )}
        </div>
        <Flex direction="column" gap="2">
          <Text asChild size="2" weight="medium">
            <label htmlFor="animationDuration">Duration (seconds)</label>
          </Text>
          <TextField.Root
            id="animationDuration"
            type="number"
            min="0.1"
            step="0.1"
            inputMode="decimal"
            value={durationSeconds}
            onChange={handleDurationChange}
            style={{ width: "100%" }}
          />
        </Flex>
        <Button
          type="button"
          onClick={onExportManifest}
          disabled={!onExportManifest || !canExportManifest}
        >
          Export IIIF manifest
        </Button>
      </div>
    </aside>
  );
}
