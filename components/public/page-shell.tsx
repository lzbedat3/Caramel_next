import { cn } from "@/lib/cn";

type PublicPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PublicPageShell({ children, className }: PublicPageShellProps) {
  return (
    <div
      className={cn(
        "public-menu text-foreground relative flex min-h-dvh flex-1 flex-col",
        className,
      )}
    >
      <a
        href="#content"
        className="focus:rounded-pill focus:bg-surface focus:shadow-soft focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:ring-2"
      >
        דלג לתוכן
      </a>
      {children}
    </div>
  );
}
