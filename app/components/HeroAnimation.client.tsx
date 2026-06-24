import React, {useEffect, useRef, useState} from "react";

const DEFAULT_MANIFEST_ID =
  "https://nulib-ds.github.io/muybridge/iiif/plate-number-613-nellie-rose-trotting-harnessed-to-sulky.json";

function lqipSrcFromManifest(manifestUrl: string): string {
  return manifestUrl
    .replace("/iiif/", "/images/lqip/")
    .replace(/\.json$/, ".gif");
}

interface Props {
  iiifContent?: string;
}

export default function HeroAnimation({
  iiifContent = DEFAULT_MANIFEST_ID,
}: Props) {
  const [frames, setFrames] = useState<string[]>([]);
  const [intervalMs, setIntervalMs] = useState(100);
  const [frame, setFrame] = useState(0);
  const [framesReady, setFramesReady] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const lqipSrc = lqipSrcFromManifest(iiifContent);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const heroHeight = window.innerHeight * 0.25;
        const scrolled = window.scrollY;
        setOpacity(Math.max(0, 1 - scrolled / heroHeight));
      });
    };
    window.addEventListener("scroll", onScroll, {passive: true});
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(iiifContent)
      .then((r) => r.json())
      .then((manifest) => {
        if (cancelled) return;
        const canvas = manifest.items[0];
        const f: string[] = canvas.items[0].items.map((a: any) => a.body.id);
        const ms = (canvas.duration * 1000) / f.length;
        setFrames(f);
        setIntervalMs(ms);
        setFrame(0);
        // Preload all frame images before revealing them
        Promise.all(
          f.map(
            (src) =>
              new Promise<void>((resolve) => {
                const img = new window.Image();
                img.onload = img.onerror = () => resolve();
                img.src = src;
              }),
          ),
        ).then(() => {
          if (!cancelled) setFramesReady(true);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [iiifContent]);

  useEffect(() => {
    if (!framesReady) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current = 0;
    const tick = () => {
      current = (current + 1) % frames.length;
      setFrame(current);
      timerRef.current = setTimeout(tick, intervalMs);
    };
    timerRef.current = setTimeout(tick, intervalMs);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [framesReady, frames, intervalMs]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "61.8vh",
        minHeight: "300px",
        marginTop: "-1rem",
        overflow: "hidden",
        zIndex: 0,
        opacity,
      }}
    >
      {/* LQIP: visible immediately, fades out once full frames are ready */}
      <img
        src={lqipSrc}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          opacity: framesReady ? 0 : 0.382,
          filter: "blur(1px)",
          transition: "opacity 0.6s ease",
          imageRendering: "auto",
        }}
      />
      {/* Full frames: fade in once preloaded */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: framesReady ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        {frames.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center center",
              opacity: i === frame ? 0.382 : 0,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, transparent 38.2%, #0009 61.8%, var(--color-gray-50) 100%)",
          zIndex: 1,
        }}
      />
    </div>
  );
}
