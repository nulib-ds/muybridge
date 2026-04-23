import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlateEntry } from "./types";

const MANIFEST_PATH = "/plates/chunks.json";

interface ChunkDescriptor {
  id: string;
  path: string;
  startIndex: number;
  count: number;
}

interface ChunkManifest {
  total: number;
  chunkSize: number;
  chunks: ChunkDescriptor[];
}

interface PlateChunkSourceState {
  entries: PlateEntry[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  ready: boolean;
  requestNextChunk: () => void;
}

export function usePlateChunkSource(enabled: boolean): PlateChunkSourceState {
  const [manifest, setManifest] = useState<ChunkManifest | null>(null);
  const [manifestError, setManifestError] = useState<Error | null>(null);
  const [chunksLoaded, setChunksLoaded] = useState(0);
  const [entries, setEntries] = useState<PlateEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [chunkError, setChunkError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || manifest || manifestError) {
      return;
    }

    let cancelled = false;
    fetch(MANIFEST_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch plate manifest (${response.status})`);
        }
        return response.json();
      })
      .then((data: ChunkManifest) => {
        if (!cancelled) {
          setManifest(data);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setManifestError(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, manifest, manifestError]);

  const requestNextChunk = useCallback(() => {
    if (!manifest || loading) {
      return;
    }
    if (chunksLoaded >= manifest.chunks.length) {
      return;
    }

    const descriptor = manifest.chunks[chunksLoaded];
    setLoading(true);
    setChunkError(null);

    fetch(descriptor.path)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load plate chunk ${descriptor.id}`);
        }
        return response.json();
      })
      .then((data: PlateEntry[]) => {
        setEntries((previous) => [...previous, ...data]);
        setChunksLoaded((previous) => previous + 1);
        setLoading(false);
      })
      .catch((error: Error) => {
        setChunkError(error);
        setLoading(false);
      });
  }, [manifest, loading, chunksLoaded]);

  const hasMore = useMemo(() => {
    if (!manifest) {
      return false;
    }
    return chunksLoaded < manifest.chunks.length;
  }, [manifest, chunksLoaded]);

  return {
    entries,
    loading,
    error: manifestError ?? chunkError,
    hasMore,
    ready: Boolean(manifest),
    requestNextChunk,
  };
}
