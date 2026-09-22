"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const callbacks = new Map<Element, () => void>();
let observer: IntersectionObserver | undefined;
function watch(node: Element, reveal: () => void) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          callbacks.get(entry.target)?.();
          callbacks.delete(entry.target);
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "180px", threshold: 0 },
  );
  callbacks.set(node, reveal);
  observer.observe(node);
  return () => {
    callbacks.delete(node);
    observer?.unobserve(node);
  };
}

/** Keep distant rail images out of the request queue; text is always rendered. */
export function NearbyMedia({
  children,
  immediate = false,
}: {
  children: ReactNode;
  immediate?: boolean;
}) {
  const [visible, setVisible] = useState(immediate);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (visible || !ref.current) return;
    return watch(ref.current, () => setVisible(true));
  }, [visible]);
  return (
    <div ref={ref} className="absolute inset-0">
      {visible ? children : <noscript>{children}</noscript>}
    </div>
  );
}
