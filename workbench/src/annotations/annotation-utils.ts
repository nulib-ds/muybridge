import type { FragmentSelector, ImageAnnotation } from "@annotorious/annotorious";
import type { FrameInput } from "../workbench/frames/types";

export interface ImageDimensions {
  width: number;
  height: number;
}

function getFirstTarget(annotation: ImageAnnotation) {
  if (!annotation.target) {
    return null;
  }

  return Array.isArray(annotation.target) ? annotation.target[0] : annotation.target;
}

function getFragmentSelector(annotation: ImageAnnotation): FragmentSelector | null {
  const target = getFirstTarget(annotation);
  if (!target || typeof target === "string") {
    return null;
  }

  const selector = Array.isArray(target.selector) ? target.selector[0] : target.selector;
  if (!selector || selector.type !== "FragmentSelector") {
    return null;
  }

  return selector;
}

export function getAnnotationPixelBounds(annotation: ImageAnnotation) {
  return getGeometrySelectorBounds(annotation);
}

function getGeometrySelectorBounds(annotation: ImageAnnotation) {
  const target = getFirstTarget(annotation);
  if (!target || typeof target === "string") {
    return null;
  }

  const descriptor = Array.isArray(target.selector) ? target.selector[0] : target.selector;
  if (!descriptor || typeof descriptor !== "object") {
    return null;
  }

  const geometry = (descriptor as { geometry?: { bounds?: { minX: number; minY: number; maxX: number; maxY: number } } }).geometry;
  const bounds = geometry?.bounds;
  if (!bounds) {
    return null;
  }

  const { minX, minY, maxX, maxY } = bounds;
  if ([minX, minY, maxX, maxY].some((value) => typeof value !== "number")) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function parseFragmentValue(value: string) {
  const [, fragmentValue] = value.split("=");
  const normalizedValue = fragmentValue ?? value;
  const [unitCandidate, coordsCandidate] = normalizedValue.split(":");

  if (!coordsCandidate) {
    const numbers = unitCandidate.split(",").map(Number);
    return { unit: "pixel", numbers } as const;
  }

  return { unit: unitCandidate, numbers: coordsCandidate.split(",").map(Number) } as const;
}

function normalizeBounds(numbers: number[], unit: string, dimensions: ImageDimensions) {
  if (numbers.length < 4 || dimensions.width === 0 || dimensions.height === 0) {
    return null;
  }

  const [x, y, width, height] = numbers;
  const safeUnit = unit?.toLowerCase();

  if ([x, y, width, height].some((value) => Number.isNaN(value))) {
    return null;
  }

  if (safeUnit === "pct" || safeUnit === "percent") {
    return {
      x: x / 100,
      y: y / 100,
      width: width / 100,
      height: height / 100,
    };
  }

  const normalizedX = x / dimensions.width;
  const normalizedY = y / dimensions.height;
  const normalizedWidth = width / dimensions.width;
  const normalizedHeight = height / dimensions.height;

  return {
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

export function annotationToFrame(
  annotation: ImageAnnotation,
  dimensions: ImageDimensions,
): FrameInput | null {
  const selector = getFragmentSelector(annotation);
  let bounds: ReturnType<typeof normalizeBounds> = null;

  if (selector) {
    const { unit, numbers } = parseFragmentValue(selector.value.replace(/^xywh=/, ""));
    bounds = normalizeBounds(numbers, unit, dimensions);
  }

  if (!bounds) {
    const geometryBounds = getGeometrySelectorBounds(annotation);
    if (geometryBounds) {
      bounds = normalizeBounds(
        [geometryBounds.x, geometryBounds.y, geometryBounds.width, geometryBounds.height],
        "pixel",
        dimensions,
      );
    }
  }

  if (!bounds) {
    return null;
  }

  return {
    id: annotation.id,
    paneId: annotation.id ?? undefined,
    bounds: {
      x: Math.max(0, Math.min(1, bounds.x)),
      y: Math.max(0, Math.min(1, bounds.y)),
      width: Math.max(0, Math.min(1, bounds.width)),
      height: Math.max(0, Math.min(1, bounds.height)),
    },
  };
}
