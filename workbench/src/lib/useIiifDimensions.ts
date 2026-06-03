import { useCallback, useEffect, useState } from "react";
import type { ImageDimensions } from "../annotations/annotation-utils";
import { isSmithsonianInfoUrl, toSmithsonianProxyUrl } from "./iiif";

export function useIiifDimensions(infoUrl: string) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refresh = useCallback(() => {
    setRequestVersion((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const trimmed = infoUrl.trim();
    if (!trimmed) {
      setDimensions(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadDimensions = async () => {
      // Smithsonian IDS doesn't send CORS headers for direct fetch, so route
      // through the local Vite proxy which makes the request same-origin.
      const fetchUrl = isSmithsonianInfoUrl(trimmed)
        ? toSmithsonianProxyUrl(trimmed)
        : trimmed;

      try {
        const response = await fetch(fetchUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as { width?: number; height?: number } & Record<string, unknown>;
        const width = Number(payload.width ?? (payload as Record<string, unknown>)["@width"]);
        const height = Number(payload.height ?? (payload as Record<string, unknown>)["@height"]);
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          throw new Error("IIIF info missing width/height");
        }
        if (!cancelled) {
          setDimensions({ width, height });
          setError(null);
        }
      } catch (thrownError) {
        if (cancelled) {
          return;
        }
        const message = thrownError instanceof Error ? thrownError.message : "Unknown error";
        setDimensions(null);
        setError(message);
      }
    };

    loadDimensions();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [infoUrl, requestVersion]);

  return { dimensions, error, refresh } as const;
}
