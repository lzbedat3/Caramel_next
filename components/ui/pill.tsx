import { cn } from "@/lib/cn";

type PillProps = {
  children: React.ReactNode;
  className?: string;
};

export function Pill({ children, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border border-border bg-surface/80 px-4 py-1.5 text-sm font-medium tracking-wide text-muted shadow-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
