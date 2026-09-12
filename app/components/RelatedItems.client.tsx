import React, {useEffect, useState} from "react";
import CloverSlider from "@samvera/clover-iiif/slider";

interface Props {
  manifestId?: string;
  labels?: string[];
  top?: number;
}

interface FacetSlider {
  label: string;
  url: string;
}

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function basePath() {
  const bp = (window as any).CANOPY_BASE_PATH || "";
  return bp.endsWith("/") ? bp.slice(0, -1) : bp;
}

function firstI18nString(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const key = Object.keys(value)[0];
  const arr = key ? value[key] : null;
  return Array.isArray(arr) && arr.length ? String(arr[0]) : "";
}

function manifestFacetValues(manifest: any) {
  const metadata = Array.isArray(manifest?.metadata) ? manifest.metadata : [];
  return metadata.flatMap((entry: any) => {
    const label = firstI18nString(entry?.label);
    if (!label) return [];
    const raw = entry?.value;
    const values: string[] =
      typeof raw === "string"
        ? [raw]
        : Object.values(raw || {}).flatMap((v) => (Array.isArray(v) ? v : []));
    return values.length ? [{label, values: values.map(String)}] : [];
  });
}

export default function RelatedItems({manifestId, labels, top = 3}: Props) {
  const [sliders, setSliders] = useState<FacetSlider[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      const root = basePath();
      const index = await fetch(`${root}/api/index.json`).then((r) => r.json());
      const version = typeof index?.version === "string" ? index.version : "";
      const query = version ? `?v=${encodeURIComponent(version)}` : "";

      const facets = await fetch(
        `${root}/api/search/facets.json${query}`,
      ).then((r) => r.json());

      const allowed = facets.filter(
        (facet: any) => !labels || labels.includes(String(facet.label)),
      );

      const facetUrl = (facet: any, valueSlug: string) =>
        `${root}/api/facet/${facet.slug || slugify(facet.label)}/${valueSlug}.json${query}`;

      let next: FacetSlider[];

      if (manifestId) {
        const manifest = await fetch(manifestId).then((r) => r.json());
        const indexed = new Map(
          allowed.map((facet: any) => [String(facet.label), facet]),
        );
        next = manifestFacetValues(manifest).flatMap((entry) => {
          const facet: any = indexed.get(entry.label);
          if (!facet) return [];
          const available = new Set(
            (facet.values || []).map((v: any) => v.slug || slugify(v.value)),
          );
          const candidates = entry.values
            .map(slugify)
            .filter((slug) => available.has(slug));
          if (!candidates.length) return [];
          const pick =
            candidates[Math.floor(Math.random() * candidates.length)];
          return [{label: entry.label, url: facetUrl(facet, pick)}];
        });
      } else {
        next = allowed.flatMap((facet: any) => {
          const ranked = (facet.values || [])
            .slice()
            .sort(
              (a: any, b: any) =>
                (b.doc_count || 0) - (a.doc_count || 0) ||
                String(a.value).localeCompare(String(b.value)),
            )
            .slice(0, top);
          if (!ranked.length) return [];
          const pick = ranked[Math.floor(Math.random() * ranked.length)];
          return [
            {
              label: String(facet.label),
              url: facetUrl(facet, pick.slug || slugify(pick.value)),
            },
          ];
        });
      }

      if (!cancelled) setSliders(next);
    }

    build();
    return () => {
      cancelled = true;
    };
  }, [manifestId, labels, top]);

  return (
    <>
      {sliders.map((slider) => (
        <div
          key={slider.url}
          className="canopy-slider"
          data-facet-label={slider.label}
        >
          <CloverSlider
            iiifContent={slider.url}
            align="start"
            slidesToScroll={1}
          />
        </div>
      ))}
    </>
  );
}
