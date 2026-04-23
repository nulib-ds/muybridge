import { describe, expect, it } from "vitest";
import {
  DEFAULT_FRAME_DURATION_SECONDS,
  defaultDurationForFrames,
  sanitizeDuration,
} from "../../../src/workbench/frames/duration";

describe("duration helpers", () => {
  it("clamps and rounds sanitized values to hundredths", () => {
    expect(sanitizeDuration(NaN)).toBe(0);
    expect(sanitizeDuration(-5)).toBe(0);
    expect(sanitizeDuration(3.14159)).toBe(3.14);
    expect(sanitizeDuration(10.987)).toBe(10);
  });

  it("returns 100ms per frame by default", () => {
    expect(defaultDurationForFrames(0)).toBe(DEFAULT_FRAME_DURATION_SECONDS);
    expect(defaultDurationForFrames(1)).toBe(DEFAULT_FRAME_DURATION_SECONDS);
    expect(defaultDurationForFrames(10)).toBe(1);
  });
});
