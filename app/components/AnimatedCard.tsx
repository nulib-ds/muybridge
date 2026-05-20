import React, {useEffect, useRef, useState} from "react";

interface Props {
  href: string;
  title?: string;
  src?: string;
  staticSrc?: string;
  imgWidth?: number;
  imgHeight?: number;
  aspectRatio?: number;
}

const DEFAULT_RATIO = 4 / 3;

export default function AnimatedCard({
  href,
  title,
  src,
  staticSrc,
  imgWidth,
  imgHeight,
  aspectRatio,
}: Props) {
  const containerRef = useRef<HTMLAnchorElement>(null);
  const [inView, setInView] = useState(false);
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [everActive, setEverActive] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            obs.unobserve(el);
            break;
          }
        }
      },
      {root: null, rootMargin: "100px", threshold: 0.1},
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const w = Number(imgWidth);
  const h = Number(imgHeight);
  const hasAspectRatio =
    Number.isFinite(Number(aspectRatio)) && Number(aspectRatio) > 0;
  const hasDimensions =
    Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0;
  const ratio = hasAspectRatio
    ? Number(aspectRatio)
    : hasDimensions
      ? w / h
      : DEFAULT_RATIO;
  const paddingPercent = 100 / ratio;

  const canAnimate =
    staticSrc &&
    src !== staticSrc &&
    (typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function activate() {
    if (canAnimate) {
      setActive(true);
      setEverActive(true);
    }
  }
  function deactivate() {
    setActive(false);
  }

  return (
    <a
      ref={containerRef}
      href={href}
      className="canopy-card"
      data-in-view={inView ? "true" : "false"}
      data-image-loaded={staticLoaded ? "true" : "false"}
      onMouseEnter={activate}
      onMouseLeave={deactivate}
      onFocus={activate}
      onBlur={deactivate}
    >
      <figure>
        <div
          className="canopy-card-media"
          style={
            {"--canopy-card-padding": `${paddingPercent}%`} as React.CSSProperties
          }
        >
          {inView && (
            <>
              <img
                src={staticSrc || src}
                alt={title || ""}
                aria-hidden={!title ? "true" : undefined}
                loading="lazy"
                onLoad={() => setStaticLoaded(true)}
                onError={() => setStaticLoaded(true)}
              />
              {canAnimate && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: active ? 1 : 0,
                    transition: "opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <img
                    src={everActive ? src : undefined}
                    alt=""
                    style={{width: "100%", height: "100%", objectFit: "cover"}}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <figcaption>{title && <span>{title}</span>}</figcaption>
      </figure>
    </a>
  );
}
