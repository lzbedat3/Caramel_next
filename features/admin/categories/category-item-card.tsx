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
  CATEGORY_IMAGE_ACCEPT,
  validateCategoryImageFile,
  validateCategoryMetadata,
} from "@/lib/admin/category";
import { cn } from "@/lib/cn";
import type { AdminCategory } from "@/services/admin-categories";

import type { CategoryActionState } from "./actions";
import { CategoryFields } from "./category-fields";
import {
  removeUploadedCategoryImage,
  uploadCategoryImage,
} from "./storage-upload";

type CategoryItemCardProps = {
  category: AdminCategory;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (formData: FormData) => Promise<CategoryActionState>;
  onDelete: (formData: FormData) => Promise<CategoryActionState>;
  onMove: (direction: "up" | "down") => Promise<CategoryActionState>;
  onToggleVisibility: (visible: boolean) => Promise<CategoryActionState>;
};

export function CategoryItemCard({
  category,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onDelete,
  onMove,
  onToggleVisibility,
}: CategoryItemCardProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageAction, setImageAction] = useState<"keep" | "remove">("keep");
  const [fileError, setFileError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;
  const displaySrc =
    previewUrl ?? (imageAction === "remove" ? null : category.imageSrc);
  const itemLabel =
    category.itemCount === 0
      ? "אין מנות"
      : category.itemCount === 1
        ? "מנה אחת"
        : `${category.itemCount} מנות`;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearFile() {
    setFile(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) {
      return;
    }

    const error = validateCategoryImageFile(next);
    if (error) {
      setFileError(error);
      event.target.value = "";
      return;
    }

    setFileError(null);
    setImageAction("keep");
    setFile(next);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(next);
    });
  }

  function onRemoveImage() {
    setFileError(null);
    setImageAction("remove");
    clearFile();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const errors = validateCategoryMetadata({
      name: String(formData.get("name") ?? ""),
      subtitle: String(formData.get("subtitle") ?? ""),
    });

    if (errors.name) {
      setNameError(errors.name);
      return;
    }

    setNameError(null);
    setSaving(true);
    let uploadedPath: string | null = null;

    if (file) {
      const uploaded = await uploadCategoryImage(file);
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
      await removeUploadedCategoryImage(uploadedPath);
    }
    if (result.status === "saved") {
      clearFile();
      setImageAction("keep");
      setConfirmingDelete(false);
    }
    setSaving(false);
  }

  async function confirmDelete() {
    const formData = new FormData();
    formData.set("id", String(category.id));
    setSaving(true);
    await onDelete(formData);
    setSaving(false);
  }

  return (
    <article className="rounded-card border border-border bg-surface px-4 py-4 sm:px-5">
      <form onSubmit={onSubmit} aria-busy={busy} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="image_action" value={imageAction} />

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2 sm:w-28">
            <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-surface-warm">
              {displaySrc ? (
                displaySrc.startsWith("blob:") ? (
                  // Local blob preview is not in the remote image loader.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displaySrc}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <Image
                    src={displaySrc}
                    alt={category.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )
              ) : (
                <span className="font-display text-2xl text-caramel-deep">
                  {category.name.trim().charAt(0) || "•"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-soft">{itemLabel}</p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-xs",
                  category.is_visible
                    ? "bg-open-soft text-open"
                    : "bg-surface-warm text-muted",
                )}
              >
                {category.is_visible ? "גלויה" : "מוסתרת"}
              </span>
            </div>
            <CategoryFields
              idPrefix={formId}
              name={category.name}
              subtitle={category.subtitle ?? ""}
              disabled={busy}
              nameError={nameError ?? undefined}
            />
          </div>
        </div>

        {fileError ? (
          <p role="alert" className="text-sm text-caramel-deep">
            {fileError}
          </p>
        ) : file ? (
          <p className="text-xs text-muted-soft">
            תמונה חדשה מוכנה: {file.name}. תישמר בלחיצה על שמירה.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} className="px-4 py-2">
            {saving ? "שומר…" : "שמירת שינויים"}
          </Button>
          <input
            ref={fileInputRef}
            id={`${formId}-image`}
            type="file"
            accept={CATEGORY_IMAGE_ACCEPT}
            onChange={onFileChange}
            disabled={busy}
            className="peer sr-only"
          />
          <label
            htmlFor={`${formId}-image`}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-warm peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              busy && "pointer-events-none opacity-60",
            )}
          >
            {displaySrc ? "החלפת תמונה" : "העלאת תמונה"}
          </label>
          {displaySrc || category.imageSrc ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy || (!displaySrc && imageAction === "remove")}
              className="px-4 py-2"
              onClick={onRemoveImage}
            >
              הסרת תמונה
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="px-4 py-2"
            aria-pressed={category.is_visible}
            onClick={() => {
              void onToggleVisibility(!category.is_visible);
            }}
          >
            {category.is_visible ? "הסתרה מהאתר" : "הצגה באתר"}
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
              {category.itemCount > 0 ? (
                <>
                  <p className="max-w-sm text-sm text-caramel-deep">
                    לא ניתן למחוק קטגוריה עם {itemLabel}. יש להעביר או למחוק את
                    המנות קודם.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    className="px-4 py-2"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    סגירה
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-caramel-deep">למחוק את הקטגוריה?</p>
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
                </>
              )}
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
