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
}

export interface IiifManifest {
  "@context": string;
  id: string;
  type: "Manifest";
  label: LanguageMap;
  items: IiifCanvas[];
}

interface IiifCanvas {
  id: string;
  type: "Canvas";
  label: LanguageMap;
  height: number;
  width: number;
  duration?: number;
  behavior?: ["auto-advance", "repeat"];
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
  body: IiifBody;
  target: string;
}

interface IiifBody {
  id: string;
  type: "Image";
  format: "image/jpeg";
  height: number;
  width: number;
  service: [IiifImageService];
  selector?: IiifSelector;
}

interface IiifImageService {
  id: string;
  type: "ImageService2";
  profile: "level2";
}

interface IiifSelector {
  type: "FragmentSelector";
  conformsTo: "http://www.w3.org/TR/media-frags/";
  value: string;
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
  const manifestId = `urn:uuid:${createUuid()}`;
  const animationCanvasId = `${manifestId}/canvas/animation`;
  const staticCanvasId = `${manifestId}/canvas/static`;

  const animationPageId = `${animationCanvasId}/page/1`;
  const annotations: IiifAnnotation[] = frames.map((frame, index) => {
    const regionX = formatPercent(frame.bounds.x);
    const regionY = formatPercent(frame.bounds.y);
    const regionWidth = formatPercent(frame.bounds.width);
    const regionHeight = formatPercent(frame.bounds.height);
    const annotationWidth = Math.round(frame.bounds.width * dimensions.width);
    const annotationHeight = Math.round(frame.bounds.height * dimensions.height);
    const selector: IiifSelector = {
      type: "FragmentSelector",
      conformsTo: "http://www.w3.org/TR/media-frags/",
      value: `xywh=pct:${regionX},${regionY},${regionWidth},${regionHeight}`,
    };
    const regionResource = `${imageService}/pct:${regionX},${regionY},${regionWidth},${regionHeight}/full/0/default.jpg`;
    const startTime = toTemporalValue(index * frameDuration);
    const endTime = toTemporalValue((index + 1) * frameDuration);
    return {
      id: buildAnnotationId(animationPageId, index),
      type: "Annotation",
      motivation: "painting",
      body: {
        id: regionResource,
        type: "Image",
        format: "image/jpeg",
        height: annotationHeight,
        width: annotationWidth,
        selector,
        service: [
          {
            id: imageService,
            type: "ImageService2",
            profile: "level2",
          },
        ],
      },
      target: `${animationCanvasId}#t=${startTime},${endTime}`,
    };
  });

  const animationCanvas: IiifCanvas = {
    id: animationCanvasId,
    type: "Canvas",
    label: toLanguageMap(label, "Animated sequence"),
    height: baseHeight,
    width: baseWidth,
    duration: totalDuration,
    behavior: ["auto-advance", "repeat"],
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

  const staticCanvas: IiifCanvas = {
    id: staticCanvasId,
    type: "Canvas",
    label: toLanguageMap(label, "Plate reference"),
    height: dimensions.height,
    width: dimensions.width,
    items: [
      {
        id: `${staticCanvasId}/page/1`,
        type: "AnnotationPage",
        items: [staticAnnotation],
      },
    ],
  };

  const manifest: IiifManifest = {
    "@context": PRESENTATION_CONTEXT,
    id: manifestId,
    type: "Manifest",
    label: toLanguageMap(label, "Muybridge plate sequence"),
    items: [animationCanvas, staticCanvas],
  };


  return manifest;
}
