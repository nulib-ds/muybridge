import type { FrameDescriptor } from "./types";
import type { ImageDimensions } from "../../annotations/annotation-utils";
import { getIiifImageServiceUrl, sanitizeIiifUrl } from "../../lib/iiif";

const PRESENTATION_CONTEXT = "https://iiif.io/api/presentation/3/context.json";

type LanguageMap = Record<string, string[]>;

interface ManifestBuildOptions {
  infoUrl: string;
  frames: FrameDescriptor[];
  dimensions: ImageDimensions | null;
  durationSeconds: number;
  label?: string;
  manifestId?: string;
  thumbnailUrl?: string;
  plateNumber?: string;
  provider?: string;
  animal?: string;
  movement?: string;
}

interface IiifThumbnail {
  id: string;
  type: "Image";
  format: "image/gif";
}

interface IiifMetadataEntry {
  label: LanguageMap;
  value: LanguageMap;
}

export interface IiifManifest {
  "@context": string;
  id: string;
  type: "Manifest";
  label: LanguageMap;
  behavior?: ["repeat", "auto-advance"];
  metadata?: IiifMetadataEntry[];
  thumbnail?: IiifThumbnail[];
  items: IiifCanvas[];
}

interface IiifCanvas {
  id: string;
  type: "Canvas";
  label: LanguageMap;
  height: number;
  width: number;
  duration?: number;
  placeholderCanvas?: IiifPlaceholderCanvas;
  items: [IiifAnnotationPage];
}

interface IiifAnnotationPage {
  id: string;
  type: "AnnotationPage";
  items: IiifAnnotation[];
}

interface IiifAnnotation {
  id: string;
  type: "Annotation";
  motivation: "painting";
  label?: LanguageMap;
  body: IiifBody;
  target: string;
}

interface IiifBody {
  id: string;
  type: "Image";
  format: "image/jpeg" | "image/gif";
  height: number;
  width: number;
  service?: [IiifImageService];
}

interface IiifPlaceholderCanvas {
  id: string;
  type: "Canvas";
  width: number;
  height: number;
  items: [{
    id: string;
    type: "AnnotationPage";
    items: [{
      id: string;
      type: "Annotation";
      motivation: "painting";
      body: { id: string; type: "Image"; format: string; width: number; height: number };
      target: string;
    }];
  }];
}

interface IiifImageService {
  id: string;
  type: "ImageService2";
  profile: "level2";
}


function toLanguageMap(value: string | undefined, fallback: string): LanguageMap {
  const label = value?.trim() || fallback;
  return { en: [label] };
}

function formatPercent(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  return (clamped * 100).toFixed(4);
}

function toTemporalValue(value: number): number {
  return Number(value.toFixed(3));
}

function createUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `uuid-${Math.random().toString(36).slice(2)}`;
}

function buildAnnotationId(base: string, index: number) {
  return `${base}/annotation/${index + 1}`;
}

