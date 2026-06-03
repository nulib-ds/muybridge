#!/usr/bin/env node
/**
 * Fetches IIIF manifests for missing plates and resolves info.json URLs.
 *
 * Usage:
 *   node scripts/fetch-missing-iiif.mjs           — writes missing-plates-resolved.csv
 *   node scripts/fetch-missing-iiif.mjs --merge   — also appends new plates to plates.csv
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const missingPath = resolve(projectRoot, 'data/missing-list-collected.csv');
const resolvedPath = resolve(projectRoot, 'data/missing-plates-resolved.csv');
const platesPath = resolve(projectRoot, 'data/plates.csv');

const MERGE = process.argv.includes('--merge');

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function tokenizeCsv(source) {
  const text = source.replace(/^﻿/, '');
  const rows = [];
  let cell = '';
  let row = [];
  let inQuotes = false;

  const pushRow = () => {
    const completed = [...row, cell];
    if (completed.some((v) => v.trim())) rows.push(completed);
    row = [];
    cell = '';
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i++;
      pushRow();
      continue;
    }
    if (!inQuotes && ch === ',') { row.push(cell); cell = ''; continue; }
    cell += ch;
  }
  if (cell.length || row.length) pushRow();
  return rows;
}

function csvCell(value) {
  const s = String(value ?? '');
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------------------
// Title normalization → "Plate Number NNN. Subject" or "Plate Number NNN."
// ---------------------------------------------------------------------------

function normalizeTitle(raw, plateNumber) {
  if (!raw || /^NMAH-/i.test(raw.trim())) return `Plate Number ${plateNumber}.`;
  const stripped = raw
    .replace(/^animal\s+locomotion[.,]?\s*/i, '')
    .replace(/^plate\.?\s*\d+[.,]?\s*/i, '')
    .trim();
  return stripped
    ? `Plate Number ${plateNumber}. ${stripped}`
    : `Plate Number ${plateNumber}.`;
}

// ---------------------------------------------------------------------------
// IIIF manifest parsing (Presentation v2 primary, v3 fallback)
// ---------------------------------------------------------------------------

function extractFromManifest(manifest, plateNumber) {
  // Title: check metadata array first, then manifest label
  let rawTitle = null;
  if (Array.isArray(manifest.metadata)) {
    const entry = manifest.metadata.find(
      (m) => m.label === 'Title' || m.label?.en?.[0] === 'Title'
    );
    if (entry) {
      rawTitle = typeof entry.value === 'string'
        ? entry.value
        : (entry.value?.en?.[0] ?? entry.value?.['@value'] ?? null);
    }
  }
  if (!rawTitle) {
    rawTitle = typeof manifest.label === 'string'
      ? manifest.label
      : (manifest.label?.en?.[0] ?? manifest.label?.['@value'] ?? null);
  }

  // Image service URL
  let serviceId = null;

  // IIIF Presentation v2
  const resource = manifest.sequences?.[0]?.canvases?.[0]?.images?.[0]?.resource;
  if (resource) {
    serviceId = resource.service?.['@id'] ?? resource.service?.id ?? null;
  }

  // IIIF Presentation v3 fallback
  if (!serviceId) {
    const body = manifest.items?.[0]?.items?.[0]?.items?.[0]?.body;
    if (body) {
      serviceId = body.service?.[0]?.id ?? body.service?.[0]?.['@id'] ?? null;
    }
  }

  if (!serviceId) return null;

  return {
    title: normalizeTitle(rawTitle, plateNumber),
    infoJsonUrl: serviceId.replace(/\/?$/, '') + '/info.json',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const source = readFileSync(missingPath, 'utf8');
const [headerRow, ...bodyRows] = tokenizeCsv(source);

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const colIndex = new Map(headerRow.map((h, i) => [norm(h), i]));

const plateNumCol = colIndex.get('plate number') ?? 2;
const manifestCol = colIndex.get('manifest') ?? 11;

const entries = bodyRows
  .map((row) => ({
    plateNumber: parseInt((row[plateNumCol] ?? '').trim(), 10),
    manifestUrl: (row[manifestCol] ?? '').trim(),
  }))
  .filter((e) => Number.isFinite(e.plateNumber) && e.manifestUrl);

const DELAY_MS = 300;

async function fetchManifestEntry({ plateNumber, manifestUrl }) {
  let res = await fetch(manifestUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const manifest = await res.json();
  const extracted = extractFromManifest(manifest, plateNumber);
  if (!extracted) throw new Error('Could not extract image service from manifest');
  const provider = manifestUrl.includes('digitalcommonwealth.org')
    ? 'Boston Public Library'
    : 'Smithsonian Institution';
  return { plateNumber, provider, ...extracted };
}

console.log(`Fetching ${entries.length} manifests…\n`);

const settled = [];
for (const entry of entries) {
  try {
    settled.push({ status: 'fulfilled', value: await fetchManifestEntry(entry) });
  } catch (err) {
    settled.push({ status: 'rejected', reason: err });
  }
  await new Promise((r) => setTimeout(r, DELAY_MS));
}

const succeeded = [];
const failed = [];

settled.forEach((result, i) => {
  const { plateNumber, manifestUrl } = entries[i];
  if (result.status === 'fulfilled') {
    const { title } = result.value;
    console.log(`  ✓  ${String(plateNumber).padStart(3)}  ${title}`);
    succeeded.push(result.value);
  } else {
    console.error(`  ✗  ${String(plateNumber).padStart(3)}  ${result.reason.message}  (${manifestUrl})`);
    failed.push({ plateNumber, error: result.reason.message });
  }
});

succeeded.sort((a, b) => a.plateNumber - b.plateNumber);

// Write resolved CSV
const resolvedLines = ['Label,Image URI,Plate Number,Provider'];
for (const r of succeeded) {
  resolvedLines.push(
    [r.title, r.infoJsonUrl, r.plateNumber, r.provider].map(csvCell).join(',')
  );
}
writeFileSync(resolvedPath, resolvedLines.join('\n') + '\n', 'utf8');
console.log(`\nWrote ${succeeded.length} resolved plates → data/missing-plates-resolved.csv`);

if (failed.length) {
  console.log(`\nFailed (${failed.length}): plates ${failed.map((f) => f.plateNumber).join(', ')}`);
}

// Merge into plates.csv
if (!MERGE) process.exit(failed.length ? 1 : 0);

if (!succeeded.length) {
  console.log('\nNothing to merge.');
  process.exit(1);
}

const existing = readFileSync(platesPath, 'utf8');
const existingNums = new Set(
  tokenizeCsv(existing)
    .slice(1)
    .map((r) => parseInt((r[2] ?? '').trim(), 10))
    .filter(Number.isFinite)
);

const newRows = succeeded.filter((r) => !existingNums.has(r.plateNumber));
if (!newRows.length) {
  console.log('\nAll plates already present in plates.csv — nothing to merge.');
  process.exit(0);
}

const appendLines = newRows.map((r) =>
  [r.title, r.infoJsonUrl, r.plateNumber, r.provider].map(csvCell).join(',')
);
writeFileSync(platesPath, existing.trimEnd() + '\n' + appendLines.join('\n') + '\n', 'utf8');
console.log(`\nMerged ${newRows.length} new plates into plates.csv.`);
console.log('Run `npm run generate:plates` to rebuild plate chunks.');
