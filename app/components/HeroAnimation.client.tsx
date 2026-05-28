import React, {useEffect, useRef, useState} from "react";
import manifest from "../../assets/iiif/plate-number-613-nellie-rose-trotting-harnessed-to-sulky.json";

const canvas = (manifest as any).items[0];
const FRAMES: string[] = canvas.items[0].items.map((a: any) => a.body.id);
const DURATION_MS = canvas.duration * 1000;
const INTERVAL_MS = DURATION_MS / FRAMES.length;

export default function HeroAnimation() {
  const [frame, setFrame] = useState(0);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let current = 0;
    const tick = () => {
      current = (current + 1) % FRAMES.length;
      setFrame(current);
      rafRef.current = setTimeout(tick, INTERVAL_MS);
    };
    rafRef.current = setTimeout(tick, INTERVAL_MS);
    return () => {
      if (rafRef.current !== null) clearTimeout(rafRef.current);
    };
  }, []);

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
      }}
    >
      {FRAMES.map((src, i) => (
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
            filter: "blur(5px)",
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
