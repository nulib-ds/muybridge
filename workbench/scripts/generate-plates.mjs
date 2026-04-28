import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_COLUMNS = {
  label: 'label',
  imageUri: 'image uri',
  plateNumber: 'plate number',
  provider: 'provider',
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const sourcePath = resolve(projectRoot, 'data/plates.csv');
const publicDir = resolve(projectRoot, 'public');
const chunkDir = resolve(publicDir, 'plates/chunks');
const manifestPath = resolve(publicDir, 'plates/chunks.json');
const chunkSize = 60;

function slugify(value, fallback) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}

function getThumbnailUrl(infoUrl, width = 240) {
  const trimmed = infoUrl.trim();
  if (!trimmed) {
    return null;
  }
  const suffix = '/info.json';
  const normalized = trimmed.replace(/\/$/, '');
  if (!normalized.endsWith(suffix)) {
    return null;
  }
  const service = normalized.slice(0, -suffix.length);
  if (!service) {
    return null;
  }
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 240;
  return `${service}/full/${safeWidth},/0/default.jpg`;
}

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

const plateEntries = body
  .map((row) => {
    const labelIndex = columnIndex.get(REQUIRED_COLUMNS.label);
    const imageIndex = columnIndex.get(REQUIRED_COLUMNS.imageUri);
    const plateNumberIndex = columnIndex.get(REQUIRED_COLUMNS.plateNumber);
    const providerIndex = columnIndex.get(REQUIRED_COLUMNS.provider);
    const rawLabel = row[labelIndex] ?? '';
    const label = rawLabel.trim();
    const imageUrl = sanitizeIiifUrl(row[imageIndex] ?? '');
    const rawPlateNumber = (row[plateNumberIndex] ?? '').trim();
    const provider = (row[providerIndex] ?? '').trim();
    if (!label || !imageUrl) {
      return null;
    }
    const parsedPlateNumber = Number.parseInt(rawPlateNumber, 10);
    const plateNumber = Number.isFinite(parsedPlateNumber)
      ? parsedPlateNumber
      : extractPlateNumber(label);
    return { label, imageUrl, plateNumber, provider };
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

rmSync(chunkDir, { recursive: true, force: true });
mkdirSync(chunkDir, { recursive: true });

const chunkEntries = plateEntries.map((row, index) => {
  const id = `${slugify(row.label, `plate-${index + 1}`)}-${index + 1}`;
  const thumbnailUrl = getThumbnailUrl(row.imageUrl, 240);
  const metadata = [];
  if (row.plateNumber) {
    metadata.push({ label: 'Plate Number', value: String(row.plateNumber) });
  }
  if (row.provider) {
    metadata.push({ label: 'Provider', value: row.provider });
  }
  return {
    id,
    label: row.label,
    imageUri: row.imageUrl,
    thumbnailUrl,
    metadata,
  };
});

const chunkManifest = [];
chunkEntries.forEach((_, index) => {
  if (index % chunkSize !== 0) {
    return;
  }
  const chunkIndex = Math.floor(index / chunkSize);
  const chunkId = String(chunkIndex).padStart(3, '0');
  const slice = chunkEntries.slice(index, index + chunkSize);
  const fileName = `chunk-${chunkId}.json`;
  const chunkPath = resolve(chunkDir, fileName);
  writeFileSync(chunkPath, `${JSON.stringify(slice, null, 2)}\n`, 'utf8');
  chunkManifest.push({
    id: chunkId,
    path: `/plates/chunks/${fileName}`,
    startIndex: index,
    count: slice.length,
  });
});

mkdirSync(resolve(publicDir, 'plates'), { recursive: true });
writeFileSync(
  manifestPath,
  `${JSON.stringify({
    total: plateEntries.length,
    chunkSize,
    chunks: chunkManifest,
  }, null, 2)}\n`,
  'utf8',
);
console.log(`Wrote ${chunkManifest.length} plate chunks to ${manifestPath}`);
