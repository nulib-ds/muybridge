import { Flex, Text } from "@radix-ui/themes";
import { useMemo } from "react";
import type { FrameDescriptor } from "./types";
import { getIiifImageServiceUrl } from "../../lib/iiif";

const THUMBNAIL_SIZE = 50;

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
    <Flex
      align="center"
      justify="center"
      style={{
        width: 50,
        height: 50,
        borderRadius: 6,
        backgroundColor: "var(--gray-a2, rgba(0,0,0,0.04))",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {source ? (
        <img
          src={source}
          alt={`Frame ${frame.order ?? "preview"}`}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Text size="1" color="gray" align="center">
          Preview unavailable
        </Text>
      )}
    </Flex>
  );
}
