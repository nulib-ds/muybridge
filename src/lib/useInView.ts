import { useEffect, useRef, useState } from "react";

type UseInViewOptions = IntersectionObserverInit;

export function useInView<T extends Element = HTMLElement>(options?: UseInViewOptions) {
  const targetRef = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) {
      return undefined;
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) {
          return;
        }
        entries.forEach((entry) => {
          if (entry.target === element) {
            if (entry.isIntersecting) {
              setInView(true);
              setHasIntersected(true);
            } else {
              setInView(false);
            }
          }
        });
      },
      {
        root: options?.root ?? null,
        rootMargin: options?.rootMargin,
        threshold: options?.threshold ?? 0,
      },
    );
    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [options?.root, options?.rootMargin, options?.threshold]);

  return { ref: targetRef, inView, hasIntersected } as const;
}
