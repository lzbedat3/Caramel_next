"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { SocialPlatformIcon } from "@/features/public/social/social-platform-icon";
import {
  firstSocialError,
  validateSocialLink,
  type SocialFieldErrors,
} from "@/lib/admin/social";
import { cn } from "@/lib/cn";
import { socialLabel, type SocialPlatform } from "@/lib/social";
import type { AdminSocialLink } from "@/services/admin-social";

import type { SocialActionState } from "./actions";
import { SocialFields } from "./social-fields";

type SocialItemCardProps = {
  link: AdminSocialLink;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (formData: FormData) => Promise<SocialActionState>;
  onDelete: (formData: FormData) => Promise<SocialActionState>;
  onMove: (direction: "up" | "down") => Promise<SocialActionState>;
  onToggleVisibility: (visible: boolean) => Promise<SocialActionState>;
};

export function SocialItemCard({
  link,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onDelete,
  onMove,
  onToggleVisibility,
}: SocialItemCardProps) {
  const formId = useId();
  const [platform, setPlatform] = useState<SocialPlatform>(link.platform);
  const [errors, setErrors] = useState<SocialFieldErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fieldErrors = validateSocialLink({
      platform: String(formData.get("platform") ?? ""),
      url: String(formData.get("url") ?? ""),
    });

    if (firstSocialError(fieldErrors)) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    const result = await onUpdate(formData);
    if (result.status === "saved") {
      setConfirmingDelete(false);
    }
    setSaving(false);
  }

  async function confirmDelete() {
    const formData = new FormData();
    formData.set("id", String(link.id));
    setSaving(true);
    await onDelete(formData);
    setSaving(false);
  }

  return (
    <article className="rounded-card border border-border bg-surface px-4 py-4 sm:px-5">
      <form onSubmit={onSubmit} aria-busy={busy} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={link.id} />
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-warm text-foreground">
            <SocialPlatformIcon platform={platform} className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {socialLabel(platform)}
              </span>
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-xs",
                  link.is_visible
                    ? "bg-open-soft text-open"
                    : "bg-surface-warm text-muted",
                )}
              >
                {link.is_visible ? "גלוי" : "מוסתר"}
              </span>
            </div>
            <SocialFields
              idPrefix={formId}
            platform={platform}
            url={link.url}
              disabled={busy}
              platformError={errors.platform}
              urlError={errors.url}
              onPlatformChange={setPlatform}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} className="px-4 py-2">
            {saving ? "שומר…" : "שמירת שינויים"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="px-4 py-2"
            aria-pressed={link.is_visible}
            onClick={() => {
              void onToggleVisibility(!link.is_visible);
            }}
          >
            {link.is_visible ? "הסתרה מהאתר" : "הצגה באתר"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || isFirst}
            className="px-4 py-2"
            onClick={() => {
              void onMove("up");
            }}
          >
            הזזה למעלה
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || isLast}
            className="px-4 py-2"
            onClick={() => {
              void onMove("down");
            }}
          >
            הזזה למטה
          </Button>
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-caramel-deep">למחוק את הקישור?</p>
              <Button
                type="button"
                disabled={busy}
                className="px-4 py-2"
                onClick={() => {
                  void confirmDelete();
                }}
              >
                אישור מחיקה
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                className="px-4 py-2"
                onClick={() => setConfirmingDelete(false)}
              >
                ביטול
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className="px-4 py-2"
              onClick={() => setConfirmingDelete(true)}
            >
              מחיקה
            </Button>
          )}
        </div>
      </form>
    </article>
  );
}
