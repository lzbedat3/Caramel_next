"use client";

import { localeMeta } from "@/config/locales";
import { cn } from "@/lib/cn";
import { translationLocales, type TranslationKey } from "@/lib/translations";

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export type TranslationField<Field extends string> = {
  name: Field;
  label: string;
  multiline?: boolean;
};

type TranslationFieldsProps<Field extends string> = {
  idPrefix: string;
  fields: readonly TranslationField<Field>[];
  values?: Partial<Record<TranslationKey<Field>, string | null>>;
  disabled?: boolean;
  /** Called on any edit, for forms that track unsaved changes. */
  onEdit?: () => void;
  className?: string;
};

// Arabic and English versions of a form's text fields. Folded by default: the
// default-language fields above stay the main thing; an empty translation
// simply shows the default text on that language's menu.
export function TranslationFields<Field extends string>({
  idPrefix,
  fields,
  values = {},
  disabled,
  onEdit,
  className,
}: TranslationFieldsProps<Field>) {
  const keys = fields.flatMap((field) =>
    translationLocales.map(
      (locale): TranslationKey<Field> => `${field.name}_${locale}`,
    ),
  );
  const filled = keys.filter((key) => values[key]?.trim()).length;

  return (
    <details
      className={cn(
        "group rounded-control border-border bg-surface-warm/30 border",
        className,
      )}
    >
      <summary className="rounded-control text-foreground focus-visible:ring-ring flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="text-muted transition-transform group-open:rotate-90 rtl:-scale-x-100"
          >
            ›
          </span>
          תרגומים
          <span className="text-muted font-normal">
            {translationLocales
              .map((locale) => localeMeta[locale].label)
              .join(" · ")}
          </span>
        </span>
        <span
          className={cn(
            "rounded-pill px-2 py-0.5 text-xs",
            filled === keys.length
              ? "bg-caramel-soft/60 text-caramel-deep"
              : "bg-surface text-muted",
          )}
        >
          {filled}/{keys.length}
        </span>
      </summary>
      <div className="border-border flex flex-col gap-3 border-t px-3 py-3">
        {fields.map((field) => (
          <div key={field.name} className="grid gap-3 sm:grid-cols-2">
            {translationLocales.map((locale) => {
              const key: TranslationKey<Field> = `${field.name}_${locale}`;
              const id = `${idPrefix}-${key}`;
              const shared = {
                id,
                name: key,
                lang: locale,
                dir: localeMeta[locale].dir,
                defaultValue: values[key] ?? "",
                disabled,
                onChange: onEdit,
              };
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <label htmlFor={id} className="text-muted text-xs">
                    {field.label} · {localeMeta[locale].label}
                  </label>
                  {field.multiline ? (
                    <textarea
                      {...shared}
                      rows={2}
                      className={cn(inputClassName, "resize-y leading-6")}
                    />
                  ) : (
                    <input {...shared} className={inputClassName} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </details>
  );
}
