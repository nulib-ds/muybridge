import React, {useEffect, useRef, useState} from "react";
import cacheIndex from "../../.cache/iiif/index.json";

import manifest700 from "../../assets/iiif/plate-number-700-buffalo-galloping.json";
import manifest333 from "../../assets/iiif/plate-number-333-boxing-one-man-knocking-the-other-one-down.json";
import manifest716 from "../../assets/iiif/plate-number-716-cat-walking-change-to-galloping.json";
import manifest626 from "../../assets/iiif/plate-number-626-annie-g-galloping.json";
import manifest712 from "../../assets/iiif/plate-number-712-dog-jumping-hurdle-mastiff-dread.json";

interface MetadataEntry {
  label: string;
  value: string;
}

interface FeaturedItemData {
  frames: string[];
  label: string;
  metadata: MetadataEntry[];
  href: string;
}

type CacheEntry = {id: string; canonical: string};
const cache = cacheIndex as {byId: CacheEntry[]};

function findHref(assetPath: string): string {
  const filename = assetPath.split("/").pop()!;
  const exact = cache.byId.find((e) => e.id === assetPath);
  const byFilename = cache.byId.find((e) => e.id.endsWith("/" + filename));
  const canonical = (exact ?? byFilename)?.canonical ?? "#";
  return canonical.replace(/\.html$/, "");
}

function extractItem(manifest: any, assetPath: string): FeaturedItemData {
  const animationCanvas = manifest.items[0];
  const frames: string[] = animationCanvas.items[0].items.map(
    (a: any) => a.body.id,
  );
  const label: string = manifest.label?.en?.[0] ?? "";
  const metadata: MetadataEntry[] = (manifest.metadata ?? []).map((m: any) => ({
    label: m.label?.en?.[0] ?? "",
    value: m.value?.en?.[0] ?? "",
  }));
  return {frames, label, metadata, href: findHref(assetPath)};
}

const FEATURED: FeaturedItemData[] = [
  extractItem(
    manifest700,
    "assets/iiif/plate-number-700-buffalo-galloping.json",
  ),
  extractItem(
    manifest712,
    "assets/iiif/plate-number-712-dog-jumping-hurdle-mastiff-dread.json",
  ),
  extractItem(
    manifest333,
    "assets/iiif/plate-number-333-boxing-one-man-knocking-the-other-one-down.json",
  ),
  extractItem(
    manifest716,
    "assets/iiif/plate-number-716-cat-walking-change-to-galloping.json",
  ),
  extractItem(
    manifest626,
    "assets/iiif/plate-number-626-annie-g-galloping.json",
  ),
];

function FeaturedItem({
  frames,
  label,
  metadata,
  href,
  reversed,
}: FeaturedItemData & {reversed?: boolean}) {
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef(0);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const compute = () => {
      if (!sectionRef.current) return;
      const {top, height} = sectionRef.current.getBoundingClientRect();
      const scrollTravel = window.innerHeight + height;
      const scrolled = window.innerHeight - top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollTravel));
      setFrame(
        Math.min(Math.floor(progress * frames.length), frames.length - 1),
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };

    window.addEventListener("scroll", onScroll, {passive: true});
    compute();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [frames.length]);

  return (
    <section
      ref={sectionRef}
      style={{
        height: "61.8vh",
        maxHeight: "600px",
        position: "relative",
        marginBottom: "10vh",
      }}
      aria-label={label}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: reversed ? "row-reverse" : "row",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "61.8%",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {frames.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center center",
                opacity: i === frame ? 1 : 0,
                willChange: i === frame ? "opacity" : "auto",
              }}
            />
          ))}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "3rem",
            overflow: "auto",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--color-accent-default)",
              margin: "0 0 1rem",
            }}
          >
            Eadweard Muybridge · 1887
          </p>

          <h2
            style={{
              fontFamily: "var(--font-serif, 'Fraunces', Georgia, serif)",
              fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              margin: "0 0 2rem",
              lineHeight: 1.2,
            }}
          >
            {label}
          </h2>

          <dl
            style={{
              margin: "0 0 2.5rem",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              columnGap: "1.5rem",
              rowGap: "0.6rem",
            }}
          >
            {metadata.map(({label: key, value}) => (
              <React.Fragment key={key}>
                <dt
                  style={{
                    fontFamily: "var(--font-sans, system-ui, sans-serif)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--color-gray-500)",
                    alignSelf: "baseline",
                    paddingTop: "0.1em",
                  }}
                >
                  {key}
                </dt>
                <dd
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1rem",
                    fontWeight: 300,
                    margin: 0,
                  }}
                >
                  {value}
                </dd>
              </React.Fragment>
            ))}
          </dl>

          <a
            href={href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              textTransform: "uppercase",
              textDecoration: "none",
              borderBottom: "2px solid var(--color-accent-200)",
              paddingBottom: "0.15rem",
              width: "fit-content",
            }}
          >
            View
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6h8M6 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function FeaturedScroll() {
  return (
    <>
      {FEATURED.map((item, i) => (
        <FeaturedItem key={i} {...item} reversed={i % 2 === 1} />
      ))}
    </>
  );
}
