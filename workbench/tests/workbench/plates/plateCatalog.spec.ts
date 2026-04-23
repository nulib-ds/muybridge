import { describe, expect, it } from "vitest";
import { parsePlateCsv } from "../../../src/workbench/plates/plateParser";
import { defaultPlate, findPlateByInfoUrl, plateCatalog } from "../../../src/workbench/plates/plateCatalog";

const sampleCsv = `Label,Image URI,Summary,Date,Medium,Homepage ID,Homepage Label,Notes,Tags
Plate X,https://example.org/iiif/plate-x/info.json,Description,1880,Gelatin silver,https://example.org/plates/x,Example Museum,Primary sequence,animal study
`;

describe("parsePlateCsv", () => {
  it("parses required columns and preserves trailing metadata", () => {
    const entries = parsePlateCsv(sampleCsv);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      label: "Plate X",
      imageUri: "https://example.org/iiif/plate-x/info.json",
    });
    expect(entries[0].metadata).toEqual(
      expect.arrayContaining([
        { label: "Notes", value: "Primary sequence" },
        { label: "Tags", value: "animal study" },
      ]),
    );
  });

  it("omits metadata entries with empty values", () => {
    const csv = `Label,Image URI,Notes,Tags\nPlate Y,https://example.org/iiif/plate-y/info.json,,\n`;
    const entries = parsePlateCsv(csv);
    expect(entries[0].metadata).toHaveLength(0);
  });
});

describe("plateCatalog", () => {
  it("hydrates entries with thumbnails from the bundled csv", () => {
    expect(plateCatalog.length).toBeGreaterThan(0);
    expect(plateCatalog[0]).toHaveProperty("thumbnailUrl");
    expect(plateCatalog[0].thumbnailUrl).toMatch(/\/full\/[0-9]+,\/0\/default\.jpg$/);
  });

  it("exposes the default plate for initial selection", () => {
    expect(defaultPlate).toBeTruthy();
    if (!defaultPlate) {
      return;
    }
    const located = findPlateByInfoUrl(defaultPlate.imageUri);
    expect(located?.id).toEqual(defaultPlate.id);
  });

  it("matches plates even when the caller omits info.json", () => {
    const plate = plateCatalog[0];
    const shortened = plate.imageUri.replace(/\/info\.json$/, "");
    const resolved = findPlateByInfoUrl(shortened);
    expect(resolved?.id).toEqual(plate.id);
  });
});
