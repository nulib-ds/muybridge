import { describe, expect, it } from "vitest";
import { getIiifImageServiceUrl, sanitizeIiifUrl } from "../../src/lib/iiif";

describe("getIiifImageServiceUrl", () => {
  it("strips trailing info.json segments", () => {
    const infoUrl = sanitizeIiifUrl("https://example.org/iiif/plate");
    expect(infoUrl.endsWith("info.json")).toBe(true);
    expect(getIiifImageServiceUrl(infoUrl)).toBe("https://example.org/iiif/plate");
  });

  it("returns trimmed input when info suffix missing", () => {
    expect(getIiifImageServiceUrl(" https://example.org/iiif/plate ")).toBe(
      "https://example.org/iiif/plate",
    );
  });

  it("returns null for empty strings", () => {
    expect(getIiifImageServiceUrl("   ")).toBeNull();
  });
});
