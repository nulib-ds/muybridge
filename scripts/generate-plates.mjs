import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_COLUMNS = {
  label: 'title',
  imageUri: 'image_iiifurl',
  objectId: 'objectid',
};

function normalizeHeader(label) {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenizeCsv(source) {
  const text = source.replace(/^\ufeff/, '');
  const rows = [];
  let cell = '';
  let row = [];
  let inQuotes = false;

  const pushRow = () => {
    const completedRow = [...row, cell];
    const hasContent = completedRow.some((value) => value.trim().length > 0);
    if (hasContent) {
      rows.push(completedRow);
    }
    row = [];
    cell = '';
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      pushRow();
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    pushRow();
  }

  return rows;
}

function sanitizeIiifUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.endsWith('info.json')) {
    return trimmed;
  }
  return `${trimmed.replace(/\/$/, '')}/info.json`;
}

function extractPlateNumber(label) {
  const match = /plate\s+number\s*(\d+)/i.exec(label);
  if (!match) {
    return null;
  }
  const numeric = Number.parseInt(match[1], 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function escapeCsvCell(value) {
  if (/[,"\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const sourcePath = resolve(projectRoot, 'data/nga_data.csv');
const targetPath = resolve(projectRoot, 'data/plates.csv');

const source = readFileSync(sourcePath, 'utf8');
const rows = tokenizeCsv(source);
if (!rows.length) {
  console.error('No rows found in source CSV');
  process.exit(1);
}

const [header, ...body] = rows;
const normalizedHeaders = header.map(normalizeHeader);
const columnIndex = new Map();
normalizedHeaders.forEach((label, index) => {
  if (!label || columnIndex.has(label)) {
    return;
  }
  columnIndex.set(label, index);
});

const requiredEntries = Object.entries(REQUIRED_COLUMNS);
requiredEntries.forEach(([, normalized]) => {
  if (!columnIndex.has(normalized)) {
    console.error(`Missing required column: ${normalized}`);
    process.exit(1);
  }
});

const outputRows = body
  .map((row) => {
    const labelIndex = columnIndex.get(REQUIRED_COLUMNS.label);
    const imageIndex = columnIndex.get(REQUIRED_COLUMNS.imageUri);
    const rawLabel = row[labelIndex] ?? '';
    const label = rawLabel.trim();
    const imageUrl = sanitizeIiifUrl(row[imageIndex] ?? '');
    const objectIndex = columnIndex.get(REQUIRED_COLUMNS.objectId);
    const objectId = (row[objectIndex] ?? '').trim();
    if (!label || !imageUrl) {
      return null;
    }
    const plateNumber = extractPlateNumber(label);
    return { label, imageUrl, plateNumber, objectId };
  })
  .filter(Boolean)
  .sort((a, b) => {
    const numberA = a.plateNumber ?? Number.POSITIVE_INFINITY;
    const numberB = b.plateNumber ?? Number.POSITIVE_INFINITY;
    if (numberA !== numberB) {
      return numberA - numberB;
    }
    return a.label.localeCompare(b.label);
  });

const csvLines = [
  ['Label', 'Image URI', 'Plate Number', 'Object ID'],
  ...outputRows.map((row) => [row.label, row.imageUrl, row.plateNumber ?? '', row.objectId ?? '']),
]
  .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
  .join('\n');

writeFileSync(targetPath, `${csvLines}\n`, 'utf8');
console.log(`Wrote ${outputRows.length} rows to ${targetPath}`);
