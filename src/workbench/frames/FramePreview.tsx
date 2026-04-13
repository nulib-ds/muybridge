import { Text } from "@radix-ui/themes";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { FrameDescriptor } from "./types";
import { getIiifImageServiceUrl } from "../../lib/iiif";

const PREVIEW_STAGE_SIZE = 220;
const DEFAULT_FRAME_INTERVAL_MS = 600;

interface FramePreviewProps {
  infoUrl: string;
  frames: FrameDescriptor[];
  durationSeconds: number;
  activeAnnotationId?: string | null;
}

function formatPercent(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return (clamped * 100).toFixed(2);
}

export function FramePreview({
  infoUrl,
  frames,
  durationSeconds,
  activeAnnotationId,
}: FramePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageService = useMemo(() => getIiifImageServiceUrl(infoUrl), [infoUrl]);
  const frameSignature = useMemo(() => frames.map((frame) => frame.id).join("|"), [frames]);
  const frameIntervalMs = useMemo(() => {
    if (frames.length === 0 || durationSeconds <= 0) {
      return DEFAULT_FRAME_INTERVAL_MS;
    }
    const perFrameSeconds = durationSeconds / frames.length;
    const clampedSeconds = perFrameSeconds > 0 ? perFrameSeconds : durationSeconds;
    return Math.max(16, clampedSeconds * 1000);
  }, [durationSeconds, frames.length]);

  const previewSources = useMemo(() => {
    if (!imageService) {
      return [];
    }

    return frames.map((frame) => {
      const pctX = formatPercent(frame.bounds.x);
      const pctY = formatPercent(frame.bounds.y);
      const pctWidth = formatPercent(frame.bounds.width);
      const pctHeight = formatPercent(frame.bounds.height);
      const region = `pct:${pctX},${pctY},${pctWidth},${pctHeight}`;
      return `${imageService}/${region}/!${PREVIEW_STAGE_SIZE},${PREVIEW_STAGE_SIZE}/0/default.jpg`;
    });
  }, [frames, imageService]);

  const activeFrameIndex = useMemo(() => {
    if (!activeAnnotationId) {
      return -1;
    }
    return frames.findIndex((frame) => (frame.paneId || frame.id) === activeAnnotationId);
  }, [frames, activeAnnotationId]);

  const currentSource = previewSources[currentIndex] ?? null;
  const activeSource = activeFrameIndex >= 0 ? (previewSources[activeFrameIndex] ?? null) : null;
  const referenceFrame = useMemo(() => {
    if (activeFrameIndex >= 0) {
      return frames[activeFrameIndex];
    }
    return frames[0] ?? null;
  }, [frames, activeFrameIndex]);
  const aspectRatio = useMemo(() => {
    if (!referenceFrame || referenceFrame.bounds.height <= 0) {
      return 1;
    }
    const ratio = referenceFrame.bounds.width / referenceFrame.bounds.height;
    return Number.isFinite(ratio) && ratio > 0 ? Number(ratio.toFixed(3)) : 1;
  }, [referenceFrame]);
  const stageStyle = useMemo<CSSProperties>(
    () => ({
      width: "100%",
      maxHeight: 200,
      backgroundColor: "#000",
      padding: "12px",
      borderRadius: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      aspectRatio: aspectRatio > 0 ? String(aspectRatio) : undefined,
    }),
    [aspectRatio],
  );

  useEffect(() => {
    if (frames.length <= 1 || activeFrameIndex >= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((previous) => {
        const next = previous + 1;
        return next >= frames.length ? 0 : next;
      });
    }, frameIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [frames.length, frameSignature, frameIntervalMs, activeFrameIndex]);

  if (!frames.length) {
    return null;
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={stageStyle}>
        {(activeSource ?? currentSource) ? (
          <img
            src={(activeSource ?? currentSource) as string}
            alt="Frame preview"
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <Text color="gray" size="1">
            Preview unavailable
          </Text>
        )}
      </div>
    </div>
  );
}
