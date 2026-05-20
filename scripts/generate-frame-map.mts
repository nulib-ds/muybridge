import fs from "fs";
import path from "path";

const IIIF_DIR = path.resolve("assets/iiif");
const OUT_DIR = path.resolve(".cache/search");
const OUT_FILE = path.join(OUT_DIR, "first-frame-map.json");

const map: Record<string, string> = {};

for (const filename of fs.readdirSync(IIIF_DIR)) {
  if (!filename.endsWith(".json") || filename === "collection.json") continue;

  const slug = filename.replace(/\.json$/, "");
  const raw = fs.readFileSync(path.join(IIIF_DIR, filename), "utf8");

  let manifest: any;
  try {
    manifest = JSON.parse(raw);
  } catch {
    continue;
  }

  const firstFrameUrl: string | undefined =
    manifest?.items?.[0]?.items?.[0]?.items?.[0]?.body?.id;

  if (firstFrameUrl) map[slug] = firstFrameUrl;
}

fs.mkdirSync(OUT_DIR, {recursive: true});
fs.writeFileSync(OUT_FILE, JSON.stringify(map, null, 2), "utf8");
console.log(`[frame-map] wrote ${Object.keys(map).length} entries → ${OUT_FILE}`);
