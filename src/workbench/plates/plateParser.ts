import type { PlateCsvEntry, PlateMetadataField } from "./types";

const REQUIRED_COLUMNS = {
  label: "label",
  imageUri: "image uri",
  summary: "summary",
  date: "date",
  medium: "medium",
  homepageId: "homepage id",
  homepageLabel: "homepage label",
} as const;

type RequiredField = keyof typeof REQUIRED_COLUMNS;

function normalizeHeader(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tokenizeCsv(source: string): string[][] {
  const text = source.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushRow = () => {
    const completedRow = [...row, cell];
    const hasContent = completedRow.some((value) => value.trim().length > 0);
    if (hasContent) {
      rows.push(completedRow);
    }
    row = [];
    cell = "";
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

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      pushRow();
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    pushRow();
  }

  return rows;
}

export function parsePlateCsv(source: string): PlateCsvEntry[] {
  const rows = tokenizeCsv(source);
  if (!rows.length) {
    return [];
  }

  const [header, ...body] = rows;
  if (!header.length) {
    return [];
  }

  const headerLabels = header.map((label) => label.trim());
  const normalizedHeaders = headerLabels.map(normalizeHeader);
  const columnIndex = new Map<string, number>();
  normalizedHeaders.forEach((label, index) => {
    if (!label || columnIndex.has(label)) {
      return;
    }
    columnIndex.set(label, index);
  });

  const requiredKeys = new Map<string, RequiredField>();
  (Object.keys(REQUIRED_COLUMNS) as RequiredField[]).forEach((field) => {
    const normalized = REQUIRED_COLUMNS[field];
    requiredKeys.set(normalized, field);
  });

  const requiredHeaderSet = new Set<string>(Object.values(REQUIRED_COLUMNS));

  return body
    .map((row) => {
      const record: Record<RequiredField, string> = {
        label: "",
        imageUri: "",
        summary: "",
        date: "",
        medium: "",
        homepageId: "",
        homepageLabel: "",
      };
      let isViable = true;

      (Object.keys(REQUIRED_COLUMNS) as RequiredField[]).forEach((field) => {
        const normalized = REQUIRED_COLUMNS[field];
        const index = columnIndex.get(normalized);
        const raw = index === undefined ? "" : row[index] ?? "";
        const value = raw.trim();
        if ((field === "label" || field === "imageUri") && !value) {
          isViable = false;
        }
        record[field] = value;
      });

      if (!isViable) {
        return null;
      }

      const metadata: PlateMetadataField[] = [];
      headerLabels.forEach((label, index) => {
        const normalized = normalizedHeaders[index];
        if (!label || requiredHeaderSet.has(normalized)) {
          return;
        }
        const raw = row[index] ?? "";
        const value = raw.trim();
        if (!value) {
          return;
        }
        metadata.push({ label, value });
      });

      return { ...record, metadata } satisfies PlateCsvEntry;
    })
    .filter((entry): entry is PlateCsvEntry => Boolean(entry));
}
