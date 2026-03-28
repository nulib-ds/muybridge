import type { ChangeEvent } from "react";
import type { FrameDescriptor } from "./types";
import { FramePreview } from "./FramePreview";

interface FramePreviewPanelProps {
  frames: FrameDescriptor[];
  infoUrl: string;
  durationSeconds: number;
  onDurationChange?: (duration: number) => void;
}

export function FramePreviewPanel({
  frames,
  infoUrl,
  durationSeconds,
  onDurationChange,
}: FramePreviewPanelProps) {
  const handleDurationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!onDurationChange) {
      return;
    }
    onDurationChange(Number.isFinite(value) ? value : 0);
  };

  return (
    <aside className="frame-preview-panel">
      <div className="panel-heading">
        <h2>Animation preview</h2>
        <span>{frames.length ? `${frames.length} frame(s)` : "No frames yet"}</span>
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
      {frames.length ? (
        <FramePreview infoUrl={infoUrl} frames={frames} durationSeconds={durationSeconds} />
      ) : (
        <p className="frame-preview-placeholder">Draw a rectangle to see the animation loop.</p>
      )}
    </aside>
  );
}
