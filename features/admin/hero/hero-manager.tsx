"use client";

import { useState } from "react";

import type { AdminHeroItem } from "@/services/admin-hero";

import {
  createHeroMedia,
  deleteHeroMedia,
  moveHeroMedia,
  updateHeroMedia,
  type HeroActionState,
} from "./actions";
import { HeroItemCard } from "./hero-item-card";
import { HeroUploadForm } from "./hero-upload-form";

const idleState: HeroActionState = { status: "idle", message: null };

type HeroManagerProps = {
  items: AdminHeroItem[];
};

export function HeroManager({ items }: HeroManagerProps) {
  const [feedback, setFeedback] = useState<HeroActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busy = busyKey !== null;

  async function run(
    key: string,
    action: () => Promise<HeroActionState>,
  ): Promise<HeroActionState> {
    setBusyKey(key);
    setFeedback(idleState);
    try {
      const result = await action();
      setFeedback(result);
      return result;
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="min-h-6 text-sm">
        {busy ? (
          <p className="text-muted">מעדכן…</p>
        ) : feedback.status === "saved" && feedback.message ? (
          <p className="text-open">{feedback.message}</p>
        ) : feedback.status === "error" && feedback.message ? (
          <p role="alert" className="text-caramel-deep">
            {feedback.message}
          </p>
        ) : null}
      </div>

      <HeroUploadForm
        disabled={busy}
        onCreate={(formData) => run("create", () => createHeroMedia(formData))}
      />

      {items.length === 0 ? (
        <p className="rounded-card border border-border bg-surface px-5 py-6 text-sm leading-6 text-muted">
          אין מדיה ראשית עדיין. העלו תמונה או סרטון כדי שיופיעו בהירו באתר.
        </p>
      ) : (
        <ul className="flex flex-col gap-4" aria-label="רשימת מדיה ראשית">
          {items.map((item, index) => (
            <li key={item.id}>
              <HeroItemCard
                key={`${item.id}-${item.updated_at}`}
                item={item}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                disabled={busy}
                onUpdate={(formData) =>
                  run(`save-${item.id}`, () => updateHeroMedia(formData))
                }
                onDelete={(formData) =>
                  run(`delete-${item.id}`, () => deleteHeroMedia(formData))
                }
                onMove={(direction) => {
                  const formData = new FormData();
                  formData.set("id", String(item.id));
                  formData.set("direction", direction);
                  return run(`move-${item.id}`, () => moveHeroMedia(formData));
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
