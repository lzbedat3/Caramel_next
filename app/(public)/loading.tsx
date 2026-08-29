import {
  publicHeroFrameClassName,
  publicIdentitySeamClassName,
} from "@/components/public/hero-frame";
import { cn } from "@/lib/cn";

export default function PublicLoading() {
  return (
    <div id="content" className="flex flex-1 flex-col">
      <div
        className={cn(publicHeroFrameClassName, "animate-pulse bg-surface-warm")}
        aria-hidden="true"
      />
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12">
        <div className={publicIdentitySeamClassName}>
          <div className="size-[var(--identity-mark)] rounded-full bg-surface shadow-soft ring-4 ring-white" />
          <div className="flex items-center gap-2">
            <div className="h-[2.125rem] w-16 rounded-pill bg-pistachio/40" />
            <div className="h-[2.125rem] w-28 rounded-pill bg-pistachio-soft/70" />
          </div>
        </div>
        <div className="mt-7 h-12 w-48 rounded-pill bg-surface-warm sm:mt-8" />
        <div className="mt-4 h-6 w-72 max-w-full rounded-pill bg-surface-warm/80" />
        <div className="mt-10 h-5 w-40 rounded-pill bg-surface-warm/70" />
        <div className="mt-10 flex gap-3 overflow-hidden">
          <div className="size-[6.75rem] shrink-0 rounded-[1.25rem] bg-surface-warm/80 md:size-24 lg:size-20 xl:size-[4.75rem]" />
          <div className="size-[6.75rem] shrink-0 rounded-[1.25rem] bg-surface-warm/80 md:size-24 lg:size-20 xl:size-[4.75rem]" />
          <div className="size-[6.75rem] shrink-0 rounded-[1.25rem] bg-surface-warm/80 md:size-24 lg:size-20 xl:size-[4.75rem]" />
          <div className="hidden size-24 shrink-0 rounded-[1.25rem] bg-surface-warm/80 md:block lg:size-20 xl:size-[4.75rem]" />
          <div className="hidden size-24 shrink-0 rounded-[1.25rem] bg-surface-warm/80 md:block lg:size-20 xl:size-[4.75rem]" />
          <div className="hidden size-24 shrink-0 rounded-[1.25rem] bg-surface-warm/80 md:block lg:size-20 xl:size-[4.75rem]" />
          <div className="hidden size-20 shrink-0 rounded-[1.25rem] bg-surface-warm/80 lg:block xl:size-[4.75rem]" />
          <div className="hidden size-20 shrink-0 rounded-[1.25rem] bg-surface-warm/80 lg:block xl:size-[4.75rem]" />
          <div className="hidden size-[4.75rem] shrink-0 rounded-[1.25rem] bg-surface-warm/80 xl:block" />
          <div className="hidden size-[4.75rem] shrink-0 rounded-[1.25rem] bg-surface-warm/80 xl:block" />
        </div>
      </div>
    </div>
  );
}
