"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { SocialPlatformIcon } from "@/features/public/social/social-platform-icon";
import {
  firstSocialError,
  validateSocialLink,
  type SocialFieldErrors,
} from "@/lib/admin/social";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social";

import type { SocialActionState } from "./actions";
import { SocialFields } from "./social-fields";

type SocialCreateFormProps = {
  disabled: boolean;
  onCreate: (formData: FormData) => Promise<SocialActionState>;
};

export function SocialCreateForm({ disabled, onCreate }: SocialCreateFormProps) {
  const formId = useId();
  const visibleId = `${formId}-visible`;
  const [platform, setPlatform] = useState<SocialPlatform>(
    SOCIAL_PLATFORMS[0] ?? "instagram",
  );
  const [errors, setErrors] = useState<SocialFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
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
    const result = await onCreate(formData);
    if (result.status === "saved") {
      form.reset();
      setPlatform(SOCIAL_PLATFORMS[0] ?? "instagram");
    }
    setSaving(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={busy}
      className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-warm text-foreground">
          <SocialPlatformIcon platform={platform} className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-medium text-foreground">קישור חדש</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            בחרו פלטפורמה והזינו כתובת שמתחילה ב-http:// או https://. רק קישורים
            גלויים מופיעים באתר.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <SocialFields
          idPrefix={formId}
          platform={platform}
          disabled={busy}
          platformError={errors.platform}
          urlError={errors.url}
          onPlatformChange={setPlatform}
        />
        <label
          htmlFor={visibleId}
          className="mt-3 flex cursor-pointer items-center gap-2 rounded-control px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
        >
          <input
            id={visibleId}
            name="is_visible"
            type="checkbox"
            defaultChecked
            disabled={busy}
            className="size-4 accent-caramel"
          />
          <span className="text-sm text-foreground">גלוי באתר הציבורי</span>
        </label>
      </div>

      <div className="mt-5">
        <Button type="submit" disabled={busy}>
          {saving ? "שומר…" : "הוספת קישור"}
        </Button>
      </div>
    </form>
  );
}
