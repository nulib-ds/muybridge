export interface FrameBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameDescriptor {
  id: string;
  paneId: string;
  order: number;
  bounds: FrameBounds;
}

export type FrameInput = Partial<Omit<FrameDescriptor, 'bounds'>> & {
  bounds: FrameBounds;
};
