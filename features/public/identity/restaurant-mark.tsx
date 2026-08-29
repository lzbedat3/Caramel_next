import Image from "next/image";

import { cn } from "@/lib/cn";
import { isRemoteSvg } from "@/lib/storage-url";

type RestaurantMarkProps = {
  name: string | null;
  logoSrc?: string | null;
};

export function RestaurantMark({ name, logoSrc }: RestaurantMarkProps) {
  const initial = name?.trim().charAt(0) ?? "";

  return (
    <div
      className={cn(
        "relative flex size-[var(--identity-mark)] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface shadow-lift ring-4 ring-white motion-safe:animate-[logo-settle_0.8s_cubic-bezier(0.22,1,0.36,1)_both]",
      )}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={name ? `לוגו ${name}` : "לוגו המסעדה"}
          fill
          sizes="(min-width: 1024px) 176px, (min-width: 640px) 144px, 112px"
          className="object-cover"
          unoptimized={isRemoteSvg(logoSrc)}
          priority
        />
      ) : initial ? (
        <span className="font-display text-4xl text-caramel-deep sm:text-5xl">
          {initial}
        </span>
      ) : (
        <span className="size-14 rounded-full bg-caramel-soft/80 sm:size-16" />
      )}
    </div>
  );
}
