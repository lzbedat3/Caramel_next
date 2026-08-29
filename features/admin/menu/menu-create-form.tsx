"use client";

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
  MENU_ITEM_IMAGE_ACCEPT,
  validateMenuItemImageFile,
  validateMenuItemMetadata,
} from "@/lib/admin/menu-item";
import { cn } from "@/lib/cn";
import type { AdminMenuCategoryOption } from "@/services/admin-menu";

import type { MenuItemActionState } from "./actions";
import { MenuItemFields } from "./menu-item-fields";
import {
  removeUploadedMenuItemImage,
  uploadMenuItemImage,
} from "./storage-upload";

type MenuCreateFormProps = {
  categories: AdminMenuCategoryOption[];
  defaultCategoryId?: number;
  disabled: boolean;
  onCreate: (formData: FormData) => Promise<MenuItemActionState>;
};

export function MenuCreateForm({
  categories,
  defaultCategoryId,
  disabled,
  onCreate,
}: MenuCreateFormProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    price?: string;
    categoryId?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const busy = disabled || saving;
  const fileId = `${formId}-file`;
  const visibleId = `${formId}-visible`;
  const availableId = `${formId}-available`;

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
    setFile(next);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(next);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
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

    const result = await onCreate(formData);
    if (result.status === "error" && uploadedPath) {
      await removeUploadedMenuItemImage(uploadedPath);
    }
    if (result.status === "saved") {
      form.reset();
      clearFile();
      setFileError(null);
    }
    setSaving(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={busy}
      className="rounded-card border border-border bg-surface px-5 py-5 sm:px-6"
    >
      <h2 className="text-base font-medium text-foreground">מנה חדשה</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        שם, קטגוריה, מחיר בשקלים ותמונה אופציונלית. JPG, PNG, WebP, AVIF או GIF,
        עד 5MB.
      </p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row">
        <div className="flex flex-col items-center gap-3 sm:w-36">
          <div className="relative aspect-square w-24 overflow-hidden rounded-[1.25rem] bg-surface-warm">
            {previewUrl ? (
              // Local blob preview is not in the remote image loader.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs text-muted-soft">
                תמונה
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            id={fileId}
            type="file"
            accept={MENU_ITEM_IMAGE_ACCEPT}
            onChange={onFileChange}
            disabled={busy}
            className="peer sr-only"
          />
          <label
            htmlFor={fileId}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-pill border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-warm peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              busy && "pointer-events-none opacity-60",
            )}
          >
            {file ? "החלפת תמונה" : "העלאת תמונה"}
          </label>
          {file ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className="px-3 py-2"
              onClick={clearFile}
            >
              הסרת קובץ
            </Button>
          ) : null}
          {fileError ? (
            <p role="alert" className="text-center text-sm text-caramel-deep">
              {fileError}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <MenuItemFields
            idPrefix={formId}
            categories={categories}
            categoryId={defaultCategoryId}
            disabled={busy}
            nameError={fieldErrors.name}
            priceError={fieldErrors.price}
            categoryError={fieldErrors.categoryId}
          />
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label
              htmlFor={visibleId}
              className="flex cursor-pointer items-center gap-2 rounded-control px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                id={visibleId}
                name="is_visible"
                type="checkbox"
                defaultChecked
                disabled={busy}
                className="size-4 accent-caramel"
              />
              <span className="text-sm text-foreground">גלויה באתר</span>
            </label>
            <label
              htmlFor={availableId}
              className="flex cursor-pointer items-center gap-2 rounded-control px-1 py-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                id={availableId}
                name="is_available"
                type="checkbox"
                defaultChecked
                disabled={busy}
                className="size-4 accent-caramel"
              />
              <span className="text-sm text-foreground">זמינה להזמנה</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Button type="submit" disabled={busy}>
          {saving ? "שומר…" : "הוספת מנה"}
        </Button>
      </div>
    </form>
  );
}
