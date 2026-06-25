import React, {useEffect, useRef, useState} from "react";
import cacheIndex from "../../.cache/iiif/index.json";

import manifest663 from "../../assets/iiif/plate-number-663-mule-miscellaneous-performances-denver.json";
import manifest333 from "../../assets/iiif/plate-number-333-boxing-one-man-knocking-the-other-one-down.json";
import manifest716 from "../../assets/iiif/plate-number-716-cat-walking-change-to-galloping.json";
import manifest626 from "../../assets/iiif/plate-number-626-annie-g-galloping.json";

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
    manifest626,
    "https://nulib-ds.github.io/muybridge/iiif/plate-number-626-annie-g-galloping.json",
  ),
  extractItem(
    manifest333,
    "https://nulib-ds.github.io/muybridge/iiif/plate-number-333-boxing-one-man-knocking-the-other-one-down.json",
  ),
  extractItem(
    manifest663,
    "https://nulib-ds.github.io/muybridge/iiif/plate-number-663-mule-miscellaneous-performances-denver.json",
  ),
  extractItem(
    manifest716,
    "https://nulib-ds.github.io/muybridge/iiif/plate-number-716-cat-walking-change-to-galloping.json",
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
      className={`featured-item${reversed ? " featured-item--reversed" : ""}`}
      aria-label={label}
    >
      <div className="featured-item__media">
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

      <div className="featured-item__content">
        <h2
          style={{
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
            alignItems: "baseline",
          }}
        >
          {metadata.map(({label: key, value}) => (
            <React.Fragment key={key}>
              <dt
                style={{
                  fontSize: "0.722rem",
                  textTransform: "uppercase",
                  color: "var(--color-gray-700)",
                  alignSelf: "baseline",
                  paddingTop: "0.1em",
                }}
              >
                {key}
              </dt>
              <dd
                style={{
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
