import Link from "next/link";

import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-gradient-to-br from-caramel-soft via-caramel to-caramel-deep text-white shadow-soft hover:brightness-110",
  ghost: "text-muted hover:bg-surface-warm hover:text-foreground",
  outline:
    "border border-border bg-surface/70 text-foreground hover:bg-surface-warm",
} as const;

export function buttonClassName(
  variant: keyof typeof variants = "primary",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center rounded-pill px-5 py-3 text-sm font-medium transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      {...props}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClassName(variant, className)}>
      {children}
    </Link>
  );
}
