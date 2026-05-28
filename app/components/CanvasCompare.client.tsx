import React, {useEffect, useState} from "react";
import CloverViewer from "@samvera/clover-iiif/viewer";
import CloverImage from "@samvera/clover-iiif/image";

interface Props {
  manifestId: string;
}

interface FrameAnnotation {
  startTime: number;
  endTime: number;
  pct: {x: number; y: number; w: number; h: number};
}

interface OriginalCanvasData {
  serviceId: string;
  width: number;
  height: number;
  label: string;
}

function deriveCanvasUrls(manifestId: string) {
  const base = manifestId.replace(/\/[^/]+$/, "");
  const slug = manifestId
    .split("/")
    .pop()!
    .replace(/\.json$/, "");
  return {
    frames: `${base}/canvas/${slug}-frames.json`,
    original: `${base}/canvas/${slug}-original.json`,
  };
}

function parsePct(url: string) {
  const match = url.match(/\/pct:([\d.]+),([\d.]+),([\d.]+),([\d.]+)\//);
  if (!match) return null;
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
    w: parseFloat(match[3]),
    h: parseFloat(match[4]),
  };
}

function parseTemporalStart(id: string): number | null {
  const match = id.match(/#t=([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

const VIEWER_OPTIONS = {
  canvasHeight: "50vh",
  canvasBackgroundColor: "#6661",
  showTitle: false,
  showIIIFBadge: false,
  informationPanel: {open: false, renderToggle: false},
  openSeadragon: {
    showNavigator: false,
  },
};

const CAPTION_STYLE: React.CSSProperties = {
  textTransform: "uppercase",
  color: "var(--color-gray-muted)",
  margin: 0,
  fontSize: ".7222rem",
  fontWeight: 400,
  marginBottom: "0.5rem",
};

export default function CanvasCompare({manifestId}: Props) {
  if (!manifestId) return null;
  const {frames, original} = deriveCanvasUrls(manifestId);

  const [contentState, setContentState] = useState<any>(null);
  const [frameAnnotations, setFrameAnnotations] = useState<FrameAnnotation[]>(
    [],
  );
  const [originalCanvas, setOriginalCanvas] =
    useState<OriginalCanvasData | null>(null);
  const [activeAnnotation, setActiveAnnotation] = useState<object | null>(null);

  useEffect(() => {
    fetch(frames)
      .then((r) => r.json())
      .then((canvas) => {
        const anns: FrameAnnotation[] = canvas.items[0].items.map((a: any) => {
          const pct = parsePct(a.body.id);
          const tMatch = a.target.match(/#t=([\d.]+),([\d.]+)/);
          return {
            startTime: tMatch ? parseFloat(tMatch[1]) : 0,
            endTime: tMatch ? parseFloat(tMatch[2]) : 0,
            pct: pct ?? {x: 0, y: 0, w: 100, h: 100},
          };
        });
        setFrameAnnotations(anns);
      })
      .catch(() => {});

    fetch(original)
      .then((r) => r.json())
      .then((canvas) => {
        const body = canvas.items[0].items[0].body;
        const serviceId =
          body.service?.[0]?.id ?? body.id.replace(/\/full\/.*$/, "");
        setOriginalCanvas({
          serviceId,
          width: canvas.width,
          height: canvas.height,
          label: canvas.label?.en?.[0] ?? "",
        });
      })
      .catch(() => {});
  }, [frames, original]);

  return (
    <div style={{margin: "2rem 0"}}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.618rem",
        }}
      >
        <figure style={{margin: 0}}>
          <figcaption style={CAPTION_STYLE}>Animated Sequence</figcaption>
          <CloverViewer
            iiifContent={frames}
            options={VIEWER_OPTIONS}
            contentStateCallback={setContentState}
          />
        </figure>
        <figure style={{margin: 0}}>
          <figcaption style={CAPTION_STYLE}>Original Plate</figcaption>
          <CloverViewer iiifContent={original} options={VIEWER_OPTIONS} />
        </figure>
      </div>
    </div>
  );
}
