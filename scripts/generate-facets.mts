import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const ROOT = path.resolve(".");
const CANOPY_YML = path.join(ROOT, "canopy.yml");
const IIIF_DIR = path.join(ROOT, "assets/iiif");
const SEARCH_RECORDS = path.join(ROOT, "site/api/search-records.json");
const FACETS_OUT = path.join(ROOT, "site/api/search/facets.json");
const FACET_DIR = path.join(ROOT, "site/api/facet");

const config = yaml.load(fs.readFileSync(CANOPY_YML, "utf8")) as any;
const metadataLabels: string[] = Array.isArray(config.metadata) ? config.metadata : [];
const baseUrl = String(config.site?.baseUrl || "").replace(/\/$/, "");

function absoluteUrl(p: string): string {
  return baseUrl + (p.startsWith("/") ? p : "/" + p);
}

function slugify(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLabel(label: string): string {
  return label.trim().replace(/[:\s]+$/, "").toLowerCase();
}

function firstI18nString(x: any): string {
  if (!x) return "";
  if (typeof x === "string") return x;
  try {
    const keys = Object.keys(x);
    if (!keys.length) return "";
    const arr = x[keys[0]];
    if (Array.isArray(arr) && arr.length) return String(arr[0]);
  } catch {}
  return "";
}

const records = JSON.parse(fs.readFileSync(SEARCH_RECORDS, "utf8")) as any[];
const normalizedLabels = new Set(metadataLabels.map((l) => normalizeLabel(String(l))));

// Build prefix index so truncated slugs can still match manifest files
const manifestSlugs = fs
  .readdirSync(IIIF_DIR)
  .filter((f) => f.endsWith(".json") && f !== "collection.json")
  .map((f) => f.replace(/\.json$/, ""));

function resolveManifestSlug(slug: string): string | null {
  if (fs.existsSync(path.join(IIIF_DIR, slug + ".json"))) return slug;
  const match = manifestSlugs.find((s) => s.startsWith(slug));
  return match ?? null;
}

// label -> value -> Set(doc index in records)
const map = new Map<string, Map<string, Set<number>>>();

for (let i = 0; i < records.length; i++) {
  const rec = records[i];
  if (!rec || rec.type !== "work") continue;

  // href: /plate/plate-number-1-walking-1.html
  // Strip route prefix and .html, then strip trailing locale suffix (-\d+)
  const href = String(rec.href || "");
  const hrefMatch = href.match(/^\/[^/]+\/(.+)\.html$/i);
  if (!hrefMatch) continue;
  const rawSlug = hrefMatch[1].replace(/-\d+$/, "");
  const slug = resolveManifestSlug(rawSlug);
  if (!slug) continue;

  let manifest: any;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(IIIF_DIR, slug + ".json"), "utf8"));
  } catch {
    continue;
  }

  const meta = Array.isArray(manifest.metadata) ? manifest.metadata : [];
  for (const entry of meta) {
    if (!entry) continue;
    const label = firstI18nString(entry.label);
    if (!label) continue;
    if (normalizedLabels.size && !normalizedLabels.has(normalizeLabel(label))) continue;

    const values: string[] = [];
    if (typeof entry.value === "string") {
      values.push(entry.value);
    } else if (entry.value && typeof entry.value === "object") {
      for (const k of Object.keys(entry.value)) {
        const arr = Array.isArray(entry.value[k]) ? entry.value[k] : [];
        for (const v of arr) if (v) values.push(String(v));
      }
    }

    if (!map.has(label)) map.set(label, new Map());
    const vmap = map.get(label)!;
    for (const v of values) {
      if (!vmap.has(v)) vmap.set(v, new Set());
      vmap.get(v)!.add(i);
    }
  }
}

