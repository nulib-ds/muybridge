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

  return (
    <aside className="frames-panel">
      <div className="panel-heading" role="region" aria-label="Frame queue">
        <span>{frames.length} items</span>
      </div>
      <div className="frame-panel-actions">
        <button type="button" onClick={onClear} disabled={!onClear}>
          Clear list
        </button>
      </div>
      <ol className="frame-list">
        {frames.length === 0 ? (
          <li className="frame-placeholder">No frames yet — draw a rectangle to get started.</li>
        ) : (
          frames.map((frame) => (
            <li key={frame.id}>
              <FrameThumbnail infoUrl={infoUrl} frame={frame} />
              <div className="frame-metadata">
                <div className="frame-meta-heading">
                  <strong>Frame {frame.order}</strong>
                </div>
                <code className="frame-meta-bounds">{formatBounds(frame)}</code>
              </div>
            </li>
          ))
        )}
      </ol>
      <div className="frame-preview-panel">
        <div role="region" aria-label="Animation preview">
          {frames.length ? (
            <FramePreview infoUrl={infoUrl} frames={frames} durationSeconds={durationSeconds} />
          ) : (
            <p className="frame-preview-placeholder">Draw a rectangle to see the animation loop.</p>
          )}
        </div>
        <label className="animation-duration-field" htmlFor="animationDuration">
          <span>Duration (seconds)</span>
          <input
            id="animationDuration"
            type="number"
            min="0.1"
            step="0.1"
            inputMode="decimal"
            value={durationSeconds}
            onChange={handleDurationChange}
          />
        </label>
        <button
          type="button"
          onClick={onExportManifest}
          disabled={!onExportManifest || !canExportManifest}
          className="manifest-export-button"
        >
          Export IIIF manifest
        </button>
      </div>
    </aside>
  );
}
