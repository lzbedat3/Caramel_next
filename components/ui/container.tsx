import { cn } from "@/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "header" | "footer";
};

export function Container({
  children,
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12",
        className,
      )}
    >
      {children}
    </Component>
  );
}
