import { cn } from "@/lib/cn";

type StatusScreenProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function StatusScreen({
  title,
  description,
  action,
  className,
}: StatusScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-24 text-center",
        className,
      )}
    >
      <div className="mb-8 size-20 rounded-full bg-caramel-soft/70 shadow-soft" />
      <h1 className="font-display text-4xl text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-muted">
        {description}
      </p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
