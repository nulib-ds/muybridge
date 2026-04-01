import type { FrameDescriptor } from "./types";
import { FrameThumbnail } from "./FrameThumbnail";

interface FramesSidebarProps {
  frames: FrameDescriptor[];
  infoUrl: string;
  onClear?: () => void;
}

function formatBounds(frame: FrameDescriptor) {
  return `${frame.bounds.x.toFixed(2)}, ${frame.bounds.y.toFixed(2)} / ${frame.bounds.width.toFixed(2)}, ${frame.bounds.height.toFixed(2)}`;
}

export function FramesSidebar({ frames, infoUrl, onClear }: FramesSidebarProps) {
  return (
    <aside className="frames-panel">
      <div className="panel-heading">
        <h2>Frame queue</h2>
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
    </aside>
  );
}
