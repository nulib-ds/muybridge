import { describe, expect, it } from "vitest";
import type { FrameDescriptor } from "../../../src/workbench/frames/types";
import { buildManifestFromFrames } from "../../../src/workbench/frames/manifest";

const frames: FrameDescriptor[] = [
  {
    id: "frame-1",
    paneId: "pane-1",
    order: 1,
    bounds: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
  },
  {
    id: "frame-2",
    paneId: "pane-2",
    order: 2,
    bounds: { x: 0.25, y: 0.3, width: 0.3, height: 0.4 },
  },
];

describe("buildManifestFromFrames", () => {
  it("returns null when frames or dimensions are missing", () => {
    const manifest = buildManifestFromFrames({
      infoUrl: "https://example.org/iiif/plate/info.json",
      frames: [],
      dimensions: { width: 1000, height: 800 },
      durationSeconds: 2,
    });
    expect(manifest).toBeNull();

    const manifestWithoutDims = buildManifestFromFrames({
      infoUrl: "https://example.org/iiif/plate/info.json",
      frames,
      dimensions: null,
      durationSeconds: 2,
    });
    expect(manifestWithoutDims).toBeNull();
  });

  it("creates an animation canvas using the first frame dimensions and assigns temporal fragments", () => {
    const manifest = buildManifestFromFrames({
      infoUrl: "https://example.org/iiif/plate/info.json",
      frames,
      dimensions: { width: 1000, height: 800 },
      durationSeconds: 2,
      label: "Test plate",
      summary: "Sample summary",
    });

    expect(manifest).toBeTruthy();
    if (!manifest) {
      return;
    }

    expect(manifest.items).toHaveLength(2);
    const [animationCanvas, staticCanvas] = manifest.items;
    expect(animationCanvas.height).toEqual(Math.round(0.4 * 800));
    expect(animationCanvas.width).toEqual(Math.round(0.3 * 1000));
    expect(animationCanvas.duration).toBeCloseTo(2);
    const annotations = animationCanvas.items[0].items;
    expect(annotations).toHaveLength(2);
    expect(annotations[0].target).toMatch(/#t=0,1/);
    expect(annotations[1].target).toMatch(/#t=1,2/);
    expect(staticCanvas.height).toEqual(800);
    expect(staticCanvas.width).toEqual(1000);
  });
});
