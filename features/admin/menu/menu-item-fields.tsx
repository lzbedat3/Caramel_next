import { cn } from "@/lib/cn";
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
          <label htmlFor={nameId} className="text-sm font-medium text-foreground">
            שם המנה
            <span className="ms-1 text-caramel-deep" aria-hidden="true">
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
            <p id={`${nameId}-error`} role="alert" className="text-sm text-caramel-deep">
              {nameError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={categoryFieldId}
            className="text-sm font-medium text-foreground"
          >
            קטגוריה
            <span className="ms-1 text-caramel-deep" aria-hidden="true">
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
                {category.isVisible ? category.name : `${category.name} (מוסתרת)`}
              </option>
            ))}
          </select>
          {categoryError ? (
            <p
              id={`${categoryFieldId}-error`}
              role="alert"
              className="text-sm text-caramel-deep"
            >
              {categoryError}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={descriptionId}
          className="text-sm font-medium text-foreground"
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
      <div className="flex max-w-56 flex-col gap-1.5">
        <label htmlFor={priceId} className="text-sm font-medium text-foreground">
          מחיר
          <span className="ms-1 text-caramel-deep" aria-hidden="true">
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
          <span className="text-sm text-muted" aria-hidden="true">
            ₪
          </span>
        </div>
        {priceError ? (
          <p id={`${priceId}-error`} role="alert" className="text-sm text-caramel-deep">
            {priceError}
          </p>
        ) : (
          <p id={`${priceId}-hint`} className="text-xs text-muted-soft">
            מספר בלבד, עד שתי ספרות אחרי הנקודה.
          </p>
        )}
      </div>
    </div>
  );
}
