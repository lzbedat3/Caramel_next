import { cn } from "@/lib/cn";

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
};

export function Surface({ children, className }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface/90 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
