"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import {
  HERO_ACCEPT,
  durationInputValue,
  heroMediaTypeFromMime,
  resolveHeroMime,
  validateHeroFile,
  validateHeroMetadata,
  type HeroMediaType,
} from "@/lib/admin/hero";
import { cn } from "@/lib/cn";
import type { AdminHeroItem } from "@/services/admin-hero";

import type { HeroActionState } from "./actions";
import { HeroMediaFields } from "./hero-media-fields";
import {
  removeUploadedHeroFile,
  uploadHeroFile,
} from "./storage-upload";

type HeroItemCardProps = {
  item: AdminHeroItem;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (formData: FormData) => Promise<HeroActionState>;
  onDelete: (formData: FormData) => Promise<HeroActionState>;
  onMove: (direction: "up" | "down") => Promise<HeroActionState>;
};

export function HeroItemCard({
  item,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onDelete,
  onMove,
}: HeroItemCardProps) {
  const formId = useId();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacement, setReplacement] = useState<File | null>(null);
  const [replacementType, setReplacementType] = useState<HeroMediaType | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;
  const previewType = replacementType ?? item.type;
  const previewSrc = previewUrl ?? item.src;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearReplacement() {
    setReplacement(null);
    setReplacementType(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
    }
  }

  function onReplaceChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const error = validateHeroFile(file);
    if (error) {
      setFileError(error);
      event.target.value = "";
      return;
    }

    const mime = resolveHeroMime(file);
    const type = mime ? heroMediaTypeFromMime(mime) : null;
    if (!type) {
      setFileError("סוג הקובץ אינו נתמך");
      event.target.value = "";
      return;
    }

    setFileError(null);
    setReplacement(file);
    setReplacementType(type);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(file);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const metadataErrors = validateHeroMetadata({
      altText: String(formData.get("alt_text") ?? ""),
      duration: String(formData.get("duration_seconds") ?? ""),
      isVisible: formData.get("is_visible") === "on",
      autoplay: formData.get("autoplay") === "on",
      loop: formData.get("loop") === "on",
      muted: formData.get("muted") === "on",
    });

    if (metadataErrors.duration) {
      setDurationError(metadataErrors.duration);
      return;
    }

    setDurationError(null);
    setSaving(true);
    let uploadedPath: string | null = null;

    if (replacement) {
      const uploaded = await uploadHeroFile(replacement);
      if ("error" in uploaded) {
        setFileError(uploaded.error);
        setSaving(false);
        return;
      }
      uploadedPath = uploaded.path;
      formData.set("storage_path", uploaded.path);
    }

    const result = await onUpdate(formData);
    if (result.status === "error" && uploadedPath) {
      await removeUploadedHeroFile(uploadedPath);
    }
    if (result.status === "saved") {
      clearReplacement();
      setConfirmingDelete(false);
    }
    setSaving(false);
  }

  async function confirmDelete() {
    const formData = new FormData();
    formData.set("id", String(item.id));
    setSaving(true);
    await onDelete(formData);
    setSaving(false);
  }

  return (
    <article className="rounded-card border border-border bg-surface px-4 py-4 sm:px-5">
      <form onSubmit={onSubmit} aria-busy={busy} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={item.id} />
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-control bg-surface-warm sm:h-28 sm:w-40">
            {previewSrc ? (
              previewType === "video" ? (
                <video
                  src={previewSrc}
                  className="size-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : previewSrc.startsWith("blob:") ? (
                // Local blob preview is not in the remote image loader.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={item.alt_text ?? ""}
                  className="size-full object-cover"
                />
              ) : (
                <Image
                  src={previewSrc}
                  alt={item.alt_text ?? ""}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              )
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted">
                אין תצוגה
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {previewType === "video" ? "סרטון" : "תמונה"}
              </p>
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-xs",
                  item.is_visible
                    ? "bg-open-soft text-open"
                    : "bg-surface-warm text-muted",
                )}
              >
                {item.is_visible ? "גלוי" : "מוסתר"}
              </span>
            </div>
            <div className="mt-3">
              <HeroMediaFields
                idPrefix={formId}
                altText={item.alt_text ?? ""}
                duration={durationInputValue(item.duration_seconds)}
                isVisible={item.is_visible}
                autoplay={item.autoplay}
                loop={item.loop}
                muted={item.muted}
                showVideoSettings={previewType === "video"}
                disabled={busy}
                durationError={durationError ?? undefined}
              />
            </div>
          </div>
        </div>

        {fileError ? (
          <p role="alert" className="text-sm text-caramel-deep">
            {fileError}
          </p>
        ) : replacement ? (
          <p className="text-xs text-muted-soft">
            קובץ חדש מוכן: {replacement.name}. יישמר בלחיצה על שמירה.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} className="px-4 py-2">
            {saving ? "שומר…" : "שמירת שינויים"}
          </Button>
          <input
            ref={replaceInputRef}
            id={`${formId}-replace`}
            type="file"
            accept={HERO_ACCEPT}
            onChange={onReplaceChange}
            disabled={busy}
            className="peer sr-only"
          />
          <label
            htmlFor={`${formId}-replace`}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-warm peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              busy && "pointer-events-none opacity-60",
            )}
          >
            החלפת קובץ
          </label>
          {replacement ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className="px-4 py-2"
              onClick={clearReplacement}
            >
              ביטול קובץ
            </Button>
          ) : null}
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
              <p className="text-sm text-caramel-deep">למחוק את הפריט?</p>
              <Button
                type="button"
                disabled={busy}
                className="px-4 py-2"
                onClick={confirmDelete}
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
