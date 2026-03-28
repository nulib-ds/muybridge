import { useEffect, useMemo, useState } from "react";
import type { FrameDescriptor } from "./types";
import { getIiifImageServiceUrl } from "../../lib/iiif";

const PREVIEW_STAGE_SIZE = 220;
const DEFAULT_FRAME_INTERVAL_MS = 600;

interface FramePreviewProps {
  infoUrl: string;
  frames: FrameDescriptor[];
  durationSeconds: number;
}

function formatPercent(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return (clamped * 100).toFixed(2);
}

export function FramePreview({ infoUrl, frames, durationSeconds }: FramePreviewProps) {
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

  const currentFrame = frames[currentIndex] ?? null;
  const currentSource = previewSources[currentIndex] ?? null;
  const aspectRatio = useMemo(() => {
    if (!currentFrame || currentFrame.bounds.height <= 0) {
      return 1;
    }
    const ratio = currentFrame.bounds.width / currentFrame.bounds.height;
    return Number.isFinite(ratio) && ratio > 0 ? Number(ratio.toFixed(3)) : 1;
  }, [currentFrame]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [frameSignature, imageService, durationSeconds]);

  useEffect(() => {
    if (frames.length <= 1) {
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
  }, [frames.length, frameSignature, frameIntervalMs]);

  if (!frames.length) {
    return null;
  }

  return (
    <div className="frame-group-preview">
      <div className="frame-preview-stage" style={{ aspectRatio }}>
        {currentSource ? (
          <img src={currentSource} alt="Frame preview" loading="lazy" />
        ) : (
          <span className="frame-preview-placeholder">Preview unavailable</span>
        )}
      </div>
    </div>
  );
}
