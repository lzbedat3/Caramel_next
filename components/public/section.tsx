import { cn } from "@/lib/cn";

import { Container } from "@/components/ui/container";

type PublicSectionProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  bleed?: boolean;
  id?: string;
  "aria-label"?: string;
};

export function PublicSection({
  children,
  className,
  containerClassName,
  bleed = false,
  id,
  "aria-label": ariaLabel,
}: PublicSectionProps) {
  if (bleed) {
    return (
      <section
        id={id}
        aria-label={ariaLabel}
        className={cn("w-full", className)}
      >
        {children}
      </section>
    );
  }

  return (
    <section id={id} aria-label={ariaLabel} className={cn("w-full", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
