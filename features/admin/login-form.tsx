"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("לא הצלחנו להתחבר. בדקו את הפרטים ונסו שוב.");
        return;
      }

      router.replace(getSafeRedirectPath(nextPath, routes.admin));
      router.refresh();
    } catch {
      setError("מערכת ההתחברות עדיין לא מוגדרת במלואה.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-start text-sm">
        <span className="text-muted">אימייל</span>
        <input
          required
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="rounded-control border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-2 text-start text-sm">
        <span className="text-muted">סיסמה</span>
        <input
          required
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="rounded-control border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {error ? (
        <p className="rounded-control bg-surface-warm px-4 py-3 text-sm text-caramel-deep">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "מתחבר…" : "כניסה"}
      </Button>
    </form>
  );
}
