#!/usr/bin/env node
/**
 * Rewrites Smithsonian manifest animation-canvas frame bodies from
 * pct: relative coordinates to absolute pixel coordinates.
 *
 * Fetches each plate's info.json directly from ids.si.edu (no CORS in Node)
 * to get the true original image dimensions, then recalculates every frame's
 * x,y,w,h in pixels.
 *
 * Usage (from repo root): node workbench/scripts/rewrite-si-frame-regions.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iiifDir = resolve(__dirname, "../../assets/iiif");

const getMeta = (m, key) =>
  (m.metadata ?? []).find((e) => e.label?.en?.[0] === key)?.value?.en?.[0] ?? null;

// Extract the IIIF image service base URL from a frame body.id
function serviceFromBodyId(id) {
  const match = id.match(/^(https:\/\/ids\.si\.edu\/ids\/iiif\/[^/]+)\//);
  return match?.[1] ?? null;
}

// Parse pct:X,Y,W,H from a body.id
function parsePct(id) {
  const m = id.match(/\/pct:([0-9.]+),([0-9.]+),([0-9.]+),([0-9.]+)\//);
  if (!m) return null;
  return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };
}

// Detect already-converted pixel region  /NNN,NNN,NNN,NNN/
function isPixelRegion(id) {
  return /\/\d+,\d+,\d+,\d+\//.test(id) && !id.includes("pct:");
}

async function fetchDimensions(serviceUrl) {
  const res = await fetch(`${serviceUrl}/info.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  const w = Number(d.width ?? d["@width"]);
  const h = Number(d.height ?? d["@height"]);
  if (!Number.isFinite(w) || !Number.isFinite(h))
    throw new Error("info.json missing width/height");
  return { width: w, height: h };
}

// ── Main ────────────────────────────────────────────────────────────────────

const files = readdirSync(iiifDir).filter(
  (f) => f.endsWith(".json") && f !== "collection.json"
);

const siFiles = files.filter((f) => {
  const m = JSON.parse(readFileSync(resolve(iiifDir, f), "utf8"));
  return getMeta(m, "Provider") === "Smithsonian Institution";
});

console.log(`Smithsonian manifests to process: ${siFiles.length}\n`);

let updated = 0, skipped = 0, failed = 0;

for (const filename of siFiles) {
  const filePath = resolve(iiifDir, filename);
  const manifest = JSON.parse(readFileSync(filePath, "utf8"));

  const annotations = manifest.items?.[0]?.items?.[0]?.items ?? [];

  if (!annotations.length) {
    console.log(`  –  ${filename}: no frames`);
    skipped++;
    continue;
  }

  const firstId = annotations[0]?.body?.id ?? "";

  if (isPixelRegion(firstId)) {
    console.log(`  ·  ${filename}: already pixel coords`);
    skipped++;
    continue;
  }

  const service = serviceFromBodyId(firstId);
  if (!service) {
    console.warn(`  ⚠  ${filename}: cannot parse service URL`);
    skipped++;
    continue;
  }

  let dims;
  try {
    dims = await fetchDimensions(service);
  } catch (err) {
    console.error(`  ✗  ${filename}: ${err.message}`);
    failed++;
    continue;
  }

  let changed = false;
  for (const annotation of annotations) {
    const id = annotation.body?.id;
    if (!id) continue;
    const pct = parsePct(id);
    if (!pct) continue;

    const px = Math.round((pct.x / 100) * dims.width);
    const py = Math.round((pct.y / 100) * dims.height);
    const pw = Math.max(1, Math.round((pct.w / 100) * dims.width));
    const ph = Math.max(1, Math.round((pct.h / 100) * dims.height));

    annotation.body.id     = `${service}/${px},${py},${pw},${ph}/full/0/default.jpg`;
    annotation.body.width  = pw;
    annotation.body.height = ph;
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    const plateNum = filename.match(/plate-number-(\d+)/)?.[1] ?? "?";
    console.log(
      `  ✓  ${String(plateNum).padStart(3)}  ${dims.width}×${dims.height}  (${annotations.length} frames)`
    );
    updated++;
  }
}

console.log(`\nUpdated: ${updated}  |  Skipped: ${skipped}  |  Failed: ${failed}`);
