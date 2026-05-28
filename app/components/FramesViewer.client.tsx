import React, {useState} from "react";
import CloverViewer from "@samvera/clover-iiif/viewer";

interface Props {
  manifestId: string;
}

function framesUrl(manifestId: string) {
  const base = manifestId.replace(/\/[^/]+$/, "");
  const slug = manifestId.split("/").pop()!.replace(/\.json$/, "");
  return `${base}/canvas/${slug}-frames.json`;
}

const VIEWER_OPTIONS = {
  canvasHeight: "50vh",
  canvasBackgroundColor: "#6661",
  showTitle: false,
  showIIIFBadge: false,
  informationPanel: {open: false, renderToggle: false},
};

export default function FramesViewer({manifestId}: Props) {
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);

  return (
    <>
      <CloverViewer
        iiifContent={framesUrl(manifestId)}
        options={VIEWER_OPTIONS}
        canvasIdCallback={setActiveCanvasId}
      />
      {activeCanvasId && (
        <pre
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem 1rem",
            background: "var(--color-gray-100)",
            borderRadius: "4px",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono, monospace)",
            overflowX: "auto",
            color: "var(--color-gray-800)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          <code>{activeCanvasId}</code>
        </pre>
      )}
    </>
  );
}
