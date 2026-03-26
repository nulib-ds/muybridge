import type { FrameDescriptor } from "./types";

interface FramesSidebarProps {
  frames: FrameDescriptor[];
  onAddMockFrame?: () => void;
  onClear?: () => void;
}

export function FramesSidebar({ frames, onAddMockFrame, onClear }: FramesSidebarProps) {
  return (
    <aside className="frames-panel">
      <div className="panel-heading">
        <h2>Frame queue</h2>
        <span>{frames.length} items</span>
      </div>
      <div className="frame-panel-actions">
        <button type="button" onClick={onAddMockFrame} disabled={!onAddMockFrame}>
          Add placeholder frame
        </button>
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
              <span>{frame.paneId}</span>
              <code>
                {frame.bounds.x.toFixed(2)}, {frame.bounds.y.toFixed(2)} /{" "}
                {frame.bounds.width.toFixed(2)},{frame.bounds.height.toFixed(2)}
              </code>
            </li>
          ))
        )}
      </ol>
    </aside>
  );
}
