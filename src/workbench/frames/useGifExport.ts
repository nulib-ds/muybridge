import { useCallback, useEffect, useRef, useState } from "react";
import type { GifExportOptions, GifExportResult } from "./gifEncoder";
import { encodeGifFromFrames } from "./gifEncoder";

export type GifExportRequest = Omit<GifExportOptions, "signal">;

interface UseGifExportResult {
  exportGif: (options: GifExportRequest) => Promise<GifExportResult>;
  cancelExport: () => void;
  isExporting: boolean;
  error: string | null;
}

export function useGifExport(): UseGifExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const cancelExport = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const exportGif = useCallback(async (options: GifExportRequest) => {
    if (isExporting) {
      throw new Error("A GIF export is already in progress");
    }
    setIsExporting(true);
    setError(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const result = await encodeGifFromFrames({ ...options, signal: controller.signal });
      return result;
    } catch (error_) {
      if (!(error_ instanceof DOMException && error_.name === "AbortError")) {
        const message = error_ instanceof Error ? error_.message : "Failed to export GIF";
        setError(message);
      }
      throw error_;
    } finally {
      abortControllerRef.current = null;
      setIsExporting(false);
    }
  }, [isExporting]);

  return {
    exportGif,
    cancelExport,
    isExporting,
    error,
  };
}
