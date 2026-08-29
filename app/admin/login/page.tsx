import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Surface } from "@/components/ui/surface";
import { LoginForm } from "@/features/admin/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const metadata: Metadata = {
  title: "כניסה לניהול",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex flex-1 flex-col justify-center py-16">
      <Container className="max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm text-muted">פורטל ניהול</p>
          <h1 className="mt-2 font-display text-4xl text-foreground">כניסה</h1>
        </div>
        <Surface className="px-6 py-8 sm:px-8">
          <LoginForm nextPath={next} />
        </Surface>
      </Container>
    </main>
  );
}
