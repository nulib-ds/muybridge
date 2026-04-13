import { Flex, Inset, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import type { FrameDescriptor } from "./types";
import { getIiifImageServiceUrl } from "../../lib/iiif";

const THUMBNAIL_SIZE = 100;

interface FrameThumbnailProps {
  frame: FrameDescriptor;
  infoUrl: string;
}

function formatPercent(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return (clamped * 100).toFixed(2);
}

export function FrameThumbnail({ frame, infoUrl }: FrameThumbnailProps) {
  const imageService = useMemo(() => getIiifImageServiceUrl(infoUrl), [infoUrl]);
  const source = useMemo(() => {
    if (!imageService) {
      return null;
    }

    const pctX = formatPercent(frame.bounds.x);
    const pctY = formatPercent(frame.bounds.y);
    const pctWidth = formatPercent(frame.bounds.width);
    const pctHeight = formatPercent(frame.bounds.height);
    return `${imageService}/pct:${pctX},${pctY},${pctWidth},${pctHeight}/!${THUMBNAIL_SIZE},${THUMBNAIL_SIZE}/0/default.jpg`;
  }, [frame, imageService]);

  return (
    <Inset
      clip="padding-box"
      side="left"
      pr="current"
      style={{ width: "50px", height: "50px", backgroundColor: "var(--gray-12)" }}
    >
      <img
        src={
          source || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        }
        alt={`Frame ${frame.order ?? "preview"}`}
        loading="lazy"
        style={{ display: "block", objectFit: "cover", width: 50, height: "100%" }}
      />
    </Inset>
  );
}
