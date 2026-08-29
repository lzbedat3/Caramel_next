"use client";

import { useState } from "react";

import type { AdminSocialLink } from "@/services/admin-social";

import {
  createSocialLink,
  deleteSocialLink,
  moveSocialLink,
  setSocialVisibility,
  updateSocialLink,
  type SocialActionState,
} from "./actions";
import { SocialCreateForm } from "./social-create-form";
import { SocialItemCard } from "./social-item-card";

const idleState: SocialActionState = { status: "idle", message: null };

type SocialManagerProps = {
  links: AdminSocialLink[];
};

export function SocialManager({ links }: SocialManagerProps) {
  const [feedback, setFeedback] = useState<SocialActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busy = busyKey !== null;

  async function run(
    key: string,
    action: () => Promise<SocialActionState>,
  ): Promise<SocialActionState> {
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

      <SocialCreateForm
        disabled={busy}
        onCreate={(formData) => run("create", () => createSocialLink(formData))}
      />

      {links.length === 0 ? (
        <p className="rounded-card border border-border bg-surface px-5 py-6 text-sm leading-6 text-muted">
          אין קישורים עדיין. הוסיפו קישור כדי שיופיע באתר הציבורי.
        </p>
      ) : (
        <ul className="flex flex-col gap-4" aria-label="רשימת קישורים">
          {links.map((link, index) => (
            <li key={link.id}>
              <SocialItemCard
                key={`${link.id}-${link.updated_at}`}
                link={link}
                isFirst={index === 0}
                isLast={index === links.length - 1}
                disabled={busy}
                onUpdate={(formData) =>
                  run(`save-${link.id}`, () => updateSocialLink(formData))
                }
                onDelete={(formData) =>
                  run(`delete-${link.id}`, () => deleteSocialLink(formData))
                }
                onMove={(direction) => {
                  const formData = new FormData();
                  formData.set("id", String(link.id));
                  formData.set("direction", direction);
                  return run(`move-${link.id}`, () => moveSocialLink(formData));
                }}
                onToggleVisibility={(visible) => {
                  const formData = new FormData();
                  formData.set("id", String(link.id));
                  if (visible) {
                    formData.set("is_visible", "on");
                  }
                  return run(`visible-${link.id}`, () =>
                    setSocialVisibility(formData),
                  );
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
