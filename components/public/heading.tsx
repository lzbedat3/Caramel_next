import { cn } from "@/lib/cn";

type PublicHeadingProps = {
  as?: "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
  id?: string;
  invert?: boolean;
};

export function PublicHeading({
  as: Component = "h1",
  children,
  className,
  id,
  invert = false,
}: PublicHeadingProps) {
  return (
    <Component
      id={id}
      className={cn(
        "font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl",
        invert
          ? "menu-category-title"
          : "bg-gradient-to-l from-caramel-deep via-caramel to-caramel-soft bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </Component>
  );
}
