import type { Metadata } from "next";


export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-foreground relative flex min-h-dvh flex-1 flex-col">
      {children}
    </div>
  );
}
