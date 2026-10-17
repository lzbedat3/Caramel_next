"use client";

import { useState } from "react";

import { TranslationFields } from "@/components/admin/translation-fields";
import { formatPriceInput } from "@/lib/admin/menu-item";
import { cn } from "@/lib/cn";
import { SIZES, type SizePrices } from "@/lib/sizes";
import type { TranslationKey } from "@/lib/translations";
import type { AdminMenuCategoryOption } from "@/services/admin-menu";

export const menuInputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type MenuItemFieldsProps = {
  idPrefix: string;
  categories: AdminMenuCategoryOption[];
  name?: string;
  shortDescription?: string;
  price?: string;
  /** Set when the dish already comes in sizes. */
  sizes?: SizePrices | null;
  categoryId?: number;
  translations?: Partial<
    Record<TranslationKey<"name" | "short_description">, string | null>
  >;
  nameError?: string;
  priceError?: string;
  sizesError?: string;
  categoryError?: string;
  disabled?: boolean;
};

export function MenuItemFields({
  idPrefix,
  categories,
  name = "",
  shortDescription = "",
  price = "",
  sizes = null,
  categoryId,
  translations,
  nameError,
  priceError,
  sizesError,
  categoryError,
  disabled,
}: MenuItemFieldsProps) {
  const [hasSizes, setHasSizes] = useState(sizes !== null);
  const sizesToggleId = `${idPrefix}-has-sizes`;
  const nameId = `${idPrefix}-name`;
  const descriptionId = `${idPrefix}-description`;
  const priceId = `${idPrefix}-price`;
  const categoryFieldId = `${idPrefix}-category`;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={nameId}
            className="text-foreground text-sm font-medium"
          >
            שם המנה
            <span className="text-caramel-deep ms-1" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={nameId}
            name="name"
            required
            defaultValue={name}
            disabled={disabled}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            className={menuInputClassName}
          />
          {nameError ? (
            <p
              id={`${nameId}-error`}
              role="alert"
              className="text-caramel-deep text-sm"
            >
              {nameError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={categoryFieldId}
            className="text-foreground text-sm font-medium"
          >
            קטגוריה
            <span className="text-caramel-deep ms-1" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id={categoryFieldId}
            name="category_id"
            required
            defaultValue={categoryId ? String(categoryId) : ""}
            disabled={disabled}
            aria-invalid={Boolean(categoryError)}
            aria-describedby={
              categoryError ? `${categoryFieldId}-error` : undefined
            }
            className={menuInputClassName}
          >
            <option value="" disabled>
              בחירת קטגוריה
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.isVisible
                  ? category.name
                  : `${category.name} (מוסתרת)`}
              </option>
            ))}
          </select>
          {categoryError ? (
            <p
              id={`${categoryFieldId}-error`}
              role="alert"
              className="text-caramel-deep text-sm"
            >
              {categoryError}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={descriptionId}
          className="text-foreground text-sm font-medium"
        >
          תיאור קצר
        </label>
        <textarea
          id={descriptionId}
          name="short_description"
          rows={2}
          defaultValue={shortDescription}
          disabled={disabled}
          className={cn(menuInputClassName, "resize-y leading-6")}
        />
      </div>
      <TranslationFields
        idPrefix={idPrefix}
        fields={[
          { name: "name", label: "שם המנה" },
          { name: "short_description", label: "תיאור קצר", multiline: true },
        ]}
        values={translations}
        disabled={disabled}
      />
      <div className="flex flex-col gap-3">
        <label
          htmlFor={sizesToggleId}
          className="rounded-control has-[:focus-visible]:ring-ring flex w-fit cursor-pointer items-center gap-2 px-1 py-1 has-[:focus-visible]:ring-2"
        >
          <input
            id={sizesToggleId}
            name="has_sizes"
            type="checkbox"
            checked={hasSizes}
            onChange={(event) => setHasSizes(event.target.checked)}
            disabled={disabled}
            className="accent-caramel size-4"
          />
          <span className="text-foreground text-sm">
            המנה מגיעה בגדלים S / M / L
          </span>
        </label>
        {hasSizes ? (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-foreground mb-1.5 text-sm font-medium">
              מחיר לכל גודל
              <span className="text-caramel-deep ms-1" aria-hidden="true">
                *
              </span>
            </legend>
            <div className="grid max-w-md grid-cols-3 gap-2" dir="ltr">
              {SIZES.map((size) => {
                const sizeId = `${idPrefix}-price-${size.toLowerCase()}`;
                return (
                  <div key={size} className="flex flex-col gap-1">
                    <label
                      htmlFor={sizeId}
                      className="text-muted text-xs font-semibold tracking-widest"
                    >
                      {size}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id={sizeId}
                        name={`price_${size.toLowerCase()}`}
                        required
                        inputMode="decimal"
                        defaultValue={
                          sizes ? formatPriceInput(sizes[size]) : ""
                        }
                        disabled={disabled}
                        aria-invalid={Boolean(sizesError)}
                        aria-describedby={`${idPrefix}-sizes-${sizesError ? "error" : "hint"}`}
                        className={menuInputClassName}
                      />
                      <span className="text-muted text-sm" aria-hidden="true">
                        ₪
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {sizesError ? (
              <p
                id={`${idPrefix}-sizes-error`}
                role="alert"
                className="text-caramel-deep text-sm"
              >
                {sizesError}
              </p>
            ) : (
              <p
                id={`${idPrefix}-sizes-hint`}
                className="text-muted-soft text-xs"
              >
                כרטיס אחד ותמונה אחת בתפריט; האורח בוחר גודל. המחיר של S מוצג
                בכל מקום שצריך מחיר אחד.
              </p>
            )}
          </fieldset>
        ) : (
        <div className="flex max-w-56 flex-col gap-1.5">
          <label
            htmlFor={priceId}
            className="text-foreground text-sm font-medium"
          >
            מחיר
            <span className="text-caramel-deep ms-1" aria-hidden="true">
              *
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id={priceId}
              name="price"
              required
              inputMode="decimal"
              dir="ltr"
              defaultValue={price}
              disabled={disabled}
              aria-invalid={Boolean(priceError)}
              aria-describedby={
                priceError ? `${priceId}-error` : `${priceId}-hint`
              }
              className={menuInputClassName}
            />
            <span className="text-muted text-sm" aria-hidden="true">
              ₪
            </span>
          </div>
          {priceError ? (
            <p
              id={`${priceId}-error`}
              role="alert"
              className="text-caramel-deep text-sm"
            >
              {priceError}
            </p>
          ) : (
            <p id={`${priceId}-hint`} className="text-muted-soft text-xs">
              מספר בלבד, עד שתי ספרות אחרי הנקודה.
            </p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
