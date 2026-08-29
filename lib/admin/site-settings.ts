import {
  emptyToNull,
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
} from "@/lib/seo";

export type SiteSettingsInput = {
  seoTitle: string;
  seoDescription: string;
};

export type SiteSettingsFieldErrors = Partial<
  Record<keyof SiteSettingsInput, string>
>;

export function siteSettingsInputFromRow(
  row: {
    seo_title: string | null;
    seo_description: string | null;
  } | null,
): SiteSettingsInput {
  return {
    seoTitle: row?.seo_title ?? "",
    seoDescription: row?.seo_description ?? "",
  };
}

export function validateSiteSettingsInput(
  input: SiteSettingsInput,
): SiteSettingsFieldErrors {
  const errors: SiteSettingsFieldErrors = {};
  const title = input.seoTitle.trim();
  const description = input.seoDescription.trim();

  if (title.length > SEO_TITLE_MAX_LENGTH) {
    errors.seoTitle = `כותרת SEO ארוכה מדי (עד ${SEO_TITLE_MAX_LENGTH} תווים)`;
  }

  if (description.length > SEO_DESCRIPTION_MAX_LENGTH) {
    errors.seoDescription = `תיאור SEO ארוך מדי (עד ${SEO_DESCRIPTION_MAX_LENGTH} תווים)`;
  }

  return errors;
}

export function normalizedSiteSettings(input: SiteSettingsInput) {
  return {
    seo_title: emptyToNull(input.seoTitle),
    seo_description: emptyToNull(input.seoDescription),
  };
}
