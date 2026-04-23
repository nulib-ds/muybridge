import { describe, expect, it } from "vitest";
import type { ImageAnnotation } from "@annotorious/annotorious";
import { annotationToFrame } from "../src/annotations/annotation-utils";

const baseAnnotation: ImageAnnotation = {
  id: "annotation-1",
  type: "Annotation",
  body: [],
  target: {
    type: "Image",
    selector: {
      type: "FragmentSelector",
      conformsTo: "http://www.w3.org/TR/media-frags/",
      value: "xywh=pixel:100,200,50,60",
    },
  },
};

describe("annotationToFrame", () => {
  it("converts pixel fragments to normalized frames", () => {
    const frame = annotationToFrame(baseAnnotation, { width: 1000, height: 500 });
    expect(frame).toBeTruthy();
    expect(frame?.bounds).toEqual({ x: 0.1, y: 0.4, width: 0.05, height: 0.12 });
  });

  it("supports percent-based fragments", () => {
    const annotation: ImageAnnotation = {
      ...baseAnnotation,
      id: "annotation-2",
      target: {
        type: "Image",
        selector: {
          type: "FragmentSelector",
          conformsTo: "http://www.w3.org/TR/media-frags/",
          value: "xywh=pct:10,20,30,40",
        },
      },
    };

    const frame = annotationToFrame(annotation, { width: 400, height: 400 });
    expect(frame?.bounds).toEqual({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 });
  });
});
