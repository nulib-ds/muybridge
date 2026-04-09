import { describe, expect, it } from "vitest";
import type { FrameDescriptor } from "../../../src/workbench/frames/types";
import { planGifRender } from "../../../src/workbench/frames/gifEncoder";

const baseFrames: FrameDescriptor[] = [
  {
    id: "frame-1",
    paneId: "pane-1",
    order: 1,
    bounds: { x: 0.1, y: 0.2, width: 0.8, height: 0.7 },
  },
  {
    id: "frame-2",
    paneId: "pane-2",
    order: 2,
    bounds: { x: 0.05, y: 0.05, width: 0.9, height: 0.85 },
  },
];

const dimensions = { width: 4000, height: 3000 };

describe("planGifRender", () => {
  it("caps the largest rendered edge at 500px", () => {
    const plan = planGifRender(baseFrames, dimensions);
    expect(plan.renderWidth).toBeLessThanOrEqual(500);
    expect(plan.renderHeight).toBeLessThanOrEqual(500);
    expect(plan.scale).toBeLessThan(1);
  });

  it("does not upscale frames smaller than the cap", () => {
    const smallDimensions = { width: 320, height: 240 };
    const plan = planGifRender(baseFrames, smallDimensions);
    expect(plan.renderWidth).toBeLessThanOrEqual(320);
    expect(plan.renderHeight).toBeLessThanOrEqual(240);
    expect(plan.scale).toEqual(1);
  });

  it("throws when called without frames", () => {
    expect(() => planGifRender([], dimensions)).toThrow(/without frames/);
  });
});