export function buildManifestFromFrames({
  infoUrl,
  frames,
  dimensions,
  durationSeconds,
  label,
  manifestId: explicitManifestId,
  thumbnailUrl,
  plateNumber,
  provider,
  animal,
  movement,
}: ManifestBuildOptions): IiifManifest | null {
  if (!frames.length || !dimensions) {
    return null;
  }

  const sanitized = sanitizeIiifUrl(infoUrl);
  const imageService = getIiifImageServiceUrl(sanitized);
  if (!imageService) {
    return null;
  }

  const firstFrame = frames[0];
  const baseWidth = Math.round(firstFrame.bounds.width * dimensions.width);
  const baseHeight = Math.round(firstFrame.bounds.height * dimensions.height);
  if (!baseWidth || !baseHeight) {
    return null;
  }

  const safeDuration = durationSeconds > 0 ? durationSeconds : frames.length;
  const totalDuration = toTemporalValue(safeDuration);
  const frameDuration = frames.length ? safeDuration / frames.length : safeDuration;
  const manifestId = explicitManifestId ?? `urn:uuid:${createUuid()}`;
  const slug = manifestId.split("/").pop()!.replace(/\.json$/, "");
  const iiifBase = manifestId.replace(/\/[^/]+$/, "");
  const animationCanvasId = `${iiifBase}/canvas/${slug}-frames.json`;
  const staticCanvasId = `${iiifBase}/canvas/${slug}-original.json`;

  const animationPageId = `${animationCanvasId}/page/1`;
  const annotations: IiifAnnotation[] = frames.map((frame, index) => {
    const regionX = formatPercent(frame.bounds.x);
    const regionY = formatPercent(frame.bounds.y);
    const regionWidth = formatPercent(frame.bounds.width);
    const regionHeight = formatPercent(frame.bounds.height);
    const annotationWidth = Math.round(frame.bounds.width * dimensions.width);
    const annotationHeight = Math.round(frame.bounds.height * dimensions.height);
    const regionResource = `${imageService}/pct:${regionX},${regionY},${regionWidth},${regionHeight}/full/0/default.jpg`;
    const startTime = toTemporalValue(index * frameDuration);
    const endTime = toTemporalValue((index + 1) * frameDuration);
    return {
      id: buildAnnotationId(animationPageId, index),
      type: "Annotation",
      motivation: "painting",
      label: { en: [`${index + 1}`] },
      body: {
        id: regionResource,
        type: "Image",
        format: "image/jpeg",
        height: annotationHeight,
        width: annotationWidth,
      },
      target: `${animationCanvasId}#t=${startTime},${endTime}`,
    };
  });

  const animationPlaceholder: IiifPlaceholderCanvas | undefined = thumbnailUrl
    ? {
        id: `${animationCanvasId}/placeholder`,
        type: "Canvas",
        width: baseWidth,
        height: baseHeight,
        items: [
          {
            id: `${animationCanvasId}/placeholder/page/1`,
            type: "AnnotationPage",
            items: [
              {
                id: `${animationCanvasId}/placeholder/page/1/annotation/1`,
                type: "Annotation",
                motivation: "painting",
                body: { id: thumbnailUrl, type: "Image", format: "image/gif", width: baseWidth, height: baseHeight },
                target: `${animationCanvasId}/placeholder`,
              },
            ],
          },
        ],
      }
    : undefined;

  const animationCanvas: IiifCanvas = {
    id: animationCanvasId,
    type: "Canvas",
    label: toLanguageMap(label, "Animated sequence"),
    height: baseHeight,
    width: baseWidth,
    duration: totalDuration,
    ...(animationPlaceholder && { placeholderCanvas: animationPlaceholder }),
    items: [
      {
        id: animationPageId,
        type: "AnnotationPage",
        items: annotations,
      },
    ],
  };

  const staticAnnotation: IiifAnnotation = {
    id: `${staticCanvasId}/page/1/annotation/1`,
    type: "Annotation",
    motivation: "painting",
    body: {
      id: `${imageService}/full/full/0/default.jpg`,
      type: "Image",
      format: "image/jpeg",
      height: dimensions.height,
      width: dimensions.width,
      service: [
        {
          id: imageService,
          type: "ImageService2",
          profile: "level2",
        },
      ],
    },
    target: staticCanvasId,
  };

  const PLACEHOLDER_MAX_WIDTH = 800;
  const placeholderWidth = Math.min(PLACEHOLDER_MAX_WIDTH, dimensions.width);
  const placeholderHeight = Math.round(placeholderWidth * dimensions.height / dimensions.width);
  const placeholderImageUrl = dimensions.width > PLACEHOLDER_MAX_WIDTH
    ? `${imageService}/full/${PLACEHOLDER_MAX_WIDTH},/0/default.jpg`
    : `${imageService}/full/full/0/default.jpg`;

  const staticPlaceholder: IiifPlaceholderCanvas = {
    id: `${staticCanvasId}/placeholder`,
    type: "Canvas",
    width: placeholderWidth,
    height: placeholderHeight,
    items: [
      {
        id: `${staticCanvasId}/placeholder/page/1`,
        type: "AnnotationPage",
        items: [
          {
            id: `${staticCanvasId}/placeholder/page/1/annotation/1`,
            type: "Annotation",
            motivation: "painting",
            body: { id: placeholderImageUrl, type: "Image", format: "image/jpeg", width: placeholderWidth, height: placeholderHeight },
            target: `${staticCanvasId}/placeholder`,
          },
        ],
      },
    ],
  };

  const staticCanvas: IiifCanvas = {
    id: staticCanvasId,
    type: "Canvas",
    label: toLanguageMap(label, "Plate reference"),
    height: dimensions.height,
    width: dimensions.width,
    placeholderCanvas: staticPlaceholder,
    items: [
      {
        id: `${staticCanvasId}/page/1`,
        type: "AnnotationPage",
        items: [staticAnnotation],
      },
    ],
  };

  const splitValues = (raw: string) =>
    raw.split(",").map((s) => s.trim()).filter(Boolean);

  const metadata: IiifMetadataEntry[] = [
    { label: { en: ["Date"] }, value: { en: ["1887"] } },
    ...(plateNumber ? [{ label: { en: ["Plate Number"] }, value: { en: [plateNumber] } }] : []),
    { label: { en: ["Frames"] }, value: { en: [String(frames.length)] } },
    ...(provider?.trim() ? [{ label: { en: ["Provider"] }, value: { en: [provider.trim()] } }] : []),
    ...(animal?.trim() ? [{ label: { en: ["Animal"] }, value: { en: splitValues(animal) } }] : []),
    ...(movement?.trim() ? [{ label: { en: ["Movement"] }, value: { en: splitValues(movement) } }] : []),
  ];

  const manifest: IiifManifest = {
    "@context": PRESENTATION_CONTEXT,
    id: manifestId,
    type: "Manifest",
    label: toLanguageMap(label, "Muybridge plate sequence"),
    behavior: ["repeat", "auto-advance"],
    metadata,
    ...(thumbnailUrl && {
      thumbnail: [{ id: thumbnailUrl, type: "Image", format: "image/gif" }],
    }),
    items: [animationCanvas, staticCanvas],
  };


  return manifest;
}
