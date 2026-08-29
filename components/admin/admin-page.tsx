import { cn } from "@/lib/cn";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
          {description}
        </p>
      ) : null}
    </header>
  );
}

type AdminPageProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminPage({ children, className }: AdminPageProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
