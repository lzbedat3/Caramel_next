"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  compactCatalogImages,
  type CompactImagesState,
} from "@/features/admin/media/compact-images";

export function CompactImagesButton() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CompactImagesState | null>(null);

  async function onCompact() {
    setPending(true);
    setResult(null);
    try {
      setResult(await compactCatalogImages());
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-4">
      <p className="text-sm font-medium text-foreground">תמונות כבדות</p>
      <p className="mt-1 text-sm leading-6 text-muted">
        מכווץ תמונות מנות, קטגוריות ומדיה ראשית לגודל שמתאים לאתר. כדאי להריץ
        פעם אחת אחרי העלאות גדולות מהטלפון.
      </p>
      <Button
        className="mt-3"
        variant="outline"
        disabled={pending}
        onClick={onCompact}
      >
        {pending ? "דוחס…" : "דחיסת תמונות קיימות"}
      </Button>
      {result?.message ? (
        <p
          className={
            result.status === "error"
              ? "mt-3 text-sm text-caramel-deep"
              : "mt-3 text-sm text-open"
          }
          role={result.status === "error" ? "alert" : undefined}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
