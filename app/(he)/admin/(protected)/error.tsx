"use client";

import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/feedback/status-screen";

export default function AdminErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      title="שגיאה בפורטל הניהול"
      description="לא הצלחנו לטעון את האזור המאובטח. נסו שוב."
      action={
        <Button type="button" onClick={reset}>
          נסו שוב
        </Button>
      }
    />
  );
}
