import { PublicPageShell } from "@/components/public/page-shell";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <PublicPageShell>{children}</PublicPageShell>;
}