// Build sorted facets array matching buildFacetsForWorks output format
const facets: any[] = [];
for (const [label, vmap] of map.entries()) {
  const labelSlug = slugify(label);
  const values = [];
  for (const [value, set] of vmap.entries()) {
    const docs = Array.from(set).sort((a, b) => a - b);
    values.push({ value, slug: slugify(value), doc_count: docs.length, docs });
  }
  values.sort((a, b) => b.doc_count - a.doc_count || a.value.localeCompare(b.value));
  facets.push({ label, slug: labelSlug, values });
}
facets.sort((a, b) => a.label.localeCompare(b.label));

fs.mkdirSync(path.dirname(FACETS_OUT), { recursive: true });
fs.writeFileSync(FACETS_OUT, JSON.stringify(facets, null, 2), "utf8");
console.log(`[facets] wrote ${facets.length} facets → ${FACETS_OUT}`);

// Write IIIF Collection files
fs.mkdirSync(FACET_DIR, { recursive: true });

const labelIndexItems: any[] = [];

for (const f of facets) {
  const labelSlug = f.slug;
  const labelDir = path.join(FACET_DIR, labelSlug);
  fs.mkdirSync(labelDir, { recursive: true });

  for (const v of f.values) {
    const valueSlug = v.slug;
    const items: any[] = [];

    for (const idx of v.docs) {
      const rec = records[idx];
      if (!rec || rec.type !== "work") continue;
      const id = String(rec.id || "");
      const title = String(rec.title || rec.href || "");
      const thumb = String(rec.thumbnail || "");
      const href = String(rec.href || "");
      const homepageId = absoluteUrl("/" + href.replace(/^\/?/, ""));
      const item: any = { id, type: "Manifest", label: { none: [title] } };
      if (thumb) item.thumbnail = [{ id: thumb, type: "Image" }];
      item.homepage = [{ id: homepageId, type: "Text", label: { none: [title] } }];
      items.push(item);
    }

    const selfId = absoluteUrl(`/api/facet/${labelSlug}/${valueSlug}.json`);
    const parentId = absoluteUrl(`/api/facet/${labelSlug}.json`);
    const homepage = absoluteUrl(
      `/search/index.html?${encodeURIComponent(labelSlug)}=${encodeURIComponent(valueSlug)}`
    );
    const col = {
      "@context": "https://iiif.io/api/presentation/3/context.json",
      id: selfId,
      type: "Collection",
      label: { none: [v.value] },
      items,
      partOf: [{ id: parentId, type: "Collection" }],
      summary: { none: [f.label] },
      homepage: [{ id: homepage, type: "Text", label: { none: [v.value] } }],
    };
    fs.writeFileSync(path.join(labelDir, valueSlug + ".json"), JSON.stringify(col, null, 2), "utf8");
  }

  const labelItems = f.values.map((v: any) => ({
    id: absoluteUrl(`/api/facet/${labelSlug}/${v.slug}.json`),
    type: "Collection",
    label: { none: [v.value] },
    summary: { none: [f.label] },
  }));
  const labelIndex = {
    "@context": "https://iiif.io/api/presentation/3/context.json",
    id: absoluteUrl(`/api/facet/${labelSlug}.json`),
    type: "Collection",
    label: { none: [f.label] },
    items: labelItems,
  };
  fs.writeFileSync(
    path.join(FACET_DIR, labelSlug + ".json"),
    JSON.stringify(labelIndex, null, 2),
    "utf8"
  );
  labelIndexItems.push({
    id: absoluteUrl(`/api/facet/${labelSlug}.json`),
    type: "Collection",
    label: { none: [f.label] },
  });
}

const facetIndex = {
  "@context": "https://iiif.io/api/presentation/3/context.json",
  id: absoluteUrl("/api/facet/index.json"),
  type: "Collection",
  label: { none: ["Facets"] },
  items: labelIndexItems,
};
fs.writeFileSync(path.join(FACET_DIR, "index.json"), JSON.stringify(facetIndex, null, 2), "utf8");
console.log(`[facets] wrote IIIF Collections → ${FACET_DIR}`);
