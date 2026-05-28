import React, {useEffect, useRef, useState} from "react";

const DEFAULT_MANIFEST_ID =
  "https://nulib-ds.github.io/muybridge/iiif/plate-number-613-nellie-rose-trotting-harnessed-to-sulky.json";

interface Props {
  iiifContent?: string;
}

export default function HeroAnimation({
  iiifContent = DEFAULT_MANIFEST_ID,
}: Props) {
  const [frames, setFrames] = useState<string[]>([]);
  const [intervalMs, setIntervalMs] = useState(100);
  const [frame, setFrame] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

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
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [iiifContent]);

  useEffect(() => {
    if (!frames.length) return;
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
  }, [frames, intervalMs]);

  if (!frames.length) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "50vh",
        minHeight: "300px",
        marginTop: "-1rem",
        overflow: "hidden",
        zIndex: 0,
        opacity,
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
            opacity: i === frame ? 0.3 : 0,
            filter: "blur(10px)",
          }}
        />
      ))}
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
