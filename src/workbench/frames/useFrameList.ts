import { useCallback, useEffect, useMemo, useState } from "react";
import type { ImageAnnotation } from "@annotorious/annotorious";

const STORAGE_PREFIX = "muybridge.annotations:";

function getStorageKey(infoUrl: string) {
  const trimmed = infoUrl.trim();
  return trimmed ? `${STORAGE_PREFIX}${encodeURIComponent(trimmed)}` : null;
}

function isValidAnnotation(candidate: unknown): candidate is ImageAnnotation {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  const annotation = candidate as ImageAnnotation;
  if (!annotation.id || typeof annotation.id !== "string") {
    return false;
  }

  const target = annotation.target;
  if (!target || typeof target !== "object") {
    return false;
  }

  if (Array.isArray(target)) {
    return target.every((entry) => typeof entry === "object" && entry !== null);
  }

  const selector = (target as { selector?: unknown }).selector;
  if (!selector || typeof selector !== "object") {
    return false;
  }

  return true;
}

function readStoredAnnotations(key: string | null): ImageAnnotation[] {
  if (!key || typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isValidAnnotation);
  } catch (error) {
    console.warn("[annotations] failed to parse storage", error);
    return [];
  }
}

function writeStoredAnnotations(key: string | null, annotations: ImageAnnotation[]) {
  if (!key || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(annotations));
  } catch (error) {
    console.warn("[annotations] failed to persist", error);
  }
}

export function useAnnotationStore(infoUrl: string) {
  const storageKey = useMemo(() => getStorageKey(infoUrl), [infoUrl]);
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>(() =>
    readStoredAnnotations(storageKey),
  );

  useEffect(() => {
    setAnnotations(readStoredAnnotations(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeStoredAnnotations(storageKey, annotations);
  }, [annotations, storageKey]);

  const addAnnotation = useCallback((annotation: ImageAnnotation) => {
    setAnnotations((previous) => {
      const index = previous.findIndex((item) => item.id === annotation.id);
      if (index !== -1) {
        const copy = [...previous];
        copy[index] = annotation;
        return copy;
      }
      return [...previous, annotation];
    });
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return { annotations, addAnnotation, clearAnnotations } as const;
}
