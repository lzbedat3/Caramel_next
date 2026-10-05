"use client";

import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/feedback/status-screen";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StatusScreen
      title="משהו השתבש"
      description="נסו שוב בעוד רגע. אם הבעיה נמשכת, חזרו לדף הבית."
      action={
        <Button type="button" onClick={reset}>
          נסו שוב
        </Button>
      }
    />
  );
}
