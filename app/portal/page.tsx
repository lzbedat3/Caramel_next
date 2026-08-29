import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Surface } from "@/components/ui/surface";
import { LoginForm } from "@/features/admin/login-form";

type PortalPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata: Metadata = {
  title: "כניסה",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const { next } = await searchParams;

  return (
    <main id="content" className="flex flex-1 flex-col justify-center py-16">
      <Container className="max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-foreground">כניסה</h1>
        </div>
        <Surface className="px-6 py-8 sm:px-8">
          <LoginForm nextPath={next} />
        </Surface>
      </Container>
    </main>
  );
}
