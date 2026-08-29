import { cn } from "@/lib/cn";

type PublicPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PublicPageShell({ children, className }: PublicPageShellProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-1 flex-col text-foreground",
        className,
      )}
    >
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-soft focus:ring-2 focus:ring-ring"
      >
        דלג לתוכן
      </a>
      {children}
    </div>
  );
}
