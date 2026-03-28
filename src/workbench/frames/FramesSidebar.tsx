import { useMemo } from "react";
import type { FrameDescriptor } from "./types";
import { FramePreview } from "./FramePreview";

interface FramesSidebarProps {
  frames: FrameDescriptor[];
  infoUrl: string;
  onClear?: () => void;
}

interface FrameGroup {
  paneId: string;
  frames: FrameDescriptor[];
}

function formatBounds(frame: FrameDescriptor) {
  return `${frame.bounds.x.toFixed(2)}, ${frame.bounds.y.toFixed(2)} / ${frame.bounds.width.toFixed(2)}, ${frame.bounds.height.toFixed(2)}`;
}

export function FramesSidebar({ frames, infoUrl, onClear }: FramesSidebarProps) {
  const frameGroups = useMemo<FrameGroup[]>(() => {
    if (!frames.length) {
      return [];
    }

    const groups = new Map<string, FrameDescriptor[]>();
    frames.forEach((frame) => {
      const key = frame.paneId || frame.id;
      const list = groups.get(key);
      if (list) {
        list.push(frame);
      } else {
        groups.set(key, [frame]);
      }
    });

    return Array.from(groups.entries()).map(([paneId, groupFrames]) => ({
      paneId,
      frames: [...groupFrames].sort((a, b) => a.order - b.order),
    }));
  }, [frames]);

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
        {frameGroups.length === 0 ? (
          <li className="frame-placeholder">No frames yet — draw a rectangle to get started.</li>
        ) : (
          frameGroups.map((group) => (
            <li key={group.paneId}>
              <div>
                <strong>{group.paneId}</strong>
                <span>{group.frames.length} frame(s)</span>
              </div>
              <FramePreview infoUrl={infoUrl} frames={group.frames} />
              <div className="frame-group-rows">
                {group.frames.map((frame) => (
                  <div key={frame.id} className="frame-row">
                    <span>#{frame.order}</span>
                    <code>{formatBounds(frame)}</code>
                  </div>
                ))}
              </div>
            </li>
          ))
        )}
      </ol>
    </aside>
  );
}
