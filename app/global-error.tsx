"use client";

import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/feedback/status-screen";
import { siteConfig } from "@/config/site";
import { fontHtmlClassName } from "@/lib/fonts";

import "@/styles/globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html
      lang={siteConfig.locale}
      dir={siteConfig.dir}
      className={`${fontHtmlClassName} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <StatusScreen
          title="שגיאה כללית"
          description="לא הצלחנו לטעון את האתר. נסו לרענן את הדף."
          action={
            <Button type="button" onClick={reset}>
              רענון
            </Button>
          }
        />
      </body>
    </html>
  );
}
