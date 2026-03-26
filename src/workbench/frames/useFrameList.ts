import { useState } from 'react';
import type { FrameDescriptor, FrameInput } from './types';

export function useFrameList(initial: FrameDescriptor[] = []) {
  const [frames, setFrames] = useState<FrameDescriptor[]>(initial);

  const addFrame = (frame: FrameInput) => {
    setFrames((previous) => {
      const nextOrder = frame.order ?? previous.length + 1;
      const normalized: FrameDescriptor = {
        id: frame.id ?? crypto.randomUUID(),
        paneId: frame.paneId ?? `pane-${nextOrder}`,
        order: nextOrder,
        bounds: frame.bounds,
      };

      return [...previous, normalized];
    });
  };

  const clearFrames = () => setFrames([]);

  return { frames, addFrame, clearFrames } as const;
}
