import { defaultLocale, locales, type Locale } from "@/config/locales";

// Content is stored in the default language in its own column ("name") and in
// one extra column per other language ("name_ar", "name_en").
export type TranslationLocale = Exclude<Locale, "he">;

export const translationLocales = locales.filter(
  (locale): locale is TranslationLocale => locale !== defaultLocale,
);

export type TranslationKey<Field extends string> =
  `${Field}_${TranslationLocale}`;

export type Translations<Field extends string> = Record<
  TranslationKey<Field>,
  string | null
>;

// The text of a field in one language; an empty translation falls back to the default.
export function localizedText(
  row: object,
  field: string,
  locale: Locale,
): string | null {
  const values = row as Record<string, unknown>;
  const read = (key: string) => {
    const value = values[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  if (locale !== defaultLocale) {
    const translated = read(`${field}_${locale}`);
    if (translated) {
      return translated;
    }
  }
  return read(field);
}

// The translation inputs of an admin form, ready to store: empty becomes null.
export function readTranslations<Field extends string>(
  formData: FormData,
  fields: readonly Field[],
): Translations<Field> {
  const result = {} as Translations<Field>;
  for (const field of fields) {
    for (const locale of translationLocales) {
      const key: TranslationKey<Field> = `${field}_${locale}`;
      const value = String(formData.get(key) ?? "").trim();
      result[key] = value.length > 0 ? value : null;
    }
  }
  return result;
}

// The profile with its translatable fields replaced by one language's text.
export function localizeProfile<
  Profile extends {
    name: string;
    subtitle: string | null;
    about: string | null;
    address: string | null;
  },
>(profile: Profile, locale: Locale): Profile {
  if (locale === defaultLocale) {
    return profile;
  }

  return {
    ...profile,
    name: localizedText(profile, "name", locale) ?? profile.name,
    subtitle: localizedText(profile, "subtitle", locale),
    about: localizedText(profile, "about", locale),
    address: localizedText(profile, "address", locale),
  };
}
