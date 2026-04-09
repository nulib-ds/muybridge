import { GIFEncoder, applyPalette, quantize } from "gifenc";
import type { ImageDimensions } from "../../annotations/annotation-utils";
import { getIiifImageServiceUrl, sanitizeIiifUrl } from "../../lib/iiif";
import type { FrameDescriptor } from "./types";

const MAX_GIF_EDGE_PX = 500;
const MIN_FRAME_DELAY_MS = 20;

export interface GifExportOptions {
  infoUrl: string;
  frames: FrameDescriptor[];
  dimensions: ImageDimensions | null;
  durationSeconds: number;
  maxSize?: number;
  signal?: AbortSignal;
}

export interface GifExportResult {
  blob: Blob;
  width: number;
  height: number;
  frameCount: number;
  durationMs: number;
}

interface FramePixelSize {
  width: number;
  height: number;
}

interface GifRenderPlan {
  renderWidth: number;
  renderHeight: number;
  scale: number;
  frameSizes: FramePixelSize[];
}

function clampSize(value: number | undefined) {
  if (!Number.isFinite(value) || !value) {
    return MAX_GIF_EDGE_PX;
  }
  return Math.max(1, Math.min(MAX_GIF_EDGE_PX, Math.round(value)));
}

function toPercent(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return (clamped * 100).toFixed(4);
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("GIF export aborted", "AbortError");
  }
}

function getFramePixelSize(frame: FrameDescriptor, dimensions: ImageDimensions) {
  return {
    width: Math.max(1, Math.round(frame.bounds.width * dimensions.width)),
    height: Math.max(1, Math.round(frame.bounds.height * dimensions.height)),
  };
}

export function planGifRender(
  frames: FrameDescriptor[],
  dimensions: ImageDimensions,
  maxEdge?: number,
): GifRenderPlan {
  if (!frames.length) {
    throw new Error("Cannot plan GIF export without frames");
  }
  const frameSizes = frames.map((frame) => getFramePixelSize(frame, dimensions));
  const widestFrame = frameSizes.reduce((max, size) => Math.max(max, size.width), 0);
  const tallestFrame = frameSizes.reduce((max, size) => Math.max(max, size.height), 0);
  if (!widestFrame || !tallestFrame) {
    throw new Error("Frame bounds produced zero-sized output");
  }
  const safeEdge = clampSize(maxEdge);
  const longestSide = Math.max(widestFrame, tallestFrame);
  const scale = longestSide > 0 ? Math.min(1, safeEdge / longestSide) : 1;
  const renderWidth = Math.max(1, Math.round(widestFrame * scale));
  const renderHeight = Math.max(1, Math.round(tallestFrame * scale));
  const scaledFrameSizes = frameSizes.map((size) => ({
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  }));

  return {
    renderWidth,
    renderHeight,
    scale,
    frameSizes: scaledFrameSizes,
  };
}

function buildRegion(bounds: FrameDescriptor["bounds"]) {
  const pctX = toPercent(bounds.x);
  const pctY = toPercent(bounds.y);
  const pctWidth = toPercent(bounds.width);
  const pctHeight = toPercent(bounds.height);
  return `pct:${pctX},${pctY},${pctWidth},${pctHeight}`;
}

async function decodeImageSource(blob: Blob): Promise<CanvasImageSource> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(blob);
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      const error = event instanceof ErrorEvent ? event.error : null;
      reject(error ?? new Error("Failed to decode frame image"));
    };
    image.src = url;
  });
}

function disposeImageSource(source: CanvasImageSource) {
  if ("close" in source && typeof (source as { close?: () => void }).close === "function") {
    (source as { close: () => void }).close();
  }
}

export async function encodeGifFromFrames(options: GifExportOptions): Promise<GifExportResult> {
  const { infoUrl, frames, dimensions, durationSeconds, maxSize, signal } = options;
  if (!frames.length || !dimensions) {
    throw new Error("Frames and image dimensions are required for GIF export");
  }

  const sanitized = sanitizeIiifUrl(infoUrl);
  const imageService = getIiifImageServiceUrl(sanitized);
  if (!imageService) {
    throw new Error("Unable to derive IIIF image service from info.json URL");
  }

  const plan = planGifRender(frames, dimensions, maxSize);
  const { renderWidth, renderHeight, frameSizes } = plan;
  const canvas = document.createElement("canvas");
  canvas.width = renderWidth;
  canvas.height = renderHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas 2D context unavailable for GIF encoding");
  }

  const safeDurationSeconds = durationSeconds > 0 ? durationSeconds : frames.length;
  const frameDelayMs = frames.length
    ? Math.max(MIN_FRAME_DELAY_MS, (safeDurationSeconds / frames.length) * 1000)
    : MIN_FRAME_DELAY_MS;
  const encoder = GIFEncoder();

  for (let index = 0; index < frames.length; index += 1) {
    throwIfAborted(signal);
    const frame = frames[index];
    const targetSize = frameSizes[index];
    const region = buildRegion(frame.bounds);
    const requestUrl = `${imageService}/${region}/!${targetSize.width},${targetSize.height}/0/default.jpg`;
    const response = await fetch(requestUrl, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch frame ${index + 1}: ${response.status}`);
    }
    const blob = await response.blob();
    const source = await decodeImageSource(blob);
    context.clearRect(0, 0, renderWidth, renderHeight);
    context.fillStyle = "#000";
    context.fillRect(0, 0, renderWidth, renderHeight);
    const drawWidth = Math.min(targetSize.width, renderWidth);
    const drawHeight = Math.min(targetSize.height, renderHeight);
    const offsetX = Math.floor((renderWidth - drawWidth) / 2);
    const offsetY = Math.floor((renderHeight - drawHeight) / 2);
    context.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
    disposeImageSource(source);
    const imageData = context.getImageData(0, 0, renderWidth, renderHeight);
    const palette = quantize(imageData.data, 256);
    const indexBitmap = applyPalette(imageData.data, palette);
    encoder.writeFrame(indexBitmap, renderWidth, renderHeight, {
      palette,
      delay: Math.round(frameDelayMs),
      repeat: index === 0 ? 0 : undefined,
    });
  }

  encoder.finish();
  const bytes = encoder.bytes();
  const blob = new Blob([bytes], { type: "image/gif" });
  return {
    blob,
    width: renderWidth,
    height: renderHeight,
    frameCount: frames.length,
    durationMs: Math.round(frameDelayMs * frames.length),
  };
}
