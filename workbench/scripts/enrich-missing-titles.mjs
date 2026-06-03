#!/usr/bin/env node
/**
 * Enriches titles for the 59 missing plates (SI + BPL) using descriptions
 * extracted from the original 1887 Muybridge Animal Locomotion catalogue.
 *
 * Only touches rows whose Provider is "Smithsonian Institution" or
 * "Boston Public Library". NGA rows are never modified.
 *
 * Usage: node scripts/enrich-missing-titles.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const platesPath = resolve(projectRoot, 'data/plates.csv');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Descriptions from the 1887 Muybridge Animal Locomotion catalogue.
// Transcribed from scanned catalogue pages; style preserved from the original.
// ---------------------------------------------------------------------------

const CATALOGUE = {
  // Women — Stooping / Lifting / Carrying (Vol. I–II)
  224: 'Stooping, lifting a basin, wiping it, and turning',
  225: 'Removing water-jar from shoulder to the ground',
  226: 'Removing water-jar from shoulder to the ground and turning',

  // Women — Water-jar / Domestic (Vol. II)
  235: 'Turning and removing water-jar from shoulder to the ground',
  238: 'Two models; one standing, the other sitting, crossing leg',

  // Women — Seated / Reclining
  247: 'Sitting down on the ground',
  254: 'Kneeling, elbows on chair, hands clasped',
  255: 'Arising from kneeling and turning',
  262: 'Getting out of hammock',
  264: 'Getting out of bed',

  // Men — Athletic / Sport (Vol. IV)
  304: 'Picking up a ball and throwing it',

  // Men — Acrobatics (Vol. IV)
  367: 'Running, hitch and kick',

  // Men & Women — Domestic / Bathing / Toilet (Vol. V–VI)
  402: 'Emptying a bucket of water',
  407: 'Two models, 8 pouring a bucket of water over 1',
  409: 'Stepping out of a bathtub, sitting and wiping feet',
  411: 'Lifting a towel while sitting, and wiping feet',
  412: 'Washing, wiping face, and turning',
  413: 'Pouring water, washing and washing face',
  415: 'Toilet; preparing to put on clothing',
  419: 'Stooping, throwing wrap around shoulders',
  425: 'Toilet; rising from chair and putting on shawl',
  427: 'Two models, 1 disrobing 8',
  429: 'Toilet; taking off clothing',
  432: 'Washing clothes at tub',
  436: 'Setting down a bucket and preparing to sweep',
  440: 'Spreading a rug on the floor',
  442: 'Stooping and rolling a stone on the ground',
  448: 'Two models, 11 descending stairs with goblet, meets 10 with bouquet',
  450: 'Two models, 8 brings cup of tea, 1 takes cup and drinks',
  452: 'Two models, 8 kneels, drinks from water-jar in hands of 1, and both walk off',
  453: 'Taking 12-lb. basket from head and placing it on the ground',

  // Children / Miscellaneous (Vol. VII)
  482: 'Two models, 16 chasing 4 with a broom',
  493: 'A 103, rowing; B 96, rowing',
  500: 'Various movements with water-jar',

  // Men — Miscellaneous / Abnormal Movements (Vol. VIII)
  526: 'A, walking; B, ascending step; C, walking',
  528: 'A, ascending step; B, walking; carrying child 104; E, running with child',
  537: 'Single amputation of leg; hopping with crutches',
  547: 'Hemiplegia; walking with crutch',
  551: 'Epilepsy; walking',
  552: 'Hemiplegia; walking with cane',
  554: 'After traumatism of head; walking',
  558: 'Local chorea; A, B, C while standing',
  560: 'Locomotor ataxia; walking',

  // Animals — Mule (Vol. IX)
  658: 'Mule; A, kicking; B, kicking; Ruth',
  659: 'Mule; A, B, bucking and kicking; Ruth',
  660: 'Mule; miscellaneous performances; Denver',
  662: 'Mule; A, B, a refractory animal; Ruth',
  663: 'Mule; miscellaneous performances; Denver',
  664: 'Mule; miscellaneous performances',

  // Animals — Ass / Sow / Goat (Vol. IX)
  666: 'Ass; walking; bareback',
  675: 'Sow; galloping',
  678: 'Goat; trotting',

  // Animals — Gnu / Dog (Vol. IX–X)
  703: 'Dog; walking; interrupted; mastiff, Dread',
  704: 'Dog; walking; mastiff, Dread',
  708: 'Dog; galloping; brown racing hound, Ike',
  709: 'Dog; galloping; white racing hound, Maggie',
  711: 'Dogs; two, racing; A, B; racing hounds, Ike, Maggie',

  // Animals — Cat (Vol. X)
  717: 'Cat; trotting',
  719: 'Cat; galloping',
};

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function tokenizeCsv(source) {
  const text = source.replace(/^﻿/, '');
  const rows = [];
  let cell = '', row = [], inQuotes = false;
  const pushRow = () => {
    const completed = [...row, cell];
    if (completed.some((v) => v.trim())) rows.push(completed);
    row = []; cell = '';
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { cell += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i++;
      pushRow(); continue;
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
// Main
// ---------------------------------------------------------------------------

const source = readFileSync(platesPath, 'utf8');
const rows = tokenizeCsv(source);
const [header, ...body] = rows;

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const colIdx = new Map(header.map((h, i) => [norm(h), i]));

const labelCol    = colIdx.get('label') ?? 0;
const imageCol    = colIdx.get('image uri') ?? 1;
const plateNumCol = colIdx.get('plate number') ?? 2;
const providerCol = colIdx.get('provider') ?? 3;

const NON_NGA_PROVIDERS = new Set(['Smithsonian Institution', 'Boston Public Library']);

let updated = 0;
let skipped = 0;

const updatedBody = body.map((row) => {
  const provider = (row[providerCol] ?? '').trim();
  if (!NON_NGA_PROVIDERS.has(provider)) return row; // never touch NGA

  const plateNumber = parseInt((row[plateNumCol] ?? '').trim(), 10);
  const description = CATALOGUE[plateNumber];
  if (!description) {
    skipped++;
    return row;
  }

  const newLabel = `Plate Number ${plateNumber}. ${description}`;
  const newRow = [...row];
  newRow[labelCol] = newLabel;
  updated++;
  if (DRY_RUN) {
    console.log(`  ${String(plateNumber).padStart(3)}  ${newLabel}`);
  } else {
    console.log(`  ✓  ${String(plateNumber).padStart(3)}  ${newLabel}`);
  }
  return newRow;
});

const output = [header, ...updatedBody]
  .map((row) => row.map(csvCell).join(','))
  .join('\n') + '\n';

if (DRY_RUN) {
  console.log(`\nDry run — ${updated} plates would be updated, ${skipped} skipped (no catalogue entry).`);
} else {
  writeFileSync(platesPath, output, 'utf8');
  console.log(`\nUpdated ${updated} plate titles in plates.csv.`);
  if (skipped) console.log(`Skipped ${skipped} (no catalogue entry found).`);
  console.log('Run `npm run generate:plates` to rebuild chunks.');
}
