import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FrameDescriptor, FrameInput } from './types';

const STORAGE_PREFIX = 'muybridge.annotations:';

function getStorageKey(infoUrl: string) {
  const trimmed = infoUrl.trim();
  return trimmed ? `${STORAGE_PREFIX}${encodeURIComponent(trimmed)}` : null;
}

function readStoredFrames(key: string | null): FrameDescriptor[] {
  if (!key || typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as FrameDescriptor[]) : [];
  } catch (error) {
    console.warn('[frames] failed to parse stored annotations', error);
    return [];
  }
}

function writeStoredFrames(key: string | null, frames: FrameDescriptor[]) {
  if (!key || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(frames));
  } catch (error) {
    console.warn('[frames] failed to persist annotations', error);
  }
}

export function useFrameList(infoUrl: string) {
  const storageKey = useMemo(() => getStorageKey(infoUrl), [infoUrl]);
  const [frames, setFrames] = useState<FrameDescriptor[]>(() => readStoredFrames(storageKey));

  useEffect(() => {
    setFrames(readStoredFrames(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeStoredFrames(storageKey, frames);
  }, [storageKey, frames]);

  const updateFrames = useCallback(
    (updater: (previous: FrameDescriptor[]) => FrameDescriptor[]) => {
      setFrames((previous) => updater(previous));
    },
    [],
  );

  const addFrame = useCallback(
    (frame: FrameInput) => {
      updateFrames((previous) => {
        const nextOrder = frame.order ?? previous.length + 1;
        const normalized: FrameDescriptor = {
          id: frame.id ?? crypto.randomUUID(),
          paneId: frame.paneId ?? `pane-${nextOrder}`,
          order: nextOrder,
          bounds: frame.bounds,
        };

        if (frame.id) {
          const existingIndex = previous.findIndex((item) => item.id === frame.id);
          if (existingIndex !== -1) {
            const copy = [...previous];
            copy[existingIndex] = {
              ...copy[existingIndex],
              ...normalized,
              order: copy[existingIndex].order,
            };
            return copy;
          }
        }

        return [...previous, normalized];
      });
    },
    [updateFrames],
  );

  const clearFrames = useCallback(() => {
    updateFrames(() => []);
    if (storageKey && typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  }, [updateFrames, storageKey]);

  return { frames, addFrame, clearFrames } as const;
}
