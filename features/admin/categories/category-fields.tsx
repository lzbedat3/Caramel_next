import { TranslationFields } from "@/components/admin/translation-fields";
import type { TranslationKey } from "@/lib/translations";

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type CategoryFieldsProps = {
  idPrefix: string;
  name?: string;
  subtitle?: string;
  translations?: Partial<
    Record<TranslationKey<"name" | "subtitle">, string | null>
  >;
  nameError?: string;
  disabled?: boolean;
};

export function CategoryFields({
  idPrefix,
  name = "",
  subtitle = "",
  translations,
  nameError,
  disabled,
}: CategoryFieldsProps) {
  const nameId = `${idPrefix}-name`;
  const subtitleId = `${idPrefix}-subtitle`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-foreground text-sm font-medium">
          שם הקטגוריה
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
          className={inputClassName}
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
          htmlFor={subtitleId}
          className="text-foreground text-sm font-medium"
        >
          תת-כותרת
        </label>
        <input
          id={subtitleId}
          name="subtitle"
          defaultValue={subtitle}
          disabled={disabled}
          className={inputClassName}
        />
      </div>
      <TranslationFields
        idPrefix={idPrefix}
        fields={[
          { name: "name", label: "שם הקטגוריה" },
          { name: "subtitle", label: "תת-כותרת" },
        ]}
        values={translations}
        disabled={disabled}
      />
    </div>
  );
}
