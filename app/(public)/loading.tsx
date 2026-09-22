import {
  publicHeroFrameClassName,
  publicIdentitySeamClassName,
} from "@/components/public/hero-frame";
import { cn } from "@/lib/cn";

export default function PublicLoading() {
  return (
    <div id="content" className="flex flex-1 flex-col">
      <div
        className={cn(
          publicHeroFrameClassName,
          "bg-surface-warm animate-pulse",
        )}
        aria-hidden="true"
      />
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className={publicIdentitySeamClassName}>
          <div className="bg-surface shadow-soft size-[var(--identity-mark)] rounded-full ring-4 ring-white" />
          <div className="flex items-center gap-2">
            <div className="rounded-pill bg-pistachio/40 h-[2.125rem] w-16" />
            <div className="rounded-pill bg-pistachio-soft/70 h-[2.125rem] w-28" />
          </div>
        </div>
        <div className="rounded-pill bg-surface-warm mt-2 h-8 w-48 sm:mt-3" />
        <div className="rounded-pill bg-surface-warm/80 mt-4 h-6 w-72 max-w-full" />
        <div className="rounded-pill bg-surface-warm/70 mt-3 h-5 w-40" />
        <div role="status" aria-label="טוען את התפריט" className="mt-3 pb-6">
          <span className="sr-only">טוען את התפריט…</span>
          <div aria-hidden="true" className="flex gap-3 overflow-hidden pb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="menu-skeleton bg-surface-warm h-14 w-32 shrink-0 rounded-full"
              />
            ))}
          </div>
          <div aria-hidden="true" className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface overflow-hidden rounded-[1.35rem]"
              >
                <div className="menu-skeleton bg-surface-warm aspect-[4/3]" />
                <div className="space-y-3 p-4">
                  <div className="menu-skeleton bg-surface-warm h-5 w-3/4 rounded" />
                  <div className="menu-skeleton bg-surface-warm h-4 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
