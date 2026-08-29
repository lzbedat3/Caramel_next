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
  formatPriceInput,
  MENU_ITEM_IMAGE_ACCEPT,
  validateMenuItemImageFile,
  validateMenuItemMetadata,
} from "@/lib/admin/menu-item";
import { cn } from "@/lib/cn";
import { formatPriceIls } from "@/lib/price";
import type {
  AdminMenuCategoryOption,
  AdminMenuItem,
} from "@/services/admin-menu";

import type { MenuItemActionState } from "./actions";
import { MenuItemFields } from "./menu-item-fields";
import {
  removeUploadedMenuItemImage,
  uploadMenuItemImage,
} from "./storage-upload";

type MenuItemCardProps = {
  item: AdminMenuItem;
  categories: AdminMenuCategoryOption[];
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onUpdate: (formData: FormData) => Promise<MenuItemActionState>;
  onDelete: (formData: FormData) => Promise<MenuItemActionState>;
  onMove: (direction: "up" | "down") => Promise<MenuItemActionState>;
  onToggleVisibility: (visible: boolean) => Promise<MenuItemActionState>;
  onToggleAvailability: (available: boolean) => Promise<MenuItemActionState>;
};

export function MenuItemCard({
  item,
  categories,
  isFirst,
  isLast,
  disabled,
  onUpdate,
  onDelete,
  onMove,
  onToggleVisibility,
  onToggleAvailability,
}: MenuItemCardProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageAction, setImageAction] = useState<"keep" | "remove">("keep");
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    price?: string;
    categoryId?: string;
  }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;
  const displaySrc =
    previewUrl ?? (imageAction === "remove" ? null : item.imageSrc);

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

    const error = validateMenuItemImageFile(next);
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
    const errors = validateMenuItemMetadata({
      name: String(formData.get("name") ?? ""),
      shortDescription: String(formData.get("short_description") ?? ""),
      price: String(formData.get("price") ?? ""),
      categoryId: String(formData.get("category_id") ?? ""),
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    let uploadedPath: string | null = null;

    if (file) {
      const uploaded = await uploadMenuItemImage(file);
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
      await removeUploadedMenuItemImage(uploadedPath);
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
    formData.set("id", String(item.id));
    setSaving(true);
    await onDelete(formData);
    setSaving(false);
  }

  return (
    <article className="rounded-card border border-border bg-surface px-4 py-4 sm:px-5">
      <form onSubmit={onSubmit} aria-busy={busy} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="image_action" value={imageAction} />

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex shrink-0 flex-col items-center gap-2 sm:w-28">
            <div className="relative aspect-square w-20 overflow-hidden rounded-[1.25rem] bg-surface-warm">
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
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )
              ) : (
                <span className="flex size-full items-center justify-center font-display text-2xl text-caramel-deep">
                  {item.name.trim().charAt(0) || "•"}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-soft">{formatPriceIls(item.price)}</p>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-xs",
                  item.is_visible
                    ? "bg-open-soft text-open"
                    : "bg-surface-warm text-muted",
                )}
              >
                {item.is_visible ? "גלויה" : "מוסתרת"}
              </span>
              <span
                className={cn(
                  "rounded-pill px-2 py-0.5 text-xs",
                  item.is_available
                    ? "bg-open-soft text-open"
                    : "bg-surface-warm text-muted",
                )}
              >
                {item.is_available ? "זמינה" : "לא זמינה"}
              </span>
            </div>
            <MenuItemFields
              idPrefix={formId}
              categories={categories}
              name={item.name}
              shortDescription={item.short_description ?? ""}
              price={formatPriceInput(item.price)}
              categoryId={item.category_id}
              disabled={busy}
              nameError={fieldErrors.name}
              priceError={fieldErrors.price}
              categoryError={fieldErrors.categoryId}
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
            accept={MENU_ITEM_IMAGE_ACCEPT}
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
          {displaySrc || item.imageSrc ? (
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
            aria-pressed={item.is_visible}
            onClick={() => {
              void onToggleVisibility(!item.is_visible);
            }}
          >
            {item.is_visible ? "הסתרה מהאתר" : "הצגה באתר"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="px-4 py-2"
            aria-pressed={item.is_available}
            onClick={() => {
              void onToggleAvailability(!item.is_available);
            }}
          >
            {item.is_available ? "סימון כלא זמינה" : "סימון כזמינה"}
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
              <p className="text-sm text-caramel-deep">למחוק את המנה?</p>
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
