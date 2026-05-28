import React from "react";
// @ts-ignore — Viewer is provided by the Canopy runtime at build time
import {Viewer} from "@canopy-iiif/app/ui/server";

interface Props {
  manifestId: string;
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

const VIEWER_OPTIONS = {
  canvasHeight: "50vh",
  minHeight: "500px",
  canvasBackgroundColor: "#6661",
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.618rem",
        margin: "2rem 0",
      }}
    >
      <figure style={{margin: 0}}>
        <figcaption style={CAPTION_STYLE}>Animated Sequence</figcaption>
        <Viewer iiifContent={frames} options={VIEWER_OPTIONS} />
      </figure>
      <figure style={{margin: 0}}>
        <figcaption style={CAPTION_STYLE}>Original Plate</figcaption>
        <Viewer iiifContent={original} options={VIEWER_OPTIONS} />
      </figure>
    </div>
  );
}
