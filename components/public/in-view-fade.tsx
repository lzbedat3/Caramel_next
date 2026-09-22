"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

// One observer for the entire menu; content remains visible before hydration.
let observer: IntersectionObserver | undefined;
function getObserver() {
  return (observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-up");
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px 48px", threshold: 0.05 },
  ));
}

export function InViewFade({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const shared = getObserver();
    shared.observe(node);
    return () => shared.unobserve(node);
  }, []);
  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
