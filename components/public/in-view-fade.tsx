"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type InViewFadeProps = {
  children: React.ReactNode;
  className?: string;
};

export function InViewFade({ children, className }: InViewFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "0px 56px 96px 56px",
        threshold: 0.12,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "lazy-fade",
        shown ? "is-visible" : "is-pending",
        className,
      )}
    >
      {children}
    </div>
  );
}
