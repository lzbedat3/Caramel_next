"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { getSafeAdminPath } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      router.replace(getSafeAdminPath(nextPath));
      router.refresh();
    } catch {
      setError("מערכת ההתחברות עדיין לא מוגדרת במלואה.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="portal-field">
        <span>אימייל</span>
        <input
          required
          id="email"
          name="email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className="portal-input"
        />
      </label>
      <label className="portal-field">
        <span>סיסמה</span>
        <span className="portal-control">
          <input
            required
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="current-password"
            className="portal-input"
          />
          <button
            type="button"
            className="portal-toggle"
            aria-pressed={showPassword}
            aria-label={showPassword ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
            title={showPassword ? "הסתרת הסיסמה" : "הצגת הסיסמה"}
            onClick={() => setShowPassword((value) => !value)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              {showPassword ? (
                <path
                  d="M4 4l16 16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              ) : null}
            </svg>
          </button>
        </span>
      </label>
      {error ? (
        <p role="alert" className="portal-error">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "מתחבר…" : "כניסה"}
      </Button>
    </form>
  );
}
