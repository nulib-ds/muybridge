export interface PlateMetadataField {
  label: string;
  value: string;
}

export interface PlateCsvEntry {
  label: string;
  imageUri: string;
  metadata: PlateMetadataField[];
}

export interface PlateEntry extends PlateCsvEntry {
  id: string;
  thumbnailUrl: string | null;
}
