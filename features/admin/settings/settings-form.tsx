"use client";

import { useActionState, useId } from "react";

import { TranslationFields } from "@/components/admin/translation-fields";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import {
  siteSettingsInputFromRow,
  type SiteSettingsFieldErrors,
} from "@/lib/admin/site-settings";
import { cn } from "@/lib/cn";
import { SEO_DESCRIPTION_MAX_LENGTH, SEO_TITLE_MAX_LENGTH } from "@/lib/seo";
import type { AdminSiteSettings } from "@/services/admin-settings";

import { saveSiteSettings, type SaveSettingsState } from "./actions";

const idleSaveSettingsState: SaveSettingsState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

const inputClassName =
  "w-full rounded-control border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-caramel-deep";

type SettingsFormProps = {
  settings: AdminSiteSettings | null;
  derivedTitle: string;
  derivedDescription: string;
  restaurantActive: boolean;
};

export function SettingsForm({
  settings,
  derivedTitle,
  derivedDescription,
  restaurantActive,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSiteSettings,
    idleSaveSettingsState,
  );

  return (
    <SettingsEditor
      key={settings?.updated_at ?? "new"}
      settings={settings}
      derivedTitle={derivedTitle}
      derivedDescription={derivedDescription}
      restaurantActive={restaurantActive}
      formAction={formAction}
      pending={pending}
      state={state}
    />
  );
}

type SettingsEditorProps = SettingsFormProps & {
  formAction: (formData: FormData) => void;
  pending: boolean;
  state: SaveSettingsState;
};

function SettingsEditor({
  settings,
  derivedTitle,
  derivedDescription,
  restaurantActive,
  formAction,
  pending,
  state,
}: SettingsEditorProps) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const initial = siteSettingsInputFromRow(settings);
  const errors: SiteSettingsFieldErrors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div aria-live="polite" className="min-h-6 text-sm">
        {pending ? (
          <p className="text-muted">שומר…</p>
        ) : state.status === "saved" && state.message ? (
          <p className="text-open">{state.message}</p>
        ) : state.status === "error" && state.message ? (
          <p role="alert" className="text-caramel-deep">
            {state.message}
          </p>
        ) : null}
      </div>

      <section className="rounded-card border-border bg-surface border px-5 py-5 sm:px-6">
        <h2 className="text-foreground text-base font-medium">כתובת האתר</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          כתובת קנונית לייצור מטא-דאטה, מפת האתר ו-robots. מגיעה מהגדרת הסביבה,
          לא מעריכת הפרופיל.
        </p>
        <p
          dir="ltr"
          className="rounded-control border-border bg-surface-warm text-foreground mt-4 border px-4 py-3 font-mono text-sm"
        >
          {siteConfig.url}
        </p>
      </section>

      <section className="rounded-card border-border bg-surface border px-5 py-5 sm:px-6">
        <h2 className="text-foreground text-base font-medium">אינדוקס</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          {restaurantActive
            ? "הפרופיל פעיל. דף הבית הציבורי מאונדקס, ופורטל הניהול נשאר מחוץ לאינדוקס."
            : "הפרופיל אינו פעיל. דף הבית לא יאונדקס עד שהמסעדה תופעל בפרופיל."}
        </p>
        <p className="text-muted mt-3 text-sm leading-6">
          שם, תיאור, כתובת ולוגו מנוהלים ב
          <a
            href={routes.adminProfile}
            className="text-caramel-deep mx-1 underline-offset-2 hover:underline"
          >
            פרופיל המסעדה
          </a>
          .
        </p>
      </section>

      <section className="rounded-card border-border bg-surface border px-5 py-5 sm:px-6">
        <h2 className="text-foreground text-base font-medium">SEO</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          שדות אופציונליים לדף הבית. אם ריקים, ייעשה שימוש בשם המסעדה
          ובתת-הכותרת או בטקסט האודות.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={titleId}
              className="text-foreground text-sm font-medium"
            >
              כותרת לדף הבית
            </label>
            <input
              id={titleId}
              name="seo_title"
              defaultValue={initial.seoTitle}
              disabled={pending}
              maxLength={SEO_TITLE_MAX_LENGTH}
              placeholder={derivedTitle}
              aria-invalid={Boolean(errors.seoTitle)}
              className={cn(inputClassName)}
            />
            {errors.seoTitle ? (
              <p role="alert" className="text-caramel-deep text-sm">
                {errors.seoTitle}
              </p>
            ) : (
              <p className="text-muted-soft text-xs leading-5">
                עד {SEO_TITLE_MAX_LENGTH} תווים. ברירת מחדל: {derivedTitle}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={descriptionId}
              className="text-foreground text-sm font-medium"
            >
              תיאור לדף הבית
            </label>
            <textarea
              id={descriptionId}
              name="seo_description"
              defaultValue={initial.seoDescription}
              disabled={pending}
              maxLength={SEO_DESCRIPTION_MAX_LENGTH}
              rows={4}
              placeholder={derivedDescription}
              aria-invalid={Boolean(errors.seoDescription)}
              className={cn(inputClassName, "min-h-28 resize-y")}
            />
            {errors.seoDescription ? (
              <p role="alert" className="text-caramel-deep text-sm">
                {errors.seoDescription}
              </p>
            ) : (
              <p className="text-muted-soft text-xs leading-5">
                עד {SEO_DESCRIPTION_MAX_LENGTH} תווים. ברירת מחדל:{" "}
                {derivedDescription}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-card border-border bg-surface border px-5 py-5 sm:px-6">
        <h2 className="text-foreground text-lg font-medium">תחתית התפריט</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          שורת הזכויות וההקדשה שמופיעות בסוף התפריט הציבורי. שדה ריק מסתיר את
          השורה שלו.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-credit-name`}
                className="text-foreground text-sm font-medium"
              >
                זכויות שמורות ל
              </label>
              <input
                id={`${formId}-credit-name`}
                name="credit_name"
                defaultValue={settings?.credit_name ?? ""}
                disabled={pending}
                className={inputClassName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${formId}-credit-url`}
                className="text-foreground text-sm font-medium"
              >
                קישור
              </label>
              <input
                id={`${formId}-credit-url`}
                name="credit_url"
                type="url"
                dir="ltr"
                defaultValue={settings?.credit_url ?? ""}
                disabled={pending}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${formId}-dedication-by`}
              className="text-foreground text-sm font-medium"
            >
              נבנה באהבה ע״י
            </label>
            <input
              id={`${formId}-dedication-by`}
              name="dedication_by"
              defaultValue={settings?.dedication_by ?? ""}
              disabled={pending}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${formId}-dedication-to`}
              className="text-foreground text-sm font-medium"
            >
              הקדשה
            </label>
            <textarea
              id={`${formId}-dedication-to`}
              name="dedication_to"
              rows={2}
              defaultValue={settings?.dedication_to ?? ""}
              disabled={pending}
              className={cn(inputClassName, "resize-y")}
            />
          </div>
          <TranslationFields
            idPrefix={`${formId}-footer`}
            fields={[
              { name: "dedication_by", label: "נבנה באהבה ע״י" },
              { name: "dedication_to", label: "הקדשה", multiline: true },
            ]}
            values={settings ?? undefined}
            disabled={pending}
          />
        </div>
      </section>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "שומר…" : "שמירת הגדרות"}
        </Button>
      </div>
    </form>
  );
}
