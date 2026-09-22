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
        "bg-surface shadow-lift relative flex size-[var(--identity-mark)] shrink-0 items-center justify-center overflow-hidden rounded-full ring-4 ring-white motion-safe:animate-[logo-settle_0.8s_cubic-bezier(0.22,1,0.36,1)_both]",
      )}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={name ? `לוגו ${name}` : "לוגו המסעדה"}
          fill
          sizes="(min-width: 640px) 80px, 64px"
          className="object-cover"
          unoptimized={isRemoteSvg(logoSrc)}
          loading="eager"
        />
      ) : initial ? (
        <span className="font-display text-caramel-deep text-4xl sm:text-5xl">
          {initial}
        </span>
      ) : (
        <span className="bg-caramel-soft/80 size-14 rounded-full sm:size-16" />
      )}
    </div>
  );
}
