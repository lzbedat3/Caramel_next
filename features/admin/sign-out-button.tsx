"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" aria-label="יציאה מפורטל הניהול">
        יציאה
      </Button>
    </form>
  );
}
