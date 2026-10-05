import { TranslationFields } from "@/components/admin/translation-fields";
import { cn } from "@/lib/cn";
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
  categoryId?: number;
  translations?: Partial<
    Record<TranslationKey<"name" | "short_description">, string | null>
  >;
  nameError?: string;
  priceError?: string;
  categoryError?: string;
  disabled?: boolean;
};

export function MenuItemFields({
  idPrefix,
  categories,
  name = "",
  shortDescription = "",
  price = "",
  categoryId,
  translations,
  nameError,
  priceError,
  categoryError,
  disabled,
}: MenuItemFieldsProps) {
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
    </div>
  );
}
